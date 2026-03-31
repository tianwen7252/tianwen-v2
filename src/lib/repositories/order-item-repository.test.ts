/**
 * Tests for OrderItemRepository.
 * Uses a mock AsyncDatabase since SQLite WASM cannot run in Node/Vitest.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AsyncDatabase } from '@/lib/worker-database'
import { createOrderItemRepository } from './order-item-repository'

function createMockAsyncDb(): AsyncDatabase {
  return {
    exec: vi.fn(async () => ({ rows: [], changes: 0 })),
    exportDatabase: vi.fn(async () => new Uint8Array()),
  }
}

describe('OrderItemRepository', () => {
  let db: AsyncDatabase

  beforeEach(() => {
    db = createMockAsyncDb()
  })

  // ─── findByOrderId ───────────────────────────────────────────────────────────

  describe('findByOrderId()', () => {
    it('calls db.exec with correct SQL and orderId param', async () => {
      const repo = createOrderItemRepository(db)
      await repo.findByOrderId('order-001')

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC',
        ['order-001'],
      )
    })

    it('returns empty array when no items exist', async () => {
      const repo = createOrderItemRepository(db)
      const result = await repo.findByOrderId('order-001')

      expect(result).toEqual([])
    })

    it('maps includes_soup: 1 to includesSoup: true', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'item-001',
            order_id: 'order-001',
            commodity_id: 'com-001',
            name: '油淋雞腿飯',
            price: 140,
            quantity: 1,
            includes_soup: 1,
            created_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createOrderItemRepository(db)
      const result = await repo.findByOrderId('order-001')

      expect(result[0]!.includesSoup).toBe(true)
    })

    it('maps includes_soup: 0 to includesSoup: false', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'item-002',
            order_id: 'order-001',
            commodity_id: 'com-015',
            name: '雞胸肉沙拉',
            price: 160,
            quantity: 2,
            includes_soup: 0,
            created_at: 1700000001000,
          },
        ],
        changes: 0,
      })

      const repo = createOrderItemRepository(db)
      const result = await repo.findByOrderId('order-001')

      expect(result[0]!.includesSoup).toBe(false)
    })

    it('maps all fields correctly to OrderItem shape', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'item-001',
            order_id: 'order-001',
            commodity_id: 'com-001',
            name: '滷肉便當',
            price: 100,
            quantity: 3,
            includes_soup: 1,
            created_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createOrderItemRepository(db)
      const result = await repo.findByOrderId('order-001')

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'item-001',
        orderId: 'order-001',
        commodityId: 'com-001',
        name: '滷肉便當',
        price: 100,
        quantity: 3,
        includesSoup: true,
        createdAt: 1700000000000,
      })
    })

    it('returns multiple items sorted by created_at ASC', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'item-001',
            order_id: 'order-001',
            commodity_id: 'com-001',
            name: '滷肉便當',
            price: 100,
            quantity: 1,
            includes_soup: 1,
            created_at: 1700000000000,
          },
          {
            id: 'item-002',
            order_id: 'order-001',
            commodity_id: 'com-015',
            name: '雞胸肉沙拉',
            price: 160,
            quantity: 2,
            includes_soup: 0,
            created_at: 1700000001000,
          },
        ],
        changes: 0,
      })

      const repo = createOrderItemRepository(db)
      const result = await repo.findByOrderId('order-001')

      expect(result).toHaveLength(2)
      expect(result[0]!.id).toBe('item-001')
      expect(result[1]!.id).toBe('item-002')
    })
  })

  // ─── createBatch ─────────────────────────────────────────────────────────────

  describe('createBatch()', () => {
    it('returns empty array for empty input', async () => {
      const repo = createOrderItemRepository(db)
      const result = await repo.createBatch([])

      expect(result).toEqual([])
      expect(db.exec).not.toHaveBeenCalled()
    })

    it('calls INSERT for each item in batch', async () => {
      // Two INSERT calls, then one findByOrderId SELECT call
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'generated-id-1',
              order_id: 'order-001',
              commodity_id: 'com-001',
              name: '滷肉便當',
              price: 100,
              quantity: 1,
              includes_soup: 1,
              created_at: 1700000000000,
            },
            {
              id: 'generated-id-2',
              order_id: 'order-001',
              commodity_id: 'com-015',
              name: '雞胸肉沙拉',
              price: 160,
              quantity: 2,
              includes_soup: 0,
              created_at: 1700000000000,
            },
          ],
          changes: 0,
        })

      const repo = createOrderItemRepository(db)
      await repo.createBatch([
        {
          orderId: 'order-001',
          commodityId: 'com-001',
          name: '滷肉便當',
          price: 100,
          quantity: 1,
          includesSoup: true,
        },
        {
          orderId: 'order-001',
          commodityId: 'com-015',
          name: '雞胸肉沙拉',
          price: 160,
          quantity: 2,
          includesSoup: false,
        },
      ])

      // First two calls should be INSERT statements
      const insertCalls = vi
        .mocked(db.exec)
        .mock.calls.filter(call => String(call[0]).includes('INSERT'))
      expect(insertCalls).toHaveLength(2)
    })

    it('encodes includesSoup as 1 at correct param position (index 6)', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'generated-id',
              order_id: 'order-001',
              commodity_id: 'com-001',
              name: '油淋雞腿飯',
              price: 140,
              quantity: 1,
              includes_soup: 1,
              created_at: 1700000000000,
            },
          ],
          changes: 0,
        })

      const repo = createOrderItemRepository(db)
      await repo.createBatch([
        {
          orderId: 'order-001',
          commodityId: 'com-001',
          name: '油淋雞腿飯',
          price: 140,
          quantity: 1,
          includesSoup: true,
        },
      ])

      const insertCall = vi.mocked(db.exec).mock.calls[0]
      // Params: [id, orderId, commodityId, name, price, quantity, includesSoup, createdAt]
      expect(insertCall![1]![6]).toBe(1)
    })

    it('encodes includesSoup: false as 0 at param position index 6', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'generated-id',
              order_id: 'order-001',
              commodity_id: 'com-015',
              name: '雞胸肉沙拉',
              price: 160,
              quantity: 2,
              includes_soup: 0,
              created_at: 1700000000000,
            },
          ],
          changes: 0,
        })

      const repo = createOrderItemRepository(db)
      await repo.createBatch([
        {
          orderId: 'order-001',
          commodityId: 'com-015',
          name: '雞胸肉沙拉',
          price: 160,
          quantity: 2,
          includesSoup: false,
        },
      ])

      const insertCall = vi.mocked(db.exec).mock.calls[0]
      expect(insertCall![1]![6]).toBe(0)
    })

    it('returns created items via findByOrderId', async () => {
      const mockItems = [
        {
          id: 'generated-id',
          order_id: 'order-001',
          commodity_id: 'com-001',
          name: '滷肉便當',
          price: 100,
          quantity: 1,
          includes_soup: 1,
          created_at: 1700000000000,
        },
      ]

      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({ rows: mockItems, changes: 0 })

      const repo = createOrderItemRepository(db)
      const result = await repo.createBatch([
        {
          orderId: 'order-001',
          commodityId: 'com-001',
          name: '滷肉便當',
          price: 100,
          quantity: 1,
          includesSoup: true,
        },
      ])

      expect(result).toHaveLength(1)
      expect(result[0]!.orderId).toBe('order-001')
      expect(result[0]!.name).toBe('滷肉便當')
    })

    it('throws when items have different orderIds', async () => {
      const repo = createOrderItemRepository(db)
      await expect(
        repo.createBatch([
          {
            orderId: 'order-001',
            commodityId: 'com-001',
            name: '滷肉便當',
            price: 100,
            quantity: 1,
            includesSoup: false,
          },
          {
            orderId: 'order-002',
            commodityId: 'com-001',
            name: '滷肉便當',
            price: 100,
            quantity: 1,
            includesSoup: false,
          },
        ]),
      ).rejects.toThrow('createBatch: all items must share the same orderId')
    })

    it('inserts correct SQL into order_items table', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'generated-id',
              order_id: 'order-001',
              commodity_id: 'com-001',
              name: '滷肉便當',
              price: 100,
              quantity: 1,
              includes_soup: 1,
              created_at: 1700000000000,
            },
          ],
          changes: 0,
        })

      const repo = createOrderItemRepository(db)
      await repo.createBatch([
        {
          orderId: 'order-001',
          commodityId: 'com-001',
          name: '滷肉便當',
          price: 100,
          quantity: 1,
          includesSoup: true,
        },
      ])

      const insertCall = vi.mocked(db.exec).mock.calls[0]
      expect(String(insertCall![0])).toContain('INSERT INTO order_items')
    })
  })

  // ─── removeByOrderId ─────────────────────────────────────────────────────────

  describe('removeByOrderId()', () => {
    it('calls DELETE with orderId param', async () => {
      const repo = createOrderItemRepository(db)
      await repo.removeByOrderId('order-001')

      expect(db.exec).toHaveBeenCalledWith(
        'DELETE FROM order_items WHERE order_id = ?',
        ['order-001'],
      )
    })

    it('returns number of deleted rows', async () => {
      db.exec = vi.fn(async () => ({ rows: [], changes: 3 }))
      const repo = createOrderItemRepository(db)
      const result = await repo.removeByOrderId('order-001')

      expect(result).toBe(3)
    })

    it('returns 0 when no rows matched', async () => {
      db.exec = vi.fn(async () => ({ rows: [], changes: 0 }))
      const repo = createOrderItemRepository(db)
      const result = await repo.removeByOrderId('non-existent')

      expect(result).toBe(0)
    })
  })
})
