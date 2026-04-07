/**
 * /api/backup/:filename — Upload, download, or delete a backup file.
 *
 * IMPORTANT: @aws-sdk/client-s3 MUST be imported via dynamic import().
 * Static imports cause Vercel's Function bundler to crash with
 * FUNCTION_INVOCATION_FAILED due to ESM resolution issues in aws-sdk v3.
 * See: https://github.com/aws/aws-sdk-js-v3/issues/6614
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { Readable } from 'node:stream'

const VALID_FILENAME_RE = /^backup-\d+\.sqlite\.gz$/
const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024 // 1 GB
const MAX_BACKUPS = 30

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

async function collectBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export const config = { api: { bodyParser: false } }

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const filename = req.query.filename as string | undefined
  if (!filename || !VALID_FILENAME_RE.test(filename)) {
    res.status(400).json({ success: false, error: 'Invalid filename' })
    return
  }

  const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    S3ServiceException,
  } = await import('@aws-sdk/client-s3')

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

  try {
    switch (req.method) {
      case 'PUT': {
        const contentLength = Number(req.headers['content-length'] ?? 0)
        if (contentLength > MAX_UPLOAD_BYTES) {
          res.status(413).json({ success: false, error: 'File too large (max 1 GB)' })
          return
        }

        const body = await collectBody(req)
        if (body.length > MAX_UPLOAD_BYTES) {
          res.status(413).json({ success: false, error: 'File too large (max 1 GB)' })
          return
        }

        await client.send(
          new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: 'application/gzip' }),
        )

        // Clean up old backups — keep only MAX_BACKUPS newest files
        try {
          const { ListObjectsV2Command } = await import('@aws-sdk/client-s3')
          const listResult = await client.send(
            new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }),
          )
          const backups = (listResult.Contents ?? [])
            .filter(obj => (obj.Key ?? '').endsWith('.sqlite.gz'))
            .sort((a, b) =>
              (b.LastModified?.getTime() ?? 0) - (a.LastModified?.getTime() ?? 0),
            )

          if (backups.length > MAX_BACKUPS) {
            const toDelete = backups.slice(MAX_BACKUPS)
            await Promise.all(
              toDelete.map(obj =>
                client.send(new DeleteObjectCommand({ Bucket: bucket, Key: obj.Key! })),
              ),
            )
          }
        } catch (cleanupErr) {
          // Cleanup failure is non-critical — log but don't fail the upload
          console.error('[api/backup] Cleanup error:', cleanupErr)
        }

        res.status(200).json({
          success: true,
          metadata: { filename, size: body.length, createdAt: new Date().toISOString() },
        })
        break
      }
      case 'GET': {
        const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
        if (!result.Body) {
          res.status(404).json({ success: false, error: 'Backup not found' })
          return
        }
        const buffer = await streamToBuffer(result.Body as Readable)
        res.setHeader('Content-Type', 'application/gzip')
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`)
        res.setHeader('Content-Length', buffer.length)
        res.status(200).send(buffer)
        break
      }
      case 'DELETE': {
        await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
        res.status(200).json({ success: true })
        break
      }
      default:
        res.status(405).json({ success: false, error: 'Method not allowed' })
    }
  } catch (err: unknown) {
    if (err instanceof S3ServiceException && err.$metadata.httpStatusCode === 404) {
      res.status(404).json({ success: false, error: 'Backup not found' })
      return
    }
    console.error(`[api/backup/${filename}] Error:`, err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
