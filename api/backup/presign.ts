/**
 * POST /api/backup/presign — Generate presigned URLs for direct R2 upload/download.
 *
 * Request body:
 *   { action: 'upload', filename: 'backup-2026-04-07_14-00-00.sqlite.gz' }
 *   { action: 'download', filename: 'backup-2026-04-07_14-00-00.sqlite.gz' }
 *
 * Response:
 *   { success: true, presignedUrl: '...', filename: '...' }
 *
 * IMPORTANT: @aws-sdk must be dynamically imported.
 * See: https://github.com/aws/aws-sdk-js-v3/issues/6614
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

const VALID_FILENAME_RE = /^backup-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.sqlite\.gz$/
const PRESIGN_EXPIRY_SECONDS = 600 // 10 minutes

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' })
    return
  }

  try {
    const { action, filename } = req.body as {
      action?: string
      filename?: string
    }

    if (!action || !filename || !VALID_FILENAME_RE.test(filename)) {
      res.status(400).json({ success: false, error: 'Invalid action or filename' })
      return
    }

    if (action !== 'upload' && action !== 'download') {
      res.status(400).json({ success: false, error: 'Action must be "upload" or "download"' })
      return
    }

    const { S3Client, PutObjectCommand, GetObjectCommand } =
      await import('@aws-sdk/client-s3')
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')

    const accountId = process.env.R2_ACCOUNT_ID ?? ''
    const userId = process.env.ALLOWED_USER_ID ?? ''
    const prefix = userId.length > 0 ? `${userId}/` : ''
    const bucket = process.env.R2_BUCKET_NAME ?? ''
    const key = `${prefix}${filename}`

    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
      },
    })

    const command =
      action === 'upload'
        ? new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            ContentType: 'application/gzip',
          })
        : new GetObjectCommand({
            Bucket: bucket,
            Key: key,
          })

    const presignedUrl = await getSignedUrl(client, command, {
      expiresIn: PRESIGN_EXPIRY_SECONDS,
    })

    res.status(200).json({ success: true, presignedUrl, filename })
  } catch (err: unknown) {
    console.error('[api/backup/presign] Error:', err)
    res.status(500).json({ success: false, error: 'Failed to generate presigned URL' })
  }
}
