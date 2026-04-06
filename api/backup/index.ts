/**
 * GET /api/backup — List all backup files from R2.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getR2Config, errorResponse, jsonResponse } from './_lib/r2-client'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'GET') {
    errorResponse(res, 'Method not allowed', 405)
    return
  }

  try {
    const { S3Client, ListObjectsV2Command } = await import('@aws-sdk/client-s3')
    const cfg = getR2Config()

    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    })

    const objects: Array<{ filename: string; size: number; createdAt: string }> = []
    let continuationToken: string | undefined

    do {
      const result = await client.send(
        new ListObjectsV2Command({
          Bucket: cfg.bucketName,
          Prefix: cfg.keyPrefix,
          ContinuationToken: continuationToken,
          MaxKeys: 1000,
        }),
      )

      for (const obj of result.Contents ?? []) {
        const key = obj.Key ?? ''
        if (!key.endsWith('.sqlite.gz')) continue
        objects.push({
          filename: key.replace(cfg.keyPrefix, ''),
          size: obj.Size ?? 0,
          createdAt: obj.LastModified?.toISOString() ?? new Date().toISOString(),
        })
      }

      continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined
    } while (continuationToken)

    objects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    jsonResponse(res, { success: true, data: objects })
  } catch (err: unknown) {
    console.error('[api/backup] List error:', err)
    errorResponse(res, 'Internal server error', 500)
  }
}
