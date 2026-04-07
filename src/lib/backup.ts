/**
 * Backup/restore service for SQLite database via Vercel Function API.
 * Exports the database as a gzipped file and uploads via same-origin fetch.
 */

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
 * Generate a timestamped backup filename.
 * Format: backup-{unix_timestamp}.sqlite.gz
 */
export function generateBackupFilename(): string {
  return `backup-${Date.now()}.sqlite.gz`
}

/**
 * Create a backup service backed by Vercel Function API (/api/backup).
 * No credentials needed — same-origin request, R2 auth is server-side.
 */
export function createBackupService(): BackupService {
  return {
    async exportDatabase(dbData: Uint8Array): Promise<Uint8Array> {
      return compress(dbData)
    },

    async upload(data: Uint8Array, filename: string): Promise<BackupMetadata> {
      const response = await fetch(`/api/backup/${filename}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/gzip' },
        body: new Blob([data as BlobPart], { type: 'application/gzip' }),
      })

      if (!response.ok) {
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText}`,
        )
      }

      const json = (await response.json()) as {
        success: boolean
        metadata: BackupMetadata
      }

      return json.metadata
    },

    async download(filename: string): Promise<Uint8Array> {
      const response = await fetch(`/api/backup/${filename}`)

      if (!response.ok) {
        throw new Error(
          `Download failed: ${response.status} ${response.statusText}`,
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
