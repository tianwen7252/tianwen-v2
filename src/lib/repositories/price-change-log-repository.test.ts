/**
 * Tests for PriceChangeLogRepository.
 * Uses a mock AsyncDatabase since SQLite WASM cannot run in Node/Vitest.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AsyncDatabase } from '@/lib/worker-database'
import { createPriceChangeLogRepository } from './price-change-log-repository'

function createMockAsyncDb(): AsyncDatabase {
  return {
    exec: vi.fn(async () => ({ rows: [], changes: 0 })),
    exportDatabase: vi.fn(async () => new Uint8Array()),
    importDatabase: vi.fn(async () => undefined),
    restorePreviousDatabase: vi.fn(async () => undefined),
    hasPreviousDatabase: vi.fn(async () => false),
    getDatabaseSizes: vi.fn(async () => ({
      current: { raw: 0, compressed: 0 },
      prev: { raw: 0, compressed: 0 },
    })),
    deletePreviousDatabase: vi.fn(async () => undefined),
  }
}

describe('PriceChangeLogRepository', () => {
  let db: AsyncDatabase

  beforeEach(() => {
    db = createMockAsyncDb()
  })

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('calls db.exec with correct SQL, default limit 20 and offset 0', async () => {
      const repo = createPriceChangeLogRepository(db)
      await repo.findAll()

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM price_change_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [20, 0],
      )
    })

    it('accepts custom limit and offset', async () => {
      const repo = createPriceChangeLogRepository(db)
      await repo.findAll(10, 30)

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM price_change_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [10, 30],
      )
    })

    it('returns empty array when no rows exist', async () => {
      const repo = createPriceChangeLogRepository(db)
      const result = await repo.findAll()

      expect(result).toEqual([])
    })

    it('maps rows to PriceChangeLog objects', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'pcl-001',
            commodity_id: 'com-001',
            commodity_name: '滷肉便當',
            old_price: 100,
            new_price: 120,
            editor: 'admin',
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
          {
            id: 'pcl-002',
            commodity_id: 'com-002',
            commodity_name: '紅茶',
            old_price: 30,
            new_price: 35,
            editor: '',
            created_at: 1700000100000,
            updated_at: 1700000100000,
          },
        ],
        changes: 0,
      })

      const repo = createPriceChangeLogRepository(db)
      const result = await repo.findAll()

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 'pcl-001',
        commodityId: 'com-001',
        commodityName: '滷肉便當',
        oldPrice: 100,
        newPrice: 120,
        editor: 'admin',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      })
      expect(result[1]).toEqual({
        id: 'pcl-002',
        commodityId: 'com-002',
        commodityName: '紅茶',
        oldPrice: 30,
        newPrice: 35,
        editor: '',
        createdAt: 1700000100000,
        updatedAt: 1700000100000,
      })
    })
  })

  // ─── count ───────────────────────────────────────────────────────────────────

  describe('count()', () => {
    it('calls db.exec with correct SQL', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [{ 'COUNT(*)': 5 }],
        changes: 0,
      })

      const repo = createPriceChangeLogRepository(db)
      const result = await repo.count()

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT COUNT(*) FROM price_change_logs',
      )
      expect(result).toBe(5)
    })

    it('returns 0 when table is empty', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [{ 'COUNT(*)': 0 }],
        changes: 0,
      })

      const repo = createPriceChangeLogRepository(db)
      const result = await repo.count()

      expect(result).toBe(0)
    })
  })

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('calls db.exec with INSERT SQL and correct params', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'generated-id',
              commodity_id: 'com-001',
              commodity_name: '滷肉便當',
              old_price: 100,
              new_price: 120,
              editor: 'admin',
              created_at: 1700000000000,
              updated_at: 1700000000000,
            },
          ],
          changes: 0,
        })

      const repo = createPriceChangeLogRepository(db)
      await repo.create({
        commodityId: 'com-001',
        commodityName: '滷肉便當',
        oldPrice: 100,
        newPrice: 120,
        editor: 'admin',
      })

      const insertCall = vi.mocked(db.exec).mock.calls[0]
      expect(insertCall![0]).toContain('INSERT INTO price_change_logs')
      expect(insertCall![1]).toEqual(
        expect.arrayContaining(['com-001', '滷肉便當', 100, 120, 'admin']),
      )
    })

    it('returns the created PriceChangeLog', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'generated-id',
              commodity_id: 'com-001',
              commodity_name: '滷肉便當',
              old_price: 100,
              new_price: 120,
              editor: 'admin',
              created_at: 1700000000000,
              updated_at: 1700000000000,
            },
          ],
          changes: 0,
        })

      const repo = createPriceChangeLogRepository(db)
      const result = await repo.create({
        commodityId: 'com-001',
        commodityName: '滷肉便當',
        oldPrice: 100,
        newPrice: 120,
        editor: 'admin',
      })

      expect(result).toEqual({
        id: 'generated-id',
        commodityId: 'com-001',
        commodityName: '滷肉便當',
        oldPrice: 100,
        newPrice: 120,
        editor: 'admin',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      })
    })

    it('defaults editor to empty string when not provided', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'generated-id',
              commodity_id: 'com-001',
              commodity_name: '滷肉便當',
              old_price: 100,
              new_price: 120,
              editor: '',
              created_at: 1700000000000,
              updated_at: 1700000000000,
            },
          ],
          changes: 0,
        })

      const repo = createPriceChangeLogRepository(db)
      await repo.create({
        commodityId: 'com-001',
        commodityName: '滷肉便當',
        oldPrice: 100,
        newPrice: 120,
      })

      const insertCall = vi.mocked(db.exec).mock.calls[0]
      // editor param should be ''
      expect(insertCall![1]).toContain('')
    })

    it('handles special characters in commodity name', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'generated-id',
              commodity_id: 'com-special',
              commodity_name: '紅燒"獅子頭" (大)',
              old_price: 80,
              new_price: 90,
              editor: '',
              created_at: 1700000000000,
              updated_at: 1700000000000,
            },
          ],
          changes: 0,
        })

      const repo = createPriceChangeLogRepository(db)
      const result = await repo.create({
        commodityId: 'com-special',
        commodityName: '紅燒"獅子頭" (大)',
        oldPrice: 80,
        newPrice: 90,
      })

      expect(result.commodityName).toBe('紅燒"獅子頭" (大)')
    })

    it('handles zero prices', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'generated-id',
              commodity_id: 'com-free',
              commodity_name: '免費品項',
              old_price: 0,
              new_price: 50,
              editor: '',
              created_at: 1700000000000,
              updated_at: 1700000000000,
            },
          ],
          changes: 0,
        })

      const repo = createPriceChangeLogRepository(db)
      const result = await repo.create({
        commodityId: 'com-free',
        commodityName: '免費品項',
        oldPrice: 0,
        newPrice: 50,
      })

      expect(result.oldPrice).toBe(0)
      expect(result.newPrice).toBe(50)
    })
  })
})
