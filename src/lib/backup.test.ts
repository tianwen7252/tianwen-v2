import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  compress,
  decompress,
  generateBackupFilename,
  createBackupService,
} from './backup'

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('backup utilities', () => {
  describe('compress / decompress', () => {
    it('should compress and decompress data roundtrip', async () => {
      const original = new TextEncoder().encode(
        'Hello, SQLite WASM backup test!',
      )
      const compressed = await compress(original)
      const decompressed = await decompress(compressed)

      expect(decompressed).toEqual(original)
    })

    it('should produce smaller output for compressible data', async () => {
      const repeating = new Uint8Array(1000).fill(65)
      const compressed = await compress(repeating)

      expect(compressed.length).toBeLessThan(repeating.length)
    })

    it('should handle empty data', async () => {
      const empty = new Uint8Array(0)
      const compressed = await compress(empty)
      const decompressed = await decompress(compressed)

      expect(decompressed).toEqual(empty)
    })
  })

  describe('generateBackupFilename', () => {
    it('should generate a filename with date timestamp', () => {
      const filename = generateBackupFilename()

      expect(filename).toMatch(
        /^backup-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.sqlite\.gz$/,
      )
    })
  })

  describe('createBackupService', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('should export database with compression', async () => {
      const service = createBackupService()
      const dbData = new TextEncoder().encode('fake sqlite db data')
      const compressed = await service.exportDatabase(dbData)

      expect(compressed).toBeInstanceOf(Uint8Array)
      expect(compressed.length).toBeGreaterThan(0)
    })

    it('should upload compressed data via PUT to /api/backup', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          metadata: {
            filename: 'backup-2026-04-07_13-00-00.sqlite.gz',
            size: 3,
            createdAt: '2026-03-30T00:00:00Z',
          },
        }),
      } as Response)

      const service = createBackupService()
      const data = new Uint8Array([1, 2, 3])
      const metadata = await service.upload(
        data,
        'backup-2026-04-07_13-00-00.sqlite.gz',
      )

      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/backup/backup-2026-04-07_13-00-00.sqlite.gz',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/gzip' },
          body: expect.any(Blob),
        }),
      )
      expect(metadata.filename).toBe('backup-2026-04-07_13-00-00.sqlite.gz')
      expect(metadata.size).toBe(3)
      expect(metadata.createdAt).toBe('2026-03-30T00:00:00Z')
    })

    it('should throw when upload returns non-ok response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response)

      const service = createBackupService()
      const data = new Uint8Array([1, 2, 3])

      await expect(
        service.upload(data, 'backup-123.sqlite.gz'),
      ).rejects.toThrow('Upload failed')
    })

    it('should download backup file via GET from /api/backup', async () => {
      const binaryData = new Uint8Array([1, 2, 3])
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => binaryData.buffer,
      } as Response)

      const service = createBackupService()
      const result = await service.download('backup-123.sqlite.gz')

      expect(fetchSpy).toHaveBeenCalledWith('/api/backup/backup-123.sqlite.gz')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result).toEqual(binaryData)
    })

    it('should throw when download returns non-ok response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response)

      const service = createBackupService()

      await expect(service.download('missing.sqlite.gz')).rejects.toThrow(
        'Download failed',
      )
    })

    it('should restore database from compressed data', async () => {
      const service = createBackupService()
      const original = new TextEncoder().encode('restore test data')
      const compressed = await compress(original)
      const restored = await service.restoreDatabase(compressed)

      expect(restored).toEqual(original)
    })

    it('should list only .sqlite.gz backups via GET from /api/backup', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            {
              filename: 'backup-2026-04-07_13-00-00.sqlite.gz',
              size: 1024,
              createdAt: '2026-03-21T10:00:00Z',
            },
            {
              filename: 'other-file.txt',
              size: 512,
              createdAt: '2026-03-20T10:00:00Z',
            },
          ],
        }),
      } as Response)

      const service = createBackupService()
      const backups = await service.listBackups()

      expect(fetchSpy).toHaveBeenCalledWith('/api/backup')
      expect(backups).toHaveLength(1)
      expect(backups[0]?.filename).toBe('backup-2026-04-07_13-00-00.sqlite.gz')
      expect(backups[0]?.size).toBe(1024)
    })

    it('should throw when listBackups returns non-ok response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      } as Response)

      const service = createBackupService()

      await expect(service.listBackups()).rejects.toThrow('List backups failed')
    })
  })
})
