/**
 * Tests for CommodityTypeRepository.
 * Uses a mock AsyncDatabase since SQLite WASM cannot run in Node/Vitest.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AsyncDatabase } from '@/lib/worker-database'
import { createCommodityTypeRepository } from './commodity-type-repository'

function createMockAsyncDb(): AsyncDatabase {
  return {
    exec: vi.fn(async () => ({ rows: [], changes: 0 })),
    exportDatabase: vi.fn(async () => new Uint8Array()),
    importDatabase: vi.fn(async () => undefined),
    restorePreviousDatabase: vi.fn(async () => undefined),
    hasPreviousDatabase: vi.fn(async () => false),
    getDatabaseSizes: vi.fn(async () => ({ current: { raw: 0, compressed: 0 }, prev: { raw: 0, compressed: 0 } })),
    deletePreviousDatabase: vi.fn(async () => undefined),
  }
}

describe('CommodityTypeRepository', () => {
  let db: AsyncDatabase

  beforeEach(() => {
    db = createMockAsyncDb()
  })

  // ─── findAll ────────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('calls db.exec with correct SQL', async () => {
      const repo = createCommodityTypeRepository(db)
      await repo.findAll()

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM commodity_types ORDER BY priority ASC, id ASC',
      )
    })

    it('returns empty array when no rows exist', async () => {
      const repo = createCommodityTypeRepository(db)
      const result = await repo.findAll()

      expect(result).toEqual([])
    })

    it('maps rows to CommodityType objects', async () => {
      const mockRows = [
        {
          id: 'ct-001',
          type_id: 'bento',
          type: 'bento',
          label: '便當',
          color: '#ff0000',
          priority: 1,
          created_at: 1700000000000,
          updated_at: 1700000000000,
        },
        {
          id: 'ct-002',
          type_id: 'drink',
          type: 'drink',
          label: '飲料',
          color: '',
          priority: 2,
          created_at: 1700000000000,
          updated_at: 1700000000000,
        },
      ]

      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: mockRows,
        changes: 0,
      })

      const repo = createCommodityTypeRepository(db)
      const result = await repo.findAll()

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 'ct-001',
        typeId: 'bento',
        type: 'bento',
        label: '便當',
        color: '#ff0000',
        priority: 1,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      })
      expect(result[1]).toEqual({
        id: 'ct-002',
        typeId: 'drink',
        type: 'drink',
        label: '飲料',
        color: '',
        priority: 2,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      })
    })
  })

  // ─── findById ───────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('calls db.exec with correct SQL and param', async () => {
      const repo = createCommodityTypeRepository(db)
      await repo.findById('ct-001')

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM commodity_types WHERE id = ?',
        ['ct-001'],
      )
    })

    it('returns undefined when no row found', async () => {
      const repo = createCommodityTypeRepository(db)
      const result = await repo.findById('non-existent')

      expect(result).toBeUndefined()
    })

    it('returns mapped CommodityType when row found', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'ct-001',
            type_id: 'bento',
            type: 'bento',
            label: '便當',
            color: '',
            priority: 0,
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createCommodityTypeRepository(db)
      const result = await repo.findById('ct-001')

      expect(result).toEqual({
        id: 'ct-001',
        typeId: 'bento',
        type: 'bento',
        label: '便當',
        color: '',
        priority: 0,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      })
    })
  })

  // ─── findByTypeId ───────────────────────────────────────────────────────────

  describe('findByTypeId()', () => {
    it('calls db.exec with correct SQL and param', async () => {
      const repo = createCommodityTypeRepository(db)
      await repo.findByTypeId('bento')

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM commodity_types WHERE type_id = ?',
        ['bento'],
      )
    })

    it('returns undefined when no row found', async () => {
      const repo = createCommodityTypeRepository(db)
      const result = await repo.findByTypeId('non-existent')

      expect(result).toBeUndefined()
    })

    it('returns mapped CommodityType when row found', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'ct-001',
            type_id: 'bento',
            type: 'bento',
            label: '便當',
            color: '',
            priority: 0,
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createCommodityTypeRepository(db)
      const result = await repo.findByTypeId('bento')

      expect(result).toEqual({
        id: 'ct-001',
        typeId: 'bento',
        type: 'bento',
        label: '便當',
        color: '',
        priority: 0,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      })
    })
  })

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('calls db.exec with INSERT SQL and correct params', async () => {
      // First call: INSERT, second call: SELECT (findById)
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'generated-id',
              type_id: 'bento',
              type: 'bento',
              label: '便當',
              color: '#ff0000',
              priority: 0,
              created_at: 1700000000000,
              updated_at: 1700000000000,
            },
          ],
          changes: 0,
        })

      const repo = createCommodityTypeRepository(db)
      await repo.create({
        typeId: 'bento',
        type: 'bento',
        label: '便當',
        color: '#ff0000',
        priority: 1,
      })

      const insertCall = vi.mocked(db.exec).mock.calls[0]
      expect(insertCall![0]).toContain('INSERT INTO commodity_types')
      expect(insertCall![1]).toEqual(
        expect.arrayContaining(['bento', 'bento', '便當', '#ff0000']),
      )
    })

    it('returns the created CommodityType', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'generated-id',
              type_id: 'drink',
              type: 'drink',
              label: '飲料',
              color: '',
              priority: 0,
              created_at: 1700000000000,
              updated_at: 1700000000000,
            },
          ],
          changes: 0,
        })

      const repo = createCommodityTypeRepository(db)
      const result = await repo.create({
        typeId: 'drink',
        type: 'drink',
        label: '飲料',
        color: '',
        priority: 0,
      })

      expect(result).toEqual({
        id: 'generated-id',
        typeId: 'drink',
        type: 'drink',
        label: '飲料',
        color: '',
        priority: 0,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      })
    })
  })

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('returns undefined when item does not exist', async () => {
      const repo = createCommodityTypeRepository(db)
      const result = await repo.update('non-existent', { label: '新標籤' })

      expect(result).toBeUndefined()
    })

    it('returns existing item when no fields provided', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'ct-001',
            type_id: 'bento',
            type: 'bento',
            label: '便當',
            color: '#ff0000',
            priority: 0,
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createCommodityTypeRepository(db)
      const result = await repo.update('ct-001', {})

      expect(result).toBeDefined()
      expect(result!.label).toBe('便當')
    })

    it('calls UPDATE with correct fields for partial update', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'ct-001',
              type_id: 'bento',
              type: 'bento',
              label: '便當',
              color: '#ff0000',
              priority: 0,
              created_at: 1700000000000,
              updated_at: 1700000000000,
            },
          ],
          changes: 0,
        })
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'ct-001',
              type_id: 'bento',
              type: 'bento',
              label: '主餐',
              color: '#00ff00',
              priority: 0,
              created_at: 1700000000000,
              updated_at: 1700000050000,
            },
          ],
          changes: 0,
        })

      const repo = createCommodityTypeRepository(db)
      const result = await repo.update('ct-001', {
        label: '主餐',
        color: '#00ff00',
      })

      const updateCall = vi.mocked(db.exec).mock.calls[1]
      expect(updateCall![0]).toContain('UPDATE commodity_types SET')
      expect(updateCall![0]).toContain('label = ?')
      expect(updateCall![0]).toContain('color = ?')
      expect(updateCall![0]).toContain('updated_at = ?')

      expect(result).toBeDefined()
      expect(result!.label).toBe('主餐')
      expect(result!.color).toBe('#00ff00')
    })

    it('can update typeId field', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'ct-001',
              type_id: 'bento',
              type: 'bento',
              label: '便當',
              color: '',
              priority: 0,
              created_at: 1700000000000,
              updated_at: 1700000000000,
            },
          ],
          changes: 0,
        })
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'ct-001',
              type_id: 'rice',
              type: 'bento',
              label: '便當',
              color: '',
              priority: 0,
              created_at: 1700000000000,
              updated_at: 1700000050000,
            },
          ],
          changes: 0,
        })

      const repo = createCommodityTypeRepository(db)
      const result = await repo.update('ct-001', { typeId: 'rice' })

      const updateCall = vi.mocked(db.exec).mock.calls[1]
      expect(updateCall![0]).toContain('type_id = ?')
      expect(result!.typeId).toBe('rice')
    })

    it('can update type field', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'ct-001',
              type_id: 'bento',
              type: 'bento',
              label: '便當',
              color: '',
              priority: 0,
              created_at: 1700000000000,
              updated_at: 1700000000000,
            },
          ],
          changes: 0,
        })
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'ct-001',
              type_id: 'bento',
              type: 'main-dish',
              label: '便當',
              color: '',
              priority: 0,
              created_at: 1700000000000,
              updated_at: 1700000050000,
            },
          ],
          changes: 0,
        })

      const repo = createCommodityTypeRepository(db)
      const result = await repo.update('ct-001', { type: 'main-dish' })

      const updateCall = vi.mocked(db.exec).mock.calls[1]
      expect(updateCall![0]).toContain('type = ?')
      expect(result!.type).toBe('main-dish')
    })
  })

  // ─── remove ─────────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('calls db.exec with DELETE SQL and correct param', async () => {
      const repo = createCommodityTypeRepository(db)
      await repo.remove('ct-001')

      expect(db.exec).toHaveBeenCalledWith(
        'DELETE FROM commodity_types WHERE id = ?',
        ['ct-001'],
      )
    })

    it('returns true when row was deleted', async () => {
      db.exec = vi.fn(async () => ({ rows: [], changes: 1 }))
      const repo = createCommodityTypeRepository(db)
      const result = await repo.remove('ct-001')

      expect(result).toBe(true)
    })

    it('returns false when row did not exist', async () => {
      db.exec = vi.fn(async () => ({ rows: [], changes: 0 }))
      const repo = createCommodityTypeRepository(db)
      const result = await repo.remove('non-existent')

      expect(result).toBe(false)
    })
  })

  // ─── updatePriorities ──────────────────────────────────────────────────────

  describe('updatePriorities()', () => {
    it('calls UPDATE for each id with correct priority', async () => {
      const repo = createCommodityTypeRepository(db)
      await repo.updatePriorities(['ct-003', 'ct-001', 'ct-002'])

      // Should have called exec 3 times (one for each id)
      expect(db.exec).toHaveBeenCalledTimes(3)

      // First call sets priority 1 for ct-003
      const call0 = vi.mocked(db.exec).mock.calls[0]
      expect(call0![0]).toContain('UPDATE commodity_types SET priority = ?')
      expect(call0![1]).toEqual(expect.arrayContaining([1, 'ct-003']))

      // Second call sets priority 2 for ct-001
      const call1 = vi.mocked(db.exec).mock.calls[1]
      expect(call1![1]).toEqual(expect.arrayContaining([2, 'ct-001']))

      // Third call sets priority 3 for ct-002
      const call2 = vi.mocked(db.exec).mock.calls[2]
      expect(call2![1]).toEqual(expect.arrayContaining([3, 'ct-002']))
    })
  })
})
