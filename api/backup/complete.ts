/**
 * POST /api/backup/complete — Verify upload and clean up old backups.
 *
 * Called after a successful presigned URL upload. Verifies the file
 * exists in R2, then deletes backups exceeding MAX_BACKUPS.
 *
 * Request body:
 *   { filename: 'backup-2026-04-07_14-00-00.sqlite.gz' }
 *
 * Response:
 *   { success: true, verified: true, deleted: 2 }
 *
 * IMPORTANT: @aws-sdk must be dynamically imported.
 * See: https://github.com/aws/aws-sdk-js-v3/issues/6614
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

const VALID_FILENAME_RE =
  /^tianwen-.+-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.sqlite\.gz$/
const MAX_BACKUPS = 30

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' })
    return
  }

  try {
    const { filename } = req.body as { filename?: string }

    if (!filename || !VALID_FILENAME_RE.test(filename)) {
      res.status(400).json({ success: false, error: 'Invalid filename' })
      return
    }

    const {
      S3Client,
      HeadObjectCommand,
      ListObjectsV2Command,
      DeleteObjectCommand,
    } = await import('@aws-sdk/client-s3')

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

    // 1. Verify the file exists in R2
    try {
      await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    } catch {
      res.status(404).json({ success: false, error: 'File not found in R2' })
      return
    }

    // 2. Clean up old backups — keep only MAX_BACKUPS newest
    let deleted = 0
    try {
      const listResult = await client.send(
        new ListObjectsV2Command({ Bucket: bucket, Prefix: '' }),
      )
      const backups = (listResult.Contents ?? [])
        .filter(obj => (obj.Key ?? '').endsWith('.sqlite.gz'))
        .sort(
          (a, b) =>
            (b.LastModified?.getTime() ?? 0) - (a.LastModified?.getTime() ?? 0),
        )

      if (backups.length > MAX_BACKUPS) {
        const toDelete = backups.slice(MAX_BACKUPS)
        await Promise.all(
          toDelete.map(obj =>
            client.send(
              new DeleteObjectCommand({ Bucket: bucket, Key: obj.Key! }),
            ),
          ),
        )
        deleted = toDelete.length
      }
    } catch (cleanupErr) {
      console.error('[api/backup/complete] Cleanup error:', cleanupErr)
      // Non-critical — file was verified, just cleanup failed
    }

    res.status(200).json({ success: true, verified: true, deleted })
  } catch (err: unknown) {
    console.error('[api/backup/complete] Error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
