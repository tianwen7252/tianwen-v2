/**
 * /api/backup/:filename — Upload, download, or delete a backup file.
 *
 * PUT    — Upload a backup file to R2
 * GET    — Download a backup file from R2
 * DELETE — Delete a backup file from R2
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  S3ServiceException,
} from '@aws-sdk/client-s3'
import type { Readable } from 'node:stream'
import {
  getR2Client,
  getBucketName,
  r2Key,
  isValidFilename,
  isFileTooLarge,
  errorResponse,
  jsonResponse,
  MAX_UPLOAD_BYTES,
} from './_lib/r2-client'

// ── Stream to Buffer ──────────────────────────────────────────────────────

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

// ── Collect request body ──────────────────────────────────────────────────

async function collectBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

// ── Handler ───────────────────────────────────────────────────────────────

export const config = {
  api: {
    bodyParser: false, // Handle binary body manually
  },
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const filename = req.query.filename as string | undefined
  if (!filename || !isValidFilename(filename)) {
    errorResponse(res, 'Invalid filename', 400)
    return
  }

  const client = getR2Client()
  const bucket = getBucketName()
  const key = r2Key(filename)

  try {
    switch (req.method) {
      case 'PUT':
        await handleUpload(req, res, client, bucket, key, filename)
        break
      case 'GET':
        await handleDownload(res, client, bucket, key, filename)
        break
      case 'DELETE':
        await handleDelete(res, client, bucket, key)
        break
      default:
        errorResponse(res, 'Method not allowed', 405)
    }
  } catch (err: unknown) {
    // S3 NoSuchKey → 404
    if (err instanceof S3ServiceException && err.$metadata.httpStatusCode === 404) {
      errorResponse(res, 'Backup not found', 404)
      return
    }

    console.error(`[api/backup/${filename}] Error:`, err)
    errorResponse(res, 'Internal server error', 500)
  }
}

// ── Upload ────────────────────────────────────────────────────────────────

async function handleUpload(
  req: VercelRequest,
  res: VercelResponse,
  client: ReturnType<typeof getR2Client>,
  bucket: string,
  key: string,
  filename: string,
): Promise<void> {
  // Early reject based on Content-Length header
  if (isFileTooLarge(req)) {
    errorResponse(res, 'File too large (max 1 GB)', 413)
    return
  }

  const body = await collectBody(req)

  // Verify actual body size (Content-Length can be spoofed)
  if (body.length > MAX_UPLOAD_BYTES) {
    errorResponse(res, 'File too large (max 1 GB)', 413)
    return
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: 'application/gzip',
    }),
  )

  jsonResponse(res, {
    success: true,
    metadata: {
      filename,
      size: body.length,
      createdAt: new Date().toISOString(),
    },
  })
}

// ── Download ──────────────────────────────────────────────────────────────

async function handleDownload(
  res: VercelResponse,
  client: ReturnType<typeof getR2Client>,
  bucket: string,
  key: string,
  filename: string,
): Promise<void> {
  const result = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  )

  if (!result.Body) {
    errorResponse(res, 'Backup not found', 404)
    return
  }

  const buffer = await streamToBuffer(result.Body as Readable)

  res.setHeader('Content-Type', 'application/gzip')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
  )
  res.setHeader('Content-Length', buffer.length)
  res.status(200).send(buffer)
}

// ── Delete ────────────────────────────────────────────────────────────────

async function handleDelete(
  res: VercelResponse,
  client: ReturnType<typeof getR2Client>,
  bucket: string,
  key: string,
): Promise<void> {
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  )

  jsonResponse(res, { success: true })
}
