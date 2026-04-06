import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ──────────────────────────────────────────────────────────

const mockExportDatabase = vi.hoisted(() =>
  vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
)
const mockCreateLog = vi.hoisted(() => vi.fn().mockResolvedValue({}))
const mockCompress = vi.hoisted(() =>
  vi.fn().mockResolvedValue(new Uint8Array([10, 20])),
)
const mockUpload = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    filename: 'backup-1234.sqlite.gz',
    size: 2,
    createdAt: '2026-04-06T00:00:00Z',
  }),
)
const mockGenerateFilename = vi.hoisted(() =>
  vi.fn().mockReturnValue('backup-1234.sqlite.gz'),
)

vi.mock('@/lib/repositories/provider', () => ({
  getDatabase: () => ({
    exportDatabase: mockExportDatabase,
  }),
  getBackupLogRepo: () => ({
    create: mockCreateLog,
  }),
}))

vi.mock('@/lib/backup', () => ({
  createBackupService: () => ({
    exportDatabase: mockCompress,
    upload: mockUpload,
  }),
  generateBackupFilename: mockGenerateFilename,
}))

// ── Import after mocks ─────────────────────────────────────────────────────

import { performBackup } from './perform-backup'

// ── Tests ──────────────────────────────────────────────────────────────────

describe('performBackup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExportDatabase.mockResolvedValue(new Uint8Array([1, 2, 3]))
    mockCompress.mockResolvedValue(new Uint8Array([10, 20]))
    mockUpload.mockResolvedValue({
      filename: 'backup-1234.sqlite.gz',
      size: 2,
      createdAt: '2026-04-06T00:00:00Z',
    })
    mockGenerateFilename.mockReturnValue('backup-1234.sqlite.gz')
    mockCreateLog.mockResolvedValue({})
  })

  it('calls getDatabase().exportDatabase() to get raw DB bytes', async () => {
    await performBackup('manual')
    expect(mockExportDatabase).toHaveBeenCalledOnce()
  })

  it('compresses DB via BackupService.exportDatabase()', async () => {
    const rawBytes = new Uint8Array([1, 2, 3])
    mockExportDatabase.mockResolvedValue(rawBytes)

    await performBackup('manual')

    expect(mockCompress).toHaveBeenCalledWith(rawBytes)
  })

  it('generates filename via generateBackupFilename()', async () => {
    await performBackup('manual')
    expect(mockGenerateFilename).toHaveBeenCalledOnce()
  })

  it('uploads compressed data with generated filename', async () => {
    const compressed = new Uint8Array([10, 20])
    mockCompress.mockResolvedValue(compressed)
    mockGenerateFilename.mockReturnValue('backup-9999.sqlite.gz')

    await performBackup('manual')

    expect(mockUpload).toHaveBeenCalledWith(compressed, 'backup-9999.sqlite.gz')
  })

  it('creates backup log with correct metadata on success', async () => {
    mockUpload.mockResolvedValue({
      filename: 'backup-5555.sqlite.gz',
      size: 1024,
      createdAt: '2026-04-06T00:00:00Z',
    })

    await performBackup('manual')

    expect(mockCreateLog).toHaveBeenCalledWith('manual', 'success', {
      filename: 'backup-5555.sqlite.gz',
      size: 1024,
      durationMs: expect.any(Number),
    })
  })

  it('returns BackupResult with filename, size, and durationMs', async () => {
    mockUpload.mockResolvedValue({
      filename: 'backup-7777.sqlite.gz',
      size: 512,
      createdAt: '2026-04-06T00:00:00Z',
    })

    const result = await performBackup('manual')

    expect(result).toEqual({
      filename: 'backup-7777.sqlite.gz',
      size: 512,
      durationMs: expect.any(Number),
    })
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('accepts triggerType "auto" and logs with auto type', async () => {
    await performBackup('auto')

    expect(mockCreateLog).toHaveBeenCalledWith(
      'auto',
      'success',
      expect.objectContaining({ filename: 'backup-1234.sqlite.gz' }),
    )
  })

  it('throws and logs failure when exportDatabase() fails', async () => {
    mockExportDatabase.mockRejectedValue(new Error('OPFS error'))

    await expect(performBackup('manual')).rejects.toThrow('OPFS error')

    expect(mockCreateLog).toHaveBeenCalledWith('manual', 'failed', {
      errorMessage: 'OPFS error',
    })
  })

  it('throws and logs failure when upload() fails', async () => {
    mockUpload.mockRejectedValue(new Error('Upload failed: 500'))

    await expect(performBackup('manual')).rejects.toThrow('Upload failed: 500')

    expect(mockCreateLog).toHaveBeenCalledWith('manual', 'failed', {
      errorMessage: 'Upload failed: 500',
    })
  })

  it('does not create success log when upload fails', async () => {
    mockUpload.mockRejectedValue(new Error('Network error'))

    await expect(performBackup('auto')).rejects.toThrow()

    expect(mockCreateLog).toHaveBeenCalledTimes(1)
    expect(mockCreateLog).toHaveBeenCalledWith(
      'auto',
      'failed',
      expect.objectContaining({ errorMessage: 'Network error' }),
    )
  })
})
