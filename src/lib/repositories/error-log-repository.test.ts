/**
 * Tests for ErrorLogRepository.
 * Uses a mock AsyncDatabase since SQLite WASM cannot run in Node/Vitest.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AsyncDatabase } from '@/lib/worker-database'
import { createErrorLogRepository } from './error-log-repository'

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
  }
}

describe('ErrorLogRepository', () => {
  let db: AsyncDatabase

  beforeEach(() => {
    db = createMockAsyncDb()
    vi.restoreAllMocks()
  })

  describe('create()', () => {
    it('inserts a log entry with message, source, and stack', async () => {
      const { nanoid } = await import('nanoid')
      vi.mocked(nanoid).mockReturnValue('test-id-001')

      const now = 1700000000000
      vi.spyOn(Date, 'now').mockReturnValue(now)

      // Mock the INSERT to succeed, then the SELECT to return the inserted row
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'test-id-001',
              message: 'Something went wrong',
              source: 'window.onerror',
              stack: 'Error: Something went wrong\n  at foo.js:1',
              created_at: now,
              updated_at: now,
            },
          ],
          changes: 0,
        })

      const repo = createErrorLogRepository(db)
      const result = await repo.create(
        'Something went wrong',
        'window.onerror',
        'Error: Something went wrong\n  at foo.js:1',
      )

      expect(db.exec).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO error_logs'),
        [
          'test-id-001',
          'Something went wrong',
          'window.onerror',
          'Error: Something went wrong\n  at foo.js:1',
          now,
        ],
      )

      expect(result).toEqual({
        id: 'test-id-001',
        message: 'Something went wrong',
        source: 'window.onerror',
        stack: 'Error: Something went wrong\n  at foo.js:1',
        createdAt: now,
        updatedAt: now,
      })
    })

    it('inserts a log entry without stack trace', async () => {
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
              message: 'Network error',
              source: 'unhandledrejection',
              stack: null,
              created_at: now,
              updated_at: now,
            },
          ],
          changes: 0,
        })

      const repo = createErrorLogRepository(db)
      const result = await repo.create('Network error', 'unhandledrejection')

      expect(db.exec).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO error_logs'),
        ['test-id-002', 'Network error', 'unhandledrejection', null, now],
      )

      expect(result).toEqual({
        id: 'test-id-002',
        message: 'Network error',
        source: 'unhandledrejection',
        stack: null,
        createdAt: now,
        updatedAt: now,
      })
    })
  })

  describe('findRecent()', () => {
    it('returns entries in descending order with default limit 50', async () => {
      const mockRows = [
        {
          id: 'log-1',
          message: 'Error A',
          source: 'src-a',
          stack: null,
          created_at: 1700000002000,
          updated_at: 1700000002000,
        },
        {
          id: 'log-2',
          message: 'Error B',
          source: 'src-b',
          stack: 'stack-b',
          created_at: 1700000001000,
          updated_at: 1700000001000,
        },
      ]

      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: mockRows,
        changes: 0,
      })

      const repo = createErrorLogRepository(db)
      const result = await repo.findRecent()

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM error_logs ORDER BY created_at DESC LIMIT ?',
        [50],
      )

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 'log-1',
        message: 'Error A',
        source: 'src-a',
        stack: null,
        createdAt: 1700000002000,
        updatedAt: 1700000002000,
      })
      expect(result[1]).toEqual({
        id: 'log-2',
        message: 'Error B',
        source: 'src-b',
        stack: 'stack-b',
        createdAt: 1700000001000,
        updatedAt: 1700000001000,
      })
    })

    it('respects custom limit parameter', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [],
        changes: 0,
      })

      const repo = createErrorLogRepository(db)
      await repo.findRecent(10)

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM error_logs ORDER BY created_at DESC LIMIT ?',
        [10],
      )
    })

    it('returns empty array when no rows exist', async () => {
      const repo = createErrorLogRepository(db)
      const result = await repo.findRecent()

      expect(result).toEqual([])
    })
  })

  describe('clearAll()', () => {
    it('deletes all rows from error_logs table', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({ rows: [], changes: 5 })

      const repo = createErrorLogRepository(db)
      await repo.clearAll()

      expect(db.exec).toHaveBeenCalledWith('DELETE FROM error_logs')
    })
  })

  describe('count()', () => {
    it('returns the total number of error log entries', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [{ 'COUNT(*)': 42 }],
        changes: 0,
      })

      const repo = createErrorLogRepository(db)
      const result = await repo.count()

      expect(db.exec).toHaveBeenCalledWith('SELECT COUNT(*) FROM error_logs')
      expect(result).toBe(42)
    })

    it('returns 0 when table is empty', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [{ 'COUNT(*)': 0 }],
        changes: 0,
      })

      const repo = createErrorLogRepository(db)
      const result = await repo.count()

      expect(result).toBe(0)
    })
  })

  describe('findPaginated()', () => {
    it('returns correct page of results', async () => {
      const mockRows = [
        {
          id: 'log-1',
          message: 'Error A',
          source: 'src-a',
          stack: null,
          created_at: 1700000002000,
          updated_at: 1700000002000,
        },
        {
          id: 'log-2',
          message: 'Error B',
          source: 'src-b',
          stack: 'stack-b',
          created_at: 1700000001000,
          updated_at: 1700000001000,
        },
      ]

      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: mockRows,
        changes: 0,
      })

      const repo = createErrorLogRepository(db)
      const result = await repo.findPaginated(1, 10)

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM error_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [10, 0],
      )

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 'log-1',
        message: 'Error A',
        source: 'src-a',
        stack: null,
        createdAt: 1700000002000,
        updatedAt: 1700000002000,
      })
      expect(result[1]).toEqual({
        id: 'log-2',
        message: 'Error B',
        source: 'src-b',
        stack: 'stack-b',
        createdAt: 1700000001000,
        updatedAt: 1700000001000,
      })
    })

    it('calculates correct offset for page 2 with pageSize 20', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [],
        changes: 0,
      })

      const repo = createErrorLogRepository(db)
      await repo.findPaginated(2, 20)

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM error_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [20, 20],
      )
    })

    it('calculates correct offset for page 3 with pageSize 5', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [],
        changes: 0,
      })

      const repo = createErrorLogRepository(db)
      await repo.findPaginated(3, 5)

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM error_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [5, 10],
      )
    })

    it('returns empty array for out-of-range page', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [],
        changes: 0,
      })

      const repo = createErrorLogRepository(db)
      const result = await repo.findPaginated(100, 10)

      expect(result).toEqual([])
    })

    it('throws when page < 1', async () => {
      const repo = createErrorLogRepository(db)
      await expect(repo.findPaginated(0, 10)).rejects.toThrow(
        'page must be >= 1',
      )
    })

    it('throws when page is negative', async () => {
      const repo = createErrorLogRepository(db)
      await expect(repo.findPaginated(-1, 10)).rejects.toThrow(
        'page must be >= 1',
      )
    })

    it('throws when pageSize < 1', async () => {
      const repo = createErrorLogRepository(db)
      await expect(repo.findPaginated(1, 0)).rejects.toThrow(
        'pageSize must be >= 1',
      )
    })

    it('throws when pageSize is negative', async () => {
      const repo = createErrorLogRepository(db)
      await expect(repo.findPaginated(1, -5)).rejects.toThrow(
        'pageSize must be >= 1',
      )
    })
  })

  describe('row mapping', () => {
    it('maps created_at to createdAt', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'log-x',
            message: 'test',
            source: 'test-src',
            stack: null,
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createErrorLogRepository(db)
      const result = await repo.findRecent(1)

      expect(result[0]!.createdAt).toBe(1700000000000)
    })

    it('preserves null stack values', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'log-y',
            message: 'test',
            source: 'test-src',
            stack: null,
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createErrorLogRepository(db)
      const result = await repo.findRecent(1)

      expect(result[0]!.stack).toBeNull()
    })

    it('preserves string stack values', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'log-z',
            message: 'test',
            source: 'test-src',
            stack: 'Error: test\n  at bar.js:10',
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createErrorLogRepository(db)
      const result = await repo.findRecent(1)

      expect(result[0]!.stack).toBe('Error: test\n  at bar.js:10')
    })
  })
})
