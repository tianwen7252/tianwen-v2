/**
 * Tests for CommodityRepository.
 * Uses a mock AsyncDatabase since SQLite WASM cannot run in Node/Vitest.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AsyncDatabase } from '@/lib/worker-database'
import { createCommodityRepository } from './commodity-repository'

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

describe('CommodityRepository', () => {
  let db: AsyncDatabase

  beforeEach(() => {
    db = createMockAsyncDb()
  })

  // ─── findAll ────────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('calls db.exec with correct SQL', async () => {
      const repo = createCommodityRepository(db)
      await repo.findAll()

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM commodities ORDER BY priority ASC, name ASC',
      )
    })

    it('returns empty array when no rows exist', async () => {
      const repo = createCommodityRepository(db)
      const result = await repo.findAll()

      expect(result).toEqual([])
    })

    it('maps includes_soup: 1 to includesSoup: true', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'com-001',
            type_id: 'bento',
            name: '油淋雞腿飯',
            image: null,
            price: 140,
            priority: 1,
            on_market: 1,
            hide_on_mode: null,
            editor: null,
            includes_soup: 1,
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createCommodityRepository(db)
      const result = await repo.findAll()

      expect(result[0]!.includesSoup).toBe(true)
    })

    it('maps includes_soup: 0 to includesSoup: false', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'com-015',
            type_id: 'bento',
            name: '雞胸肉沙拉',
            image: null,
            price: 160,
            priority: 15,
            on_market: 1,
            hide_on_mode: null,
            editor: null,
            includes_soup: 0,
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createCommodityRepository(db)
      const result = await repo.findAll()

      expect(result[0]!.includesSoup).toBe(false)
    })

    it('maps rows to Commodity objects with image field', async () => {
      const mockRows = [
        {
          id: 'com-001',
          type_id: 'bento',
          name: '滷肉便當',
          image: 'images/commodities/lu-rou.png',
          price: 100,
          priority: 0,
          on_market: 1,
          hide_on_mode: null,
          editor: null,
          created_at: 1700000000000,
          updated_at: 1700000000000,
        },
        {
          id: 'com-002',
          type_id: 'drink',
          name: '紅茶',
          image: null,
          price: 30,
          priority: 1,
          on_market: 0,
          hide_on_mode: 'takeout',
          editor: 'admin',
          created_at: 1700000000000,
          updated_at: 1700000000000,
        },
      ]

      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: mockRows,
        changes: 0,
      })

      const repo = createCommodityRepository(db)
      const result = await repo.findAll()

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 'com-001',
        typeId: 'bento',
        name: '滷肉便當',
        image: 'images/commodities/lu-rou.png',
        price: 100,
        priority: 0,
        onMarket: true,
        hideOnMode: undefined,
        editor: undefined,
        includesSoup: false,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      })
      expect(result[1]).toEqual({
        id: 'com-002',
        typeId: 'drink',
        name: '紅茶',
        image: undefined,
        price: 30,
        priority: 1,
        onMarket: false,
        hideOnMode: 'takeout',
        editor: 'admin',
        includesSoup: false,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      })
    })
  })

  // ─── findByTypeId ───────────────────────────────────────────────────────────

  describe('findByTypeId()', () => {
    it('calls db.exec with correct SQL and param', async () => {
      const repo = createCommodityRepository(db)
      await repo.findByTypeId('bento')

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM commodities WHERE type_id = ? ORDER BY priority ASC, name ASC',
        ['bento'],
      )
    })

    it('returns empty array when no rows match', async () => {
      const repo = createCommodityRepository(db)
      const result = await repo.findByTypeId('non-existent')

      expect(result).toEqual([])
    })

    it('maps rows correctly', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'com-001',
            type_id: 'bento',
            name: '滷肉便當',
            image: 'images/commodities/lu-rou.png',
            price: 100,
            priority: 0,
            on_market: 1,
            hide_on_mode: null,
            editor: null,
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createCommodityRepository(db)
      const result = await repo.findByTypeId('bento')

      expect(result).toHaveLength(1)
      expect(result[0]!.typeId).toBe('bento')
      expect(result[0]!.name).toBe('滷肉便當')
    })
  })

  // ─── findById ───────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('calls db.exec with correct SQL and param', async () => {
      const repo = createCommodityRepository(db)
      await repo.findById('com-001')

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM commodities WHERE id = ?',
        ['com-001'],
      )
    })

    it('returns undefined when no row found', async () => {
      const repo = createCommodityRepository(db)
      const result = await repo.findById('non-existent')

      expect(result).toBeUndefined()
    })

    it('returns mapped Commodity when row found', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'com-001',
            type_id: 'bento',
            name: '滷肉便當',
            image: 'images/commodities/lu-rou.png',
            price: 100,
            priority: 0,
            on_market: 1,
            hide_on_mode: null,
            editor: null,
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createCommodityRepository(db)
      const result = await repo.findById('com-001')

      expect(result).toEqual({
        id: 'com-001',
        typeId: 'bento',
        name: '滷肉便當',
        image: 'images/commodities/lu-rou.png',
        price: 100,
        priority: 0,
        onMarket: true,
        hideOnMode: undefined,
        editor: undefined,
        includesSoup: false,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      })
    })
  })

  // ─── findOnMarket ───────────────────────────────────────────────────────────

  describe('findOnMarket()', () => {
    it('calls db.exec with correct SQL (on_market = 1)', async () => {
      const repo = createCommodityRepository(db)
      await repo.findOnMarket()

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM commodities WHERE on_market = 1 ORDER BY priority ASC, name ASC',
      )
    })

    it('returns empty array when no on-market items exist', async () => {
      const repo = createCommodityRepository(db)
      const result = await repo.findOnMarket()

      expect(result).toEqual([])
    })

    it('only returns items with on_market = 1', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'com-001',
            type_id: 'bento',
            name: '滷肉便當',
            image: null,
            price: 100,
            priority: 0,
            on_market: 1,
            hide_on_mode: null,
            editor: null,
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createCommodityRepository(db)
      const result = await repo.findOnMarket()

      expect(result).toHaveLength(1)
      expect(result[0]!.onMarket).toBe(true)
    })
  })

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('calls db.exec with INSERT SQL and correct params', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'generated-id',
              type_id: 'bento',
              name: '滷肉便當',
              image: 'images/commodities/lu-rou.png',
              price: 100,
              priority: 0,
              on_market: 1,
              hide_on_mode: null,
              editor: null,
              created_at: 1700000000000,
              updated_at: 1700000000000,
            },
          ],
          changes: 0,
        })

      const repo = createCommodityRepository(db)
      await repo.create({
        typeId: 'bento',
        name: '滷肉便當',
        image: 'images/commodities/lu-rou.png',
        price: 100,
        priority: 0,
        onMarket: true,
        includesSoup: false,
      })

      const insertCall = vi.mocked(db.exec).mock.calls[0]
      expect(insertCall![0]).toContain('INSERT INTO commodities')
      expect(insertCall![1]).toEqual(
        expect.arrayContaining([
          'bento',
          '滷肉便當',
          'images/commodities/lu-rou.png',
          100,
        ]),
      )
    })

    it('returns the created Commodity', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'generated-id',
              type_id: 'bento',
              name: '滷肉便當',
              image: 'images/commodities/lu-rou.png',
              price: 100,
              priority: 0,
              on_market: 1,
              hide_on_mode: null,
              editor: null,
              created_at: 1700000000000,
              updated_at: 1700000000000,
            },
          ],
          changes: 0,
        })

      const repo = createCommodityRepository(db)
      const result = await repo.create({
        typeId: 'bento',
        name: '滷肉便當',
        image: 'images/commodities/lu-rou.png',
        price: 100,
        priority: 0,
        onMarket: true,
        includesSoup: false,
      })

      expect(result).toEqual({
        id: 'generated-id',
        typeId: 'bento',
        name: '滷肉便當',
        image: 'images/commodities/lu-rou.png',
        price: 100,
        priority: 0,
        onMarket: true,
        hideOnMode: undefined,
        editor: undefined,
        includesSoup: false,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      })
    })

    it('handles optional fields (image, hideOnMode, editor) as null', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'generated-id',
              type_id: 'drink',
              name: '紅茶',
              image: null,
              price: 30,
              priority: 0,
              on_market: 1,
              hide_on_mode: null,
              editor: null,
              created_at: 1700000000000,
              updated_at: 1700000000000,
            },
          ],
          changes: 0,
        })

      const repo = createCommodityRepository(db)
      const result = await repo.create({
        typeId: 'drink',
        name: '紅茶',
        price: 30,
        priority: 0,
        onMarket: true,
        includesSoup: false,
      })

      expect(result.image).toBeUndefined()
      expect(result.hideOnMode).toBeUndefined()
      expect(result.editor).toBeUndefined()
    })

    it('encodes includesSoup as integer at correct param position (index 9)', async () => {
      // includesSoup: true → 1
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'generated-id',
              type_id: 'bento',
              name: '油淋雞腿飯',
              image: null,
              price: 140,
              priority: 1,
              on_market: 1,
              hide_on_mode: null,
              editor: null,
              includes_soup: 1,
              created_at: 1700000000000,
              updated_at: 1700000000000,
            },
          ],
          changes: 0,
        })

      const repo = createCommodityRepository(db)
      await repo.create({
        typeId: 'bento',
        name: '油淋雞腿飯',
        price: 140,
        priority: 1,
        onMarket: true,
        includesSoup: true,
      })

      const insertCall = vi.mocked(db.exec).mock.calls[0]
      // Params: [id, typeId, name, image, price, priority, onMarket, hideOnMode, editor, includesSoup, createdAt, updatedAt]
      expect(insertCall![1]![9]).toBe(1)
    })

    it('encodes includesSoup: false as 0 at param position index 9', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'generated-id',
              type_id: 'bento',
              name: '雞胸肉沙拉',
              image: null,
              price: 160,
              priority: 15,
              on_market: 1,
              hide_on_mode: null,
              editor: null,
              includes_soup: 0,
              created_at: 1700000000000,
              updated_at: 1700000000000,
            },
          ],
          changes: 0,
        })

      const repo = createCommodityRepository(db)
      await repo.create({
        typeId: 'bento',
        name: '雞胸肉沙拉',
        price: 160,
        priority: 15,
        onMarket: true,
        includesSoup: false,
      })

      const insertCall = vi.mocked(db.exec).mock.calls[0]
      expect(insertCall![1]![9]).toBe(0)
    })
  })

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('returns undefined when item does not exist', async () => {
      const repo = createCommodityRepository(db)
      const result = await repo.update('non-existent', { name: '新名稱' })

      expect(result).toBeUndefined()
    })

    it('returns existing item when no fields provided', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'com-001',
            type_id: 'bento',
            name: '滷肉便當',
            image: null,
            price: 100,
            priority: 0,
            on_market: 1,
            hide_on_mode: null,
            editor: null,
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createCommodityRepository(db)
      const result = await repo.update('com-001', {})

      expect(result).toBeDefined()
      expect(result!.name).toBe('滷肉便當')
    })

    it('calls UPDATE with correct fields for partial update', async () => {
      // First call: findById (existing check)
      vi.mocked(db.exec)
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'com-001',
              type_id: 'bento',
              name: '滷肉便當',
              image: null,
              price: 100,
              priority: 0,
              on_market: 1,
              hide_on_mode: null,
              editor: null,
              created_at: 1700000000000,
              updated_at: 1700000000000,
            },
          ],
          changes: 0,
        })
        // Second call: UPDATE
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        // Third call: findById (re-fetch updated row)
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'com-001',
              type_id: 'bento',
              name: '紅燒肉便當',
              image: null,
              price: 120,
              priority: 0,
              on_market: 1,
              hide_on_mode: null,
              editor: null,
              created_at: 1700000000000,
              updated_at: 1700000050000,
            },
          ],
          changes: 0,
        })

      const repo = createCommodityRepository(db)
      const result = await repo.update('com-001', {
        name: '紅燒肉便當',
        price: 120,
      })

      // Verify UPDATE SQL was called
      const updateCall = vi.mocked(db.exec).mock.calls[1]
      expect(updateCall![0]).toContain('UPDATE commodities SET')
      expect(updateCall![0]).toContain('name = ?')
      expect(updateCall![0]).toContain('price = ?')
      expect(updateCall![0]).toContain('updated_at = ?')

      expect(result).toBeDefined()
      expect(result!.name).toBe('紅燒肉便當')
      expect(result!.price).toBe(120)
    })

    it('handles onMarket boolean to integer conversion', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'com-001',
              type_id: 'bento',
              name: '滷肉便當',
              image: null,
              price: 100,
              priority: 0,
              on_market: 1,
              hide_on_mode: null,
              editor: null,
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
              id: 'com-001',
              type_id: 'bento',
              name: '滷肉便當',
              image: null,
              price: 100,
              priority: 0,
              on_market: 0,
              hide_on_mode: null,
              editor: null,
              created_at: 1700000000000,
              updated_at: 1700000050000,
            },
          ],
          changes: 0,
        })

      const repo = createCommodityRepository(db)
      const result = await repo.update('com-001', { onMarket: false })

      // Verify onMarket is converted to integer 0
      const updateCall = vi.mocked(db.exec).mock.calls[1]
      expect(updateCall![1]).toContain(0) // on_market = 0

      expect(result!.onMarket).toBe(false)
    })

    it('can update image field', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'com-001',
              type_id: 'bento',
              name: '滷肉便當',
              image: null,
              price: 100,
              priority: 0,
              on_market: 1,
              hide_on_mode: null,
              editor: null,
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
              id: 'com-001',
              type_id: 'bento',
              name: '滷肉便當',
              image: 'images/commodities/lu-rou.png',
              price: 100,
              priority: 0,
              on_market: 1,
              hide_on_mode: null,
              editor: null,
              created_at: 1700000000000,
              updated_at: 1700000050000,
            },
          ],
          changes: 0,
        })

      const repo = createCommodityRepository(db)
      const result = await repo.update('com-001', {
        image: 'images/commodities/lu-rou.png',
      })

      const updateCall = vi.mocked(db.exec).mock.calls[1]
      expect(updateCall![0]).toContain('image = ?')
      expect(result!.image).toBe('images/commodities/lu-rou.png')
    })
  })

  // ─── updatePriorities ──────────────────────────────────────────────────────

  describe('updatePriorities()', () => {
    it('calls db.exec for each ID with correct priority', async () => {
      const repo = createCommodityRepository(db)
      await repo.updatePriorities(['com-003', 'com-001', 'com-002'])

      // Should call exec 3 times
      expect(db.exec).toHaveBeenCalledTimes(3)

      // First call: com-003 gets priority 1
      const call0 = vi.mocked(db.exec).mock.calls[0]
      expect(call0![0]).toContain(
        'UPDATE commodities SET priority = ?, updated_at = ? WHERE id = ?',
      )
      expect(call0![1]![0]).toBe(1) // priority
      expect(call0![1]![2]).toBe('com-003') // id

      // Second call: com-001 gets priority 2
      const call1 = vi.mocked(db.exec).mock.calls[1]
      expect(call1![1]![0]).toBe(2)
      expect(call1![1]![2]).toBe('com-001')

      // Third call: com-002 gets priority 3
      const call2 = vi.mocked(db.exec).mock.calls[2]
      expect(call2![1]![0]).toBe(3)
      expect(call2![1]![2]).toBe('com-002')
    })

    it('does nothing when given empty array', async () => {
      const repo = createCommodityRepository(db)
      await repo.updatePriorities([])

      expect(db.exec).not.toHaveBeenCalled()
    })

    it('handles single item array', async () => {
      const repo = createCommodityRepository(db)
      await repo.updatePriorities(['com-001'])

      expect(db.exec).toHaveBeenCalledTimes(1)
      const call0 = vi.mocked(db.exec).mock.calls[0]
      expect(call0![1]![0]).toBe(1)
      expect(call0![1]![2]).toBe('com-001')
    })

    it('includes updated_at timestamp in each call', async () => {
      const repo = createCommodityRepository(db)
      await repo.updatePriorities(['com-001'])

      const call0 = vi.mocked(db.exec).mock.calls[0]
      // Param index 1 should be a timestamp (updated_at)
      expect(typeof call0![1]![1]).toBe('number')
      expect(call0![1]![1]).toBeGreaterThan(0)
    })
  })

  // ─── remove ─────────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('calls db.exec with DELETE SQL and correct param', async () => {
      const repo = createCommodityRepository(db)
      await repo.remove('com-001')

      expect(db.exec).toHaveBeenCalledWith(
        'DELETE FROM commodities WHERE id = ?',
        ['com-001'],
      )
    })

    it('returns true when row was deleted', async () => {
      db.exec = vi.fn(async () => ({ rows: [], changes: 1 }))
      const repo = createCommodityRepository(db)
      const result = await repo.remove('com-001')

      expect(result).toBe(true)
    })

    it('returns false when row did not exist', async () => {
      db.exec = vi.fn(async () => ({ rows: [], changes: 0 }))
      const repo = createCommodityRepository(db)
      const result = await repo.remove('non-existent')

      expect(result).toBe(false)
    })
  })
})
