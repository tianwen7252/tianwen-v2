/**
 * Tests for BackupLogRepository.
 * Uses a mock AsyncDatabase since SQLite WASM cannot run in Node/Vitest.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AsyncDatabase } from '@/lib/worker-database'
import { createBackupLogRepository } from './backup-log-repository'

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'mock-id-123'),
}))

function createMockAsyncDb(): AsyncDatabase {
  return {
    exec: vi.fn(async () => ({ rows: [], changes: 0 })),
    exportDatabase: vi.fn(async () => new Uint8Array()),
    importDatabase: vi.fn(async () => undefined),
    restorePreviousDatabase: vi.fn(async () => undefined),
    hasPreviousDatabase: vi.fn(async () => false),
    getPreviousDatabaseSize: vi.fn(async () => 0),
    deletePreviousDatabase: vi.fn(async () => undefined),
  }
}

describe('BackupLogRepository', () => {
  let db: AsyncDatabase

  beforeEach(() => {
    db = createMockAsyncDb()
    vi.clearAllMocks()
  })

  describe('create()', () => {
    it('stores and returns a BackupLog with all fields', async () => {
      const { nanoid } = await import('nanoid')
      vi.mocked(nanoid).mockReturnValue('test-id-001')

      const now = 1700000000000
      vi.spyOn(Date, 'now').mockReturnValue(now)

      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'test-id-001',
              type: 'manual',
              status: 'success',
              filename: 'backup-2024-01-01.sqlite',
              size: 1024000,
              duration_ms: 3500,
              error_message: null,
              created_at: now,
              updated_at: now,
            },
          ],
          changes: 0,
        })

      const repo = createBackupLogRepository(db)
      const result = await repo.create('manual', 'success', {
        filename: 'backup-2024-01-01.sqlite',
        size: 1024000,
        durationMs: 3500,
      })

      expect(db.exec).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO backup_logs'),
        [
          'test-id-001',
          'manual',
          'success',
          'backup-2024-01-01.sqlite',
          1024000,
          3500,
          null,
          now,
        ],
      )

      expect(result).toEqual({
        id: 'test-id-001',
        type: 'manual',
        status: 'success',
        filename: 'backup-2024-01-01.sqlite',
        size: 1024000,
        durationMs: 3500,
        errorMessage: null,
        createdAt: now,
        updatedAt: now,
      })
    })

    it('stores and returns a BackupLog with error message', async () => {
      const { nanoid } = await import('nanoid')
      vi.mocked(nanoid).mockReturnValue('test-id-002')

      const now = 1700000000000
      vi.spyOn(Date, 'now').mockReturnValue(now)

      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'test-id-002',
              type: 'auto',
              status: 'failed',
              filename: 'backup-2024-01-01.sqlite',
              size: 0,
              duration_ms: 500,
              error_message: 'Network timeout',
              created_at: now,
              updated_at: now,
            },
          ],
          changes: 0,
        })

      const repo = createBackupLogRepository(db)
      const result = await repo.create('auto', 'failed', {
        filename: 'backup-2024-01-01.sqlite',
        size: 0,
        durationMs: 500,
        errorMessage: 'Network timeout',
      })

      expect(db.exec).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO backup_logs'),
        [
          'test-id-002',
          'auto',
          'failed',
          'backup-2024-01-01.sqlite',
          0,
          500,
          'Network timeout',
          now,
        ],
      )

      expect(result).toEqual({
        id: 'test-id-002',
        type: 'auto',
        status: 'failed',
        filename: 'backup-2024-01-01.sqlite',
        size: 0,
        durationMs: 500,
        errorMessage: 'Network timeout',
        createdAt: now,
        updatedAt: now,
      })
    })

    it('stores with minimal fields (type + status only)', async () => {
      const { nanoid } = await import('nanoid')
      vi.mocked(nanoid).mockReturnValue('test-id-003')

      const now = 1700000000000
      vi.spyOn(Date, 'now').mockReturnValue(now)

      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'test-id-003',
              type: 'v1-import',
              status: 'success',
              filename: null,
              size: 0,
              duration_ms: 0,
              error_message: null,
              created_at: now,
              updated_at: now,
            },
          ],
          changes: 0,
        })

      const repo = createBackupLogRepository(db)
      const result = await repo.create('v1-import', 'success')

      expect(db.exec).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO backup_logs'),
        ['test-id-003', 'v1-import', 'success', null, 0, 0, null, now],
      )

      expect(result).toEqual({
        id: 'test-id-003',
        type: 'v1-import',
        status: 'success',
        filename: null,
        size: 0,
        durationMs: 0,
        errorMessage: null,
        createdAt: now,
        updatedAt: now,
      })
    })

    it('throws when row not found after insert', async () => {
      const { nanoid } = await import('nanoid')
      vi.mocked(nanoid).mockReturnValue('test-id-missing')
      vi.spyOn(Date, 'now').mockReturnValue(1700000000000)

      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({ rows: [], changes: 0 })

      const repo = createBackupLogRepository(db)
      await expect(repo.create('manual', 'success')).rejects.toThrow(
        'BackupLog insert succeeded but row not found',
      )
    })
  })

  describe('findPaginated()', () => {
    it('returns correct page of results', async () => {
      const mockRows = [
        {
          id: 'log-1',
          type: 'manual',
          status: 'success',
          filename: 'backup-1.sqlite',
          size: 1024,
          duration_ms: 100,
          error_message: null,
          created_at: 1700000002000,
          updated_at: 1700000002000,
        },
        {
          id: 'log-2',
          type: 'auto',
          status: 'success',
          filename: 'backup-2.sqlite',
          size: 2048,
          duration_ms: 200,
          error_message: null,
          created_at: 1700000001000,
          updated_at: 1700000001000,
        },
      ]

      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: mockRows,
        changes: 0,
      })

      const repo = createBackupLogRepository(db)
      const result = await repo.findPaginated(1, 10)

      expect(db.exec).toHaveBeenCalledWith(
        expect.stringContaining(
          'SELECT * FROM backup_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
        ),
        [10, 0],
      )

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 'log-1',
        type: 'manual',
        status: 'success',
        filename: 'backup-1.sqlite',
        size: 1024,
        durationMs: 100,
        errorMessage: null,
        createdAt: 1700000002000,
        updatedAt: 1700000002000,
      })
      expect(result[1]).toEqual({
        id: 'log-2',
        type: 'auto',
        status: 'success',
        filename: 'backup-2.sqlite',
        size: 2048,
        durationMs: 200,
        errorMessage: null,
        createdAt: 1700000001000,
        updatedAt: 1700000001000,
      })
    })

    it('calculates correct offset for page 2', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [],
        changes: 0,
      })

      const repo = createBackupLogRepository(db)
      await repo.findPaginated(2, 20)

      expect(db.exec).toHaveBeenCalledWith(
        expect.stringContaining(
          'SELECT * FROM backup_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
        ),
        [20, 20],
      )
    })

    it('calculates correct offset for page 3 with pageSize 5', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [],
        changes: 0,
      })

      const repo = createBackupLogRepository(db)
      await repo.findPaginated(3, 5)

      expect(db.exec).toHaveBeenCalledWith(
        expect.stringContaining(
          'SELECT * FROM backup_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
        ),
        [5, 10],
      )
    })

    it('returns empty array for out-of-range page', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [],
        changes: 0,
      })

      const repo = createBackupLogRepository(db)
      const result = await repo.findPaginated(100, 10)

      expect(result).toEqual([])
    })

    it('orders by created_at DESC', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [],
        changes: 0,
      })

      const repo = createBackupLogRepository(db)
      await repo.findPaginated(1, 10)

      expect(db.exec).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at DESC'),
        expect.any(Array),
      )
    })

    it('throws when page < 1', async () => {
      const repo = createBackupLogRepository(db)
      await expect(repo.findPaginated(0, 10)).rejects.toThrow(
        'page must be >= 1',
      )
    })

    it('throws when pageSize < 1', async () => {
      const repo = createBackupLogRepository(db)
      await expect(repo.findPaginated(1, 0)).rejects.toThrow(
        'pageSize must be >= 1',
      )
    })
  })

  describe('count()', () => {
    it('returns correct number of records', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [{ count: 42 }],
        changes: 0,
      })

      const repo = createBackupLogRepository(db)
      const result = await repo.count()

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT COUNT(*) AS count FROM backup_logs',
      )
      expect(result).toBe(42)
    })

    it('returns 0 when table is empty', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [{ count: 0 }],
        changes: 0,
      })

      const repo = createBackupLogRepository(db)
      const result = await repo.count()

      expect(result).toBe(0)
    })
  })

  describe('findLatestSuccessfulTimestamp()', () => {
    it('returns the created_at of the most recent successful row', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [{ created_at: 1700000005000 }],
        changes: 0,
      })

      const repo = createBackupLogRepository(db)
      const result = await repo.findLatestSuccessfulTimestamp()

      expect(db.exec).toHaveBeenCalledWith(
        expect.stringContaining("WHERE status = 'success'"),
      )
      expect(db.exec).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at DESC'),
      )
      expect(db.exec).toHaveBeenCalledWith(expect.stringContaining('LIMIT 1'))
      expect(result).toBe(1700000005000)
    })

    it('returns null when no successful backups exist', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({ rows: [], changes: 0 })

      const repo = createBackupLogRepository(db)
      const result = await repo.findLatestSuccessfulTimestamp()

      expect(result).toBeNull()
    })

    it('returns null when row has null created_at', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [{ created_at: null }],
        changes: 0,
      })

      const repo = createBackupLogRepository(db)
      const result = await repo.findLatestSuccessfulTimestamp()

      expect(result).toBeNull()
    })
  })

  describe('clearAll()', () => {
    it('removes all records from backup_logs table', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({ rows: [], changes: 10 })

      const repo = createBackupLogRepository(db)
      await repo.clearAll()

      expect(db.exec).toHaveBeenCalledWith('DELETE FROM backup_logs')
    })
  })

  describe('row mapping', () => {
    it('maps duration_ms to durationMs', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'log-x',
            type: 'manual',
            status: 'success',
            filename: null,
            size: 0,
            duration_ms: 1234,
            error_message: null,
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createBackupLogRepository(db)
      const result = await repo.findPaginated(1, 10)

      expect(result[0]!.durationMs).toBe(1234)
    })

    it('maps error_message to errorMessage', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'log-y',
            type: 'auto',
            status: 'failed',
            filename: null,
            size: 0,
            duration_ms: 0,
            error_message: 'Connection refused',
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createBackupLogRepository(db)
      const result = await repo.findPaginated(1, 10)

      expect(result[0]!.errorMessage).toBe('Connection refused')
    })

    it('maps created_at to createdAt', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'log-z',
            type: 'manual',
            status: 'success',
            filename: null,
            size: 0,
            duration_ms: 0,
            error_message: null,
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createBackupLogRepository(db)
      const result = await repo.findPaginated(1, 10)

      expect(result[0]!.createdAt).toBe(1700000000000)
    })

    it('preserves null filename values', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'log-a',
            type: 'v1-import',
            status: 'success',
            filename: null,
            size: 0,
            duration_ms: 0,
            error_message: null,
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createBackupLogRepository(db)
      const result = await repo.findPaginated(1, 10)

      expect(result[0]!.filename).toBeNull()
    })

    it('preserves null errorMessage values', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'log-b',
            type: 'manual',
            status: 'success',
            filename: 'test.sqlite',
            size: 512,
            duration_ms: 100,
            error_message: null,
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createBackupLogRepository(db)
      const result = await repo.findPaginated(1, 10)

      expect(result[0]!.errorMessage).toBeNull()
    })

    it('preserves string filename values', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'log-c',
            type: 'manual',
            status: 'success',
            filename: 'backup-2024-01-15.sqlite',
            size: 4096,
            duration_ms: 250,
            error_message: null,
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createBackupLogRepository(db)
      const result = await repo.findPaginated(1, 10)

      expect(result[0]!.filename).toBe('backup-2024-01-15.sqlite')
    })

    it('defaults size to 0 when DB returns null', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'log-d',
            type: 'manual',
            status: 'success',
            filename: null,
            size: null,
            duration_ms: null,
            error_message: null,
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createBackupLogRepository(db)
      const result = await repo.findPaginated(1, 10)

      expect(result[0]!.size).toBe(0)
      expect(result[0]!.durationMs).toBe(0)
    })
  })
})
