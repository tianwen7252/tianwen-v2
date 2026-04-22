import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  compress,
  decompress,
  generateBackupFilename,
  createBackupService,
} from './backup'

// ─── Module Mocks ──────────────────────────────────────────────────────────

let mockDeviceDisplayName = 'Browser-test123'

vi.mock('@/lib/device', () => ({
  getDeviceDisplayName: () => mockDeviceDisplayName,
}))

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
    it('should generate a filename with device display name as label', () => {
      mockDeviceDisplayName = 'iPad-MAIN'
      const filename = generateBackupFilename()

      // Format: tianwen-<label>-YYYY-MM-DD_HH-mm-ss.sqlite.gz
      expect(filename).toMatch(
        /^tianwen-iPad-MAIN-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.sqlite\.gz$/,
      )
    })

    it('should use default device display name when no custom name set', () => {
      mockDeviceDisplayName = 'Browser-test123'
      const filename = generateBackupFilename()

      expect(filename).toMatch(
        /^tianwen-Browser-test123-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.sqlite\.gz$/,
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

    it('should upload via presigned URL flow (presign → PUT → complete)', async () => {
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        // 1. POST /api/backup/presign
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            presignedUrl: 'https://r2.example.com/presigned-put',
            filename: 'backup-2026-04-07_13-00-00.sqlite.gz',
          }),
        } as Response)
        // 2. PUT to presigned URL
        .mockResolvedValueOnce({ ok: true } as Response)
        // 3. POST /api/backup/complete
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, verified: true, deleted: 0 }),
        } as Response)

      const service = createBackupService()
      const data = new Uint8Array([1, 2, 3])
      const metadata = await service.upload(
        data,
        'backup-2026-04-07_13-00-00.sqlite.gz',
      )

      expect(fetchSpy).toHaveBeenCalledTimes(3)
      // Presign call
      expect(fetchSpy).toHaveBeenNthCalledWith(
        1,
        '/api/backup/presign',
        expect.objectContaining({ method: 'POST' }),
      )
      // Direct R2 upload
      expect(fetchSpy).toHaveBeenNthCalledWith(
        2,
        'https://r2.example.com/presigned-put',
        expect.objectContaining({ method: 'PUT' }),
      )
      // Complete notification
      expect(fetchSpy).toHaveBeenNthCalledWith(
        3,
        '/api/backup/complete',
        expect.objectContaining({ method: 'POST' }),
      )
      expect(metadata.filename).toBe('backup-2026-04-07_13-00-00.sqlite.gz')
      expect(metadata.size).toBe(3)
    })

    it('should throw when presign fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response)

      const service = createBackupService()
      const data = new Uint8Array([1, 2, 3])

      await expect(
        service.upload(data, 'backup-2026-04-07_13-00-00.sqlite.gz'),
      ).rejects.toThrow('Presign failed')
    })

    it('should throw when R2 upload fails', async () => {
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            presignedUrl: 'https://r2.example.com/presigned-put',
            filename: 'backup-2026-04-07_13-00-00.sqlite.gz',
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          statusText: 'Forbidden',
        } as Response)

      const service = createBackupService()
      const data = new Uint8Array([1, 2, 3])

      await expect(
        service.upload(data, 'backup-2026-04-07_13-00-00.sqlite.gz'),
      ).rejects.toThrow('Upload to R2 failed')
    })

    it('should download via presigned URL flow', async () => {
      const binaryData = new Uint8Array([1, 2, 3])
      vi.spyOn(globalThis, 'fetch')
        // 1. POST /api/backup/presign
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            presignedUrl: 'https://r2.example.com/presigned-get',
            filename: 'backup-2026-04-07_13-00-00.sqlite.gz',
          }),
        } as Response)
        // 2. GET from presigned URL
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => binaryData.buffer,
        } as Response)

      const service = createBackupService()
      const result = await service.download(
        'backup-2026-04-07_13-00-00.sqlite.gz',
      )

      expect(result).toBeInstanceOf(Uint8Array)
      expect(result).toEqual(binaryData)
    })

    it('should throw when download presign fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response)

      const service = createBackupService()

      await expect(
        service.download('backup-2026-04-07_13-00-00.sqlite.gz'),
      ).rejects.toThrow('Presign failed')
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
