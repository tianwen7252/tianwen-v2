/**
 * Backup/restore service for SQLite database.
 * Uses presigned URLs for direct R2 upload/download to bypass
 * Vercel Function's 4.5 MB payload limit.
 */

import { getDeviceDisplayName } from '@/lib/device'

export interface BackupMetadata {
  readonly filename: string
  readonly size: number
  readonly createdAt: string
}

export interface BackupService {
  exportDatabase(dbData: Uint8Array): Promise<Uint8Array>
  upload(data: Uint8Array, filename: string): Promise<BackupMetadata>
  download(filename: string): Promise<Uint8Array>
  restoreDatabase(compressed: Uint8Array): Promise<Uint8Array>
  listBackups(): Promise<readonly BackupMetadata[]>
}

/**
 * Compress data using gzip via the browser's CompressionStream API.
 */
export async function compress(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(new CompressionStream('gzip'))

  const reader = stream.getReader()
  const chunks: Uint8Array[] = []

  let done = false
  while (!done) {
    const result = await reader.read()
    done = result.done
    if (result.value) {
      chunks.push(result.value)
    }
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const compressed = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of chunks) {
    compressed.set(chunk, offset)
    offset += chunk.length
  }

  return compressed
}

/**
 * Decompress gzipped data using the browser's DecompressionStream API.
 */
export async function decompress(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream('gzip'))

  const reader = stream.getReader()
  const chunks: Uint8Array[] = []

  let done = false
  while (!done) {
    const result = await reader.read()
    done = result.done
    if (result.value) {
      chunks.push(result.value)
    }
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const decompressed = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of chunks) {
    decompressed.set(chunk, offset)
    offset += chunk.length
  }

  return decompressed
}

/**
 * Format a date as YYYY-MM-DD_HH-mm-ss in Taiwan time (UTC+8).
 */
function formatTaiwanTimestamp(date: Date): string {
  const tw = new Date(date.getTime() + 8 * 60 * 60 * 1000)
  const y = tw.getUTCFullYear()
  const mo = String(tw.getUTCMonth() + 1).padStart(2, '0')
  const d = String(tw.getUTCDate()).padStart(2, '0')
  const h = String(tw.getUTCHours()).padStart(2, '0')
  const mi = String(tw.getUTCMinutes()).padStart(2, '0')
  const s = String(tw.getUTCSeconds()).padStart(2, '0')
  return `${y}-${mo}-${d}_${h}-${mi}-${s}`
}

/**
 * Generate a timestamped backup filename.
 * Uses the device display name (user-set or default "{type}-{id}") as the label.
 * Format: tianwen-<label>-YYYY-MM-DD_HH-mm-ss.sqlite.gz (Taiwan time)
 */
export function generateBackupFilename(): string {
  const label = getDeviceDisplayName()
  return `tianwen-${label}-${formatTaiwanTimestamp(new Date())}.sqlite.gz`
}

/**
 * Generate a timestamped export filename.
 * Format: tianwen-db-YYYY-MM-DD_HH-mm-ss.sqlite (Taiwan time)
 */
export function generateExportFilename(): string {
  return `tianwen-db-${formatTaiwanTimestamp(new Date())}.sqlite`
}

// ── Presigned URL helpers ──────────────────────────────────────────────────

interface PresignResponse {
  readonly success: boolean
  readonly presignedUrl: string
  readonly filename: string
  readonly error?: string
}

async function getPresignedUrl(
  action: 'upload' | 'download',
  filename: string,
): Promise<string> {
  const response = await fetch('/api/backup/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, filename }),
  })

  if (!response.ok) {
    throw new Error(`Presign failed: ${response.status} ${response.statusText}`)
  }

  const json = (await response.json()) as PresignResponse
  if (!json.success || !json.presignedUrl) {
    throw new Error(json.error ?? 'Failed to get presigned URL')
  }

  return json.presignedUrl
}

async function notifyUploadComplete(filename: string): Promise<void> {
  const response = await fetch('/api/backup/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename }),
  })

  if (!response.ok) {
    throw new Error(
      `Complete notification failed: ${response.status} ${response.statusText}`,
    )
  }
}

// ── Service ────────────────────────────────────────────────────────────────

/**
 * Create a backup service using presigned URLs for direct R2 access.
 * Upload/download bypass Vercel Function's 4.5 MB payload limit.
 * List and delete still go through Vercel Functions (small payloads).
 */
export function createBackupService(): BackupService {
  return {
    async exportDatabase(dbData: Uint8Array): Promise<Uint8Array> {
      return compress(dbData)
    },

    async upload(data: Uint8Array, filename: string): Promise<BackupMetadata> {
      // 1. Get presigned PUT URL
      const presignedUrl = await getPresignedUrl('upload', filename)

      // 2. Upload directly to R2
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/gzip' },
        body: new Blob([data as BlobPart], { type: 'application/gzip' }),
      })

      if (!response.ok) {
        throw new Error(
          `Upload to R2 failed: ${response.status} ${response.statusText}`,
        )
      }

      // 3. Notify server to verify + cleanup old backups
      await notifyUploadComplete(filename)

      return {
        filename,
        size: data.length,
        createdAt: new Date().toISOString(),
      }
    },

    async download(filename: string): Promise<Uint8Array> {
      // 1. Get presigned GET URL
      const presignedUrl = await getPresignedUrl('download', filename)

      // 2. Download directly from R2
      const response = await fetch(presignedUrl)

      if (!response.ok) {
        throw new Error(
          `Download from R2 failed: ${response.status} ${response.statusText}`,
        )
      }

      return new Uint8Array(await response.arrayBuffer())
    },

    async restoreDatabase(compressed: Uint8Array): Promise<Uint8Array> {
      return decompress(compressed)
    },

    async listBackups(): Promise<readonly BackupMetadata[]> {
      const response = await fetch('/api/backup')

      if (!response.ok) {
        throw new Error(
          `List backups failed: ${response.status} ${response.statusText}`,
        )
      }

      const json = (await response.json()) as {
        success: boolean
        data: BackupMetadata[]
      }

      return (json.data ?? []).filter(item =>
        item.filename.endsWith('.sqlite.gz'),
      )
    },
  }
}
