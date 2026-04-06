/**
 * Shared R2 client and helpers for backup API functions.
 * Uses @aws-sdk/client-s3 to access Cloudflare R2 (S3-compatible).
 *
 * NOTE: Uses dynamic import() for @aws-sdk/client-s3 because Vercel's
 * Function bundler fails with static ESM imports of this package.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

// ── Env Validation ────────────────────────────────────────────────────────

interface R2Env {
  readonly accountId: string
  readonly accessKeyId: string
  readonly secretAccessKey: string
  readonly bucketName: string
  readonly userIdPrefix: string
}

function validateEnv(): R2Env {
  const accountId = process.env.R2_ACCOUNT_ID ?? ''
  const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? ''
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? ''
  const bucketName = process.env.R2_BUCKET_NAME ?? ''

  const missing = Object.entries({
    R2_ACCOUNT_ID: accountId,
    R2_ACCESS_KEY_ID: accessKeyId,
    R2_SECRET_ACCESS_KEY: secretAccessKey,
    R2_BUCKET_NAME: bucketName,
  })
    .filter(([, v]) => v.length === 0)
    .map(([k]) => k)

  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`)
  }

  const userId = process.env.ALLOWED_USER_ID ?? ''
  const userIdPrefix = userId.length > 0 ? `${userId}/` : ''

  return { accountId, accessKeyId, secretAccessKey, bucketName, userIdPrefix }
}

// ── R2 Client (lazy init via dynamic import) ─────────────────────────────

type S3ClientType = import('@aws-sdk/client-s3').S3Client

let _client: S3ClientType | null = null
let _env: R2Env | null = null

function getEnv(): R2Env {
  if (!_env) _env = validateEnv()
  return _env
}

export async function getR2Client(): Promise<S3ClientType> {
  if (_client) return _client

  const { S3Client } = await import('@aws-sdk/client-s3')
  const env = getEnv()
  _client = new S3Client({
    region: 'auto',
    endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.accessKeyId,
      secretAccessKey: env.secretAccessKey,
    },
  })

  return _client
}

export function getBucketName(): string {
  return getEnv().bucketName
}

// ── R2 Key ────────────────────────────────────────────────────────────────

export function getKeyPrefix(): string {
  return getEnv().userIdPrefix
}

export function r2Key(filename: string): string {
  return `${getKeyPrefix()}${filename}`
}

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

// ── S3 Command factories (dynamic import) ────────────────────────────────

export async function getS3Commands() {
  const {
    ListObjectsV2Command,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    S3ServiceException,
  } = await import('@aws-sdk/client-s3')
  return {
    ListObjectsV2Command,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    S3ServiceException,
  }
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
