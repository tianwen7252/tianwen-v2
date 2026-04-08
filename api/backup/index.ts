/**
 * GET /api/backup — List all backup files from R2.
 *
 * IMPORTANT: @aws-sdk/client-s3 MUST be imported via dynamic import().
 * Static imports cause Vercel's Function bundler to crash with
 * FUNCTION_INVOCATION_FAILED due to ESM resolution issues in aws-sdk v3.
 * See: https://github.com/aws/aws-sdk-js-v3/issues/6614
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed' })
    return
  }

  try {
    const { S3Client, ListObjectsV2Command } = await import('@aws-sdk/client-s3')

    const accountId = process.env.R2_ACCOUNT_ID ?? ''
    const bucketName = process.env.R2_BUCKET_NAME ?? ''

    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
      },
    })

    const objects: Array<{ filename: string; size: number; createdAt: string }> = []
    let continuationToken: string | undefined

    do {
      const result = await client.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: '',
          ContinuationToken: continuationToken,
          MaxKeys: 1000,
        }),
      )

      for (const obj of result.Contents ?? []) {
        const key = obj.Key ?? ''
        if (!key.endsWith('.sqlite.gz')) continue
        objects.push({
          filename: key,
          size: obj.Size ?? 0,
          createdAt: obj.LastModified?.toISOString() ?? new Date().toISOString(),
        })
      }

      continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined
    } while (continuationToken)

    objects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    res.status(200).json({ success: true, data: objects })
  } catch (err: unknown) {
    console.error('[api/backup] List error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.status(500).json({ success: false, error: message })
  }
}
