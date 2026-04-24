/**
 * /api/backup/:filename — Delete a backup file from R2.
 *
 * Upload and download now use presigned URLs (see presign.ts).
 * This endpoint only handles DELETE requests.
 *
 * IMPORTANT: @aws-sdk/client-s3 MUST be imported via dynamic import().
 * Static imports cause Vercel's Function bundler to crash with
 * FUNCTION_INVOCATION_FAILED due to ESM resolution issues in aws-sdk v3.
 * See: https://github.com/aws/aws-sdk-js-v3/issues/6614
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

const VALID_FILENAME_RE =
  /^tianwen-.+-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.sqlite\.gz$/

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'DELETE') {
    res.status(405).json({ success: false, error: 'Method not allowed' })
    return
  }

  const filename = req.query.filename as string | undefined
  if (!filename || !VALID_FILENAME_RE.test(filename)) {
    res.status(400).json({ success: false, error: 'Invalid filename' })
    return
  }

  try {
    const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3')

    const accountId = process.env.R2_ACCOUNT_ID ?? ''
    const bucket = process.env.R2_BUCKET_NAME ?? ''
    const key = filename

    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
      },
    })

    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
    res.status(200).json({ success: true })
  } catch (err: unknown) {
    const { S3ServiceException } = await import('@aws-sdk/client-s3')
    if (
      err instanceof S3ServiceException &&
      err.$metadata.httpStatusCode === 404
    ) {
      res.status(404).json({ success: false, error: 'Backup not found' })
      return
    }
    console.error(`[api/backup/${filename}] Error:`, err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
