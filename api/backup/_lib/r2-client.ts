/**
 * Shared R2 helpers for backup API functions.
 * S3Client is created lazily via getR2Client() to avoid bundler issues.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

// ── Validation ────────────────────────────────────────────────────────────

const VALID_FILENAME_RE = /^backup-\d+\.sqlite\.gz$/
export const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024 // 1 GB

export function isValidFilename(filename: string): boolean {
  return VALID_FILENAME_RE.test(filename)
}

export function isFileTooLarge(req: VercelRequest): boolean {
  const contentLength = Number(req.headers['content-length'] ?? 0)
  return contentLength > MAX_UPLOAD_BYTES
}

// ── R2 Config ─────────────────────────────────────────────────────────────

export function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID ?? ''
  const bucketName = process.env.R2_BUCKET_NAME ?? ''
  const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? ''
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? ''
  const userId = process.env.ALLOWED_USER_ID ?? ''
  const keyPrefix = userId.length > 0 ? `${userId}/` : ''

  return { accountId, bucketName, accessKeyId, secretAccessKey, keyPrefix }
}

export function r2Key(prefix: string, filename: string): string {
  return `${prefix}${filename}`
}

// ── Response Helpers ──────────────────────────────────────────────────────

export function jsonResponse(
  res: VercelResponse,
  data: unknown,
  status = 200,
): void {
  res.status(status).json(data)
}

export function errorResponse(
  res: VercelResponse,
  message: string,
  status: number,
): void {
  res.status(status).json({ success: false, error: message })
}
