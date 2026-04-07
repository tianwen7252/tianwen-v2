/**
 * Tests for OrderRepository.
 * Uses a mock AsyncDatabase since SQLite WASM cannot run in Node/Vitest.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AsyncDatabase } from '@/lib/worker-database'
import { createOrderRepository } from './order-repository'

function createMockAsyncDb(): AsyncDatabase {
  return {
    exec: vi.fn(async () => ({ rows: [], changes: 0 })),
    exportDatabase: vi.fn(async () => new Uint8Array()),
  }
}

// Helper row factories

function makeOrderRow(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: 'ord-001',
    number: 1,
    memo: '[]',
    soups: 0,
    total: 100,
    original_total: null,
    edited_memo: null,
    editor: '',
    is_served: 0,
    created_at: 1700000000000,
    updated_at: 1700000000000,
    ...overrides,
  }
}

function makeItemRow(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: 'item-001',
    order_id: 'ord-001',
    commodity_id: 'com-001',
    name: '滷肉便當',
    price: 100,
    quantity: 2,
    includes_soup: 1,
    created_at: 1700000000001,
    ...overrides,
  }
}

function makeDiscountRow(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: 'disc-001',
    order_id: 'ord-001',
    label: '會員折扣',
    amount: 50,
    created_at: 1700000000002,
    ...overrides,
  }
}

describe('OrderRepository', () => {
  let db: AsyncDatabase

  beforeEach(() => {
    db = createMockAsyncDb()
  })

  // ─── findAll ────────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('calls db.exec with correct SQL', async () => {
      const repo = createOrderRepository(db)
      await repo.findAll()

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM orders ORDER BY created_at DESC',
      )
    })

    it('returns empty array when no rows exist', async () => {
      const repo = createOrderRepository(db)
      const result = await repo.findAll()

      expect(result).toEqual([])
    })

    it('maps rows to Order objects with JSON parsing for memo, attaches empty items/discounts', async () => {
      const mockRows = [
        makeOrderRow({
          id: 'ord-001',
          number: 1,
          memo: JSON.stringify(['加辣', '不要酸菜']),
          soups: 2,
          total: 200,
          original_total: 200,
        }),
      ]

      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: mockRows, changes: 0 }) // SELECT orders
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // SELECT order_items
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // SELECT order_discounts

      const repo = createOrderRepository(db)
      const result = await repo.findAll()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'ord-001',
        number: 1,
        memo: ['加辣', '不要酸菜'],
        soups: 2,
        total: 200,
        originalTotal: 200,
        editedMemo: undefined,
        editor: '',
        isServed: false,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        items: [],
        discounts: [],
      })
    })

    it('attaches normalized items and discounts when present', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [makeOrderRow()], changes: 0 })
        .mockResolvedValueOnce({ rows: [makeItemRow()], changes: 0 })
        .mockResolvedValueOnce({ rows: [makeDiscountRow()], changes: 0 })

      const repo = createOrderRepository(db)
      const result = await repo.findAll()

      expect(result[0]!.items).toHaveLength(1)
      expect(result[0]!.items[0]).toMatchObject({
        id: 'item-001',
        orderId: 'ord-001',
        commodityId: 'com-001',
        name: '滷肉便當',
        price: 100,
        quantity: 2,
        includesSoup: true,
      })
      expect(result[0]!.discounts).toHaveLength(1)
      expect(result[0]!.discounts[0]).toMatchObject({
        id: 'disc-001',
        orderId: 'ord-001',
        label: '會員折扣',
        amount: 50,
      })
    })

    it('handles empty JSON array for memo', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({
          rows: [
            makeOrderRow({ id: 'ord-002', number: 2, original_total: null }),
          ],
          changes: 0,
        })
        .mockResolvedValueOnce({ rows: [], changes: 0 })
        .mockResolvedValueOnce({ rows: [], changes: 0 })

      const repo = createOrderRepository(db)
      const result = await repo.findAll()

      expect(result[0]!.memo).toEqual([])
      expect(result[0]!.originalTotal).toBeUndefined()
      expect(result[0]!.items).toEqual([])
      expect(result[0]!.discounts).toEqual([])
    })
  })

  // ─── findById ───────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('calls db.exec with correct SQL and param', async () => {
      const repo = createOrderRepository(db)
      await repo.findById('ord-001')

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM orders WHERE id = ?',
        ['ord-001'],
      )
    })

    it('returns undefined when no row found', async () => {
      const repo = createOrderRepository(db)
      const result = await repo.findById('non-existent')

      expect(result).toBeUndefined()
    })

    it('returns mapped Order with items and discounts when row found', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({
          rows: [
            makeOrderRow({
              id: 'ord-001',
              number: 1,
              total: 100,
              original_total: 100,
              edited_memo: 'modified',
              editor: 'admin',
            }),
          ],
          changes: 0,
        })
        .mockResolvedValueOnce({ rows: [makeItemRow()], changes: 0 })
        .mockResolvedValueOnce({ rows: [makeDiscountRow()], changes: 0 })

      const repo = createOrderRepository(db)
      const result = await repo.findById('ord-001')

      expect(result).toBeDefined()
      expect(result!.id).toBe('ord-001')
      expect(result!.editedMemo).toBe('modified')
      expect(result!.editor).toBe('admin')
      expect(result!.items).toHaveLength(1)
      expect(result!.discounts).toHaveLength(1)
    })
  })

  // ─── findByDateRange ──────────────────────────────────────────────────────

  describe('findByDateRange()', () => {
    it('calls db.exec with correct SQL and params', async () => {
      const start = 1700000000000
      const end = 1700100000000

      const repo = createOrderRepository(db)
      await repo.findByDateRange(start, end)

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM orders WHERE created_at >= ? AND created_at <= ? ORDER BY created_at DESC',
        [start, end],
      )
    })

    it('returns empty array when no rows match', async () => {
      const repo = createOrderRepository(db)
      const result = await repo.findByDateRange(1700000000000, 1700100000000)

      expect(result).toEqual([])
    })

    it('maps rows correctly within date range, attaching items/discounts', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({
          rows: [
            makeOrderRow({
              created_at: 1700050000000,
              updated_at: 1700050000000,
            }),
          ],
          changes: 0,
        })
        .mockResolvedValueOnce({ rows: [], changes: 0 })
        .mockResolvedValueOnce({ rows: [], changes: 0 })

      const repo = createOrderRepository(db)
      const result = await repo.findByDateRange(1700000000000, 1700100000000)

      expect(result).toHaveLength(1)
      expect(result[0]!.id).toBe('ord-001')
      expect(result[0]!.items).toEqual([])
      expect(result[0]!.discounts).toEqual([])
    })
  })

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('calls db.exec with INSERT SQL for orders (without data column)', async () => {
      // Mock sequence: BEGIN, INSERT orders, INSERT item, SELECT items, INSERT discount,
      //                SELECT discounts, COMMIT, SELECT order (findById), SELECT items, SELECT discounts
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // BEGIN TRANSACTION
        .mockResolvedValueOnce({ rows: [], changes: 1 }) // INSERT orders
        .mockResolvedValueOnce({ rows: [], changes: 1 }) // INSERT order_item
        .mockResolvedValueOnce({ rows: [makeItemRow()], changes: 0 }) // findByOrderId items
        .mockResolvedValueOnce({ rows: [], changes: 1 }) // INSERT order_discount
        .mockResolvedValueOnce({ rows: [makeDiscountRow()], changes: 0 }) // findByOrderId discounts
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // COMMIT
        .mockResolvedValueOnce({
          rows: [
            makeOrderRow({
              number: 1,
              memo: JSON.stringify(['加辣']),
              soups: 1,
              total: 100,
            }),
          ],
          changes: 0,
        })
        .mockResolvedValueOnce({ rows: [makeItemRow()], changes: 0 }) // findById items
        .mockResolvedValueOnce({ rows: [makeDiscountRow()], changes: 0 }) // findById discounts

      const repo = createOrderRepository(db)
      await repo.create({
        number: 1,
        items: [
          {
            commodityId: 'com-001',
            name: '滷肉便當',
            price: 100,
            quantity: 2,
            includesSoup: true,
          },
        ],
        discounts: [{ label: '會員折扣', amount: 50 }],
        memo: ['加辣'],
        soups: 1,
        total: 100,
        editor: '',
      })

      const insertCall = vi
        .mocked(db.exec)
        .mock.calls.find(([sql]) => String(sql).includes('INSERT INTO orders'))
      expect(String(insertCall![0])).toContain('INSERT INTO orders')
      expect(String(insertCall![0])).not.toContain('data,')
    })

    it('returns the created Order with items and discounts', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // BEGIN TRANSACTION
        .mockResolvedValueOnce({ rows: [], changes: 1 }) // INSERT orders
        .mockResolvedValueOnce({ rows: [], changes: 1 }) // INSERT order_item
        .mockResolvedValueOnce({
          rows: [makeItemRow()],
          changes: 0,
        })
        .mockResolvedValueOnce({ rows: [], changes: 1 }) // INSERT order_discount
        .mockResolvedValueOnce({
          rows: [makeDiscountRow()],
          changes: 0,
        })
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // COMMIT
        .mockResolvedValueOnce({
          rows: [
            makeOrderRow({
              id: 'generated-id',
              number: 5,
              memo: JSON.stringify(['備註']),
              soups: 1,
              total: 50,
              original_total: 100,
              editor: 'admin',
            }),
          ],
          changes: 0,
        })
        .mockResolvedValueOnce({ rows: [makeItemRow()], changes: 0 })
        .mockResolvedValueOnce({ rows: [makeDiscountRow()], changes: 0 })

      const repo = createOrderRepository(db)
      const result = await repo.create({
        number: 5,
        items: [
          {
            commodityId: 'com-001',
            name: '滷肉便當',
            price: 100,
            quantity: 2,
            includesSoup: true,
          },
        ],
        discounts: [{ label: '會員折扣', amount: 50 }],
        memo: ['備註'],
        soups: 1,
        total: 50,
        originalTotal: 100,
        editor: 'admin',
      })

      expect(result.id).toBe('generated-id')
      expect(result.number).toBe(5)
      expect(result.memo).toEqual(['備註'])
      expect(result.soups).toBe(1)
      expect(result.total).toBe(50)
      expect(result.originalTotal).toBe(100)
      expect(result.items).toHaveLength(1)
      expect(result.discounts).toHaveLength(1)
    })

    it('skips item insert when items array is empty', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // BEGIN TRANSACTION
        .mockResolvedValueOnce({ rows: [], changes: 1 }) // INSERT orders
        // no item insert calls
        .mockResolvedValueOnce({ rows: [], changes: 1 }) // INSERT order_discount
        .mockResolvedValueOnce({ rows: [makeDiscountRow()], changes: 0 })
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // COMMIT
        .mockResolvedValueOnce({ rows: [makeOrderRow()], changes: 0 })
        .mockResolvedValueOnce({ rows: [], changes: 0 })
        .mockResolvedValueOnce({ rows: [makeDiscountRow()], changes: 0 })

      const repo = createOrderRepository(db)
      await repo.create({
        number: 1,
        items: [],
        discounts: [{ label: '會員折扣', amount: 50 }],
        memo: [],
        soups: 0,
        total: 0,
        editor: '',
      })

      // None of the exec calls should be an INSERT INTO order_items
      const calls = vi.mocked(db.exec).mock.calls
      const itemInsertCalls = calls.filter(
        c =>
          typeof c[0] === 'string' && c[0].includes('INSERT INTO order_items'),
      )
      expect(itemInsertCalls).toHaveLength(0)
    })

    it('skips discount insert when discounts array is empty', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // BEGIN TRANSACTION
        .mockResolvedValueOnce({ rows: [], changes: 1 }) // INSERT orders
        .mockResolvedValueOnce({ rows: [], changes: 1 }) // INSERT order_item
        .mockResolvedValueOnce({ rows: [makeItemRow()], changes: 0 })
        // no discount insert calls
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // COMMIT
        .mockResolvedValueOnce({ rows: [makeOrderRow()], changes: 0 })
        .mockResolvedValueOnce({ rows: [makeItemRow()], changes: 0 })
        .mockResolvedValueOnce({ rows: [], changes: 0 })

      const repo = createOrderRepository(db)
      await repo.create({
        number: 1,
        items: [
          {
            commodityId: 'com-001',
            name: '滷肉便當',
            price: 100,
            quantity: 1,
            includesSoup: false,
          },
        ],
        discounts: [],
        memo: [],
        soups: 0,
        total: 100,
        editor: '',
      })

      const calls = vi.mocked(db.exec).mock.calls
      const discountInsertCalls = calls.filter(
        c =>
          typeof c[0] === 'string' &&
          c[0].includes('INSERT INTO order_discounts'),
      )
      expect(discountInsertCalls).toHaveLength(0)
    })

    it('skips both item and discount inserts when both arrays are empty', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // BEGIN TRANSACTION
        .mockResolvedValueOnce({ rows: [], changes: 1 }) // INSERT orders
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // COMMIT
        .mockResolvedValueOnce({ rows: [makeOrderRow()], changes: 0 })
        .mockResolvedValueOnce({ rows: [], changes: 0 })
        .mockResolvedValueOnce({ rows: [], changes: 0 })

      const repo = createOrderRepository(db)
      await repo.create({
        number: 1,
        items: [],
        discounts: [],
        memo: [],
        soups: 0,
        total: 0,
        editor: '',
      })

      const calls = vi.mocked(db.exec).mock.calls
      expect(
        calls.filter(
          c =>
            typeof c[0] === 'string' &&
            c[0].includes('INSERT INTO order_items'),
        ),
      ).toHaveLength(0)
      expect(
        calls.filter(
          c =>
            typeof c[0] === 'string' &&
            c[0].includes('INSERT INTO order_discounts'),
        ),
      ).toHaveLength(0)
    })
  })

  // ─── getNextOrderNumber ───────────────────────────────────────────────────

  describe('getNextOrderNumber()', () => {
    it('calls db.exec with SQL to get MAX(number) for today', async () => {
      const repo = createOrderRepository(db)
      await repo.getNextOrderNumber()

      const call = vi.mocked(db.exec).mock.calls[0]
      expect(call![0]).toContain('SELECT MAX(number)')
      expect(call![0]).toContain('orders')
      expect(call![0]).toContain('created_at >= ?')
      expect(call![0]).toContain('created_at < ?')
    })

    it('returns 1 when no orders exist for today', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [{ max_number: null }],
        changes: 0,
      })

      const repo = createOrderRepository(db)
      const result = await repo.getNextOrderNumber()

      expect(result).toBe(1)
    })

    it('returns MAX(number) + 1 when orders exist for today', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [{ max_number: 5 }],
        changes: 0,
      })

      const repo = createOrderRepository(db)
      const result = await repo.getNextOrderNumber()

      expect(result).toBe(6)
    })

    it('handles the case when result rows are empty', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [],
        changes: 0,
      })

      const repo = createOrderRepository(db)
      const result = await repo.getNextOrderNumber()

      expect(result).toBe(1)
    })
  })

  // ─── remove ─────────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('calls db.exec with correct DELETE SQL and param', async () => {
      const repo = createOrderRepository(db)
      await repo.remove('ord-001')

      expect(db.exec).toHaveBeenCalledWith('DELETE FROM orders WHERE id = ?', [
        'ord-001',
      ])
    })

    it('removes child items and discounts before the parent order', async () => {
      const repo = createOrderRepository(db)
      await repo.remove('ord-001')

      const calls = vi.mocked(db.exec).mock.calls
      const itemDeleteIndex = calls.findIndex(([sql]) =>
        String(sql).includes('DELETE FROM order_items'),
      )
      const discountDeleteIndex = calls.findIndex(([sql]) =>
        String(sql).includes('DELETE FROM order_discounts'),
      )
      const orderDeleteIndex = calls.findIndex(([sql]) =>
        String(sql).includes('DELETE FROM orders'),
      )

      expect(itemDeleteIndex).toBeGreaterThanOrEqual(0)
      expect(discountDeleteIndex).toBeGreaterThanOrEqual(0)
      expect(orderDeleteIndex).toBeGreaterThanOrEqual(0)
      expect(itemDeleteIndex).toBeLessThan(orderDeleteIndex)
      expect(discountDeleteIndex).toBeLessThan(orderDeleteIndex)
      expect(calls[itemDeleteIndex]![1]).toEqual(['ord-001'])
      expect(calls[discountDeleteIndex]![1]).toEqual(['ord-001'])
    })

    it('returns true when a row was deleted (changes > 0)', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // DELETE order_items
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // DELETE order_discounts
        .mockResolvedValueOnce({ rows: [], changes: 1 }) // DELETE orders

      const repo = createOrderRepository(db)
      const result = await repo.remove('ord-001')

      expect(result).toBe(true)
    })

    it('returns false when no row was deleted (changes === 0)', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // DELETE order_items
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // DELETE order_discounts
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // DELETE orders

      const repo = createOrderRepository(db)
      const result = await repo.remove('non-existent')

      expect(result).toBe(false)
    })

    it('returns false when changes is undefined', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // DELETE order_items
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // DELETE order_discounts
        .mockResolvedValueOnce({
          rows: [],
          changes: undefined as unknown as number,
        }) // DELETE orders

      const repo = createOrderRepository(db)
      const result = await repo.remove('ord-001')

      expect(result).toBe(false)
    })
  })

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('should update order fields (memo, total, etc.)', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // BEGIN TRANSACTION
        .mockResolvedValueOnce({ rows: [], changes: 1 }) // UPDATE orders
        .mockResolvedValueOnce({ rows: [], changes: 1 }) // DELETE order_items
        .mockResolvedValueOnce({ rows: [], changes: 1 }) // DELETE order_discounts
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // COMMIT
        .mockResolvedValueOnce({
          // findById SELECT
          rows: [
            makeOrderRow({
              id: 'ord-001',
              number: 1,
              memo: JSON.stringify(['updated memo']),
              soups: 3,
              total: 300,
              original_total: 350,
              edited_memo: 'edited',
              editor: 'admin',
            }),
          ],
          changes: 0,
        })
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // findById items
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // findById discounts

      const repo = createOrderRepository(db)
      const result = await repo.update('ord-001', {
        number: 1,
        items: [],
        discounts: [],
        memo: ['updated memo'],
        soups: 3,
        total: 300,
        originalTotal: 350,
        editedMemo: 'edited',
        editor: 'admin',
      })

      // Verify UPDATE SQL was called
      const updateCall = vi
        .mocked(db.exec)
        .mock.calls.find(([sql]) => String(sql).includes('UPDATE orders'))
      expect(updateCall).toBeDefined()
      expect(result.memo).toEqual(['updated memo'])
      expect(result.total).toBe(300)
    })

    it('should replace items (delete old, insert new)', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // BEGIN TRANSACTION
        .mockResolvedValueOnce({ rows: [], changes: 1 }) // UPDATE orders
        .mockResolvedValueOnce({ rows: [], changes: 2 }) // DELETE order_items
        .mockResolvedValueOnce({ rows: [], changes: 1 }) // DELETE order_discounts
        .mockResolvedValueOnce({ rows: [], changes: 1 }) // INSERT order_item
        .mockResolvedValueOnce({
          rows: [makeItemRow({ id: 'new-item-001', name: '雞腿飯' })],
          changes: 0,
        }) // findByOrderId items (after createBatch)
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // COMMIT
        .mockResolvedValueOnce({
          // findById SELECT
          rows: [makeOrderRow({ id: 'ord-001' })],
          changes: 0,
        })
        .mockResolvedValueOnce({
          rows: [makeItemRow({ id: 'new-item-001', name: '雞腿飯' })],
          changes: 0,
        }) // findById items
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // findById discounts

      const repo = createOrderRepository(db)
      const result = await repo.update('ord-001', {
        number: 1,
        items: [
          {
            commodityId: 'com-002',
            name: '雞腿飯',
            price: 120,
            quantity: 1,
            includesSoup: true,
          },
        ],
        discounts: [],
        memo: [],
        soups: 1,
        total: 120,
        editor: '',
      })

      // Verify old items were deleted
      const deleteItemCall = vi
        .mocked(db.exec)
        .mock.calls.find(([sql]) =>
          String(sql).includes('DELETE FROM order_items'),
        )
      expect(deleteItemCall).toBeDefined()
      expect(deleteItemCall![1]).toEqual(['ord-001'])

      // Verify new items were inserted
      const insertItemCall = vi
        .mocked(db.exec)
        .mock.calls.find(([sql]) =>
          String(sql).includes('INSERT INTO order_items'),
        )
      expect(insertItemCall).toBeDefined()

      expect(result.items).toHaveLength(1)
    })

    it('should replace discounts', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // BEGIN TRANSACTION
        .mockResolvedValueOnce({ rows: [], changes: 1 }) // UPDATE orders
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // DELETE order_items
        .mockResolvedValueOnce({ rows: [], changes: 1 }) // DELETE order_discounts
        .mockResolvedValueOnce({ rows: [], changes: 1 }) // INSERT order_discount
        .mockResolvedValueOnce({
          rows: [
            makeDiscountRow({ id: 'new-disc', label: '新折扣', amount: 30 }),
          ],
          changes: 0,
        }) // findByOrderId discounts (after createBatch)
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // COMMIT
        .mockResolvedValueOnce({
          // findById SELECT
          rows: [makeOrderRow({ id: 'ord-001' })],
          changes: 0,
        })
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // findById items
        .mockResolvedValueOnce({
          rows: [
            makeDiscountRow({ id: 'new-disc', label: '新折扣', amount: 30 }),
          ],
          changes: 0,
        }) // findById discounts

      const repo = createOrderRepository(db)
      const result = await repo.update('ord-001', {
        number: 1,
        items: [],
        discounts: [{ label: '新折扣', amount: 30 }],
        memo: [],
        soups: 0,
        total: 70,
        editor: '',
      })

      // Verify old discounts were deleted
      const deleteDiscountCall = vi
        .mocked(db.exec)
        .mock.calls.find(([sql]) =>
          String(sql).includes('DELETE FROM order_discounts'),
        )
      expect(deleteDiscountCall).toBeDefined()
      expect(deleteDiscountCall![1]).toEqual(['ord-001'])

      expect(result.discounts).toHaveLength(1)
      expect(result.discounts[0]!.label).toBe('新折扣')
    })

    it('should update updated_at timestamp', async () => {
      const beforeTime = Date.now()

      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // BEGIN TRANSACTION
        .mockResolvedValueOnce({ rows: [], changes: 1 }) // UPDATE orders
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // DELETE order_items
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // DELETE order_discounts
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // COMMIT
        .mockResolvedValueOnce({
          rows: [makeOrderRow({ id: 'ord-001', updated_at: beforeTime })],
          changes: 0,
        })
        .mockResolvedValueOnce({ rows: [], changes: 0 })
        .mockResolvedValueOnce({ rows: [], changes: 0 })

      const repo = createOrderRepository(db)
      await repo.update('ord-001', {
        number: 1,
        items: [],
        discounts: [],
        memo: [],
        soups: 0,
        total: 0,
        editor: '',
      })

      // Verify the UPDATE call includes updated_at
      const updateCall = vi
        .mocked(db.exec)
        .mock.calls.find(([sql]) => String(sql).includes('UPDATE orders'))
      expect(updateCall).toBeDefined()
      expect(String(updateCall![0])).toContain('updated_at')
      // The timestamp param should be a number >= beforeTime
      const params = updateCall![1] as unknown[]
      const updatedAtParam = params[params.length - 2] // updated_at is second to last param (before id)
      expect(typeof updatedAtParam).toBe('number')
      expect(updatedAtParam as number).toBeGreaterThanOrEqual(beforeTime)
    })

    it('should preserve created_at and number (not in UPDATE SET clause)', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // BEGIN TRANSACTION
        .mockResolvedValueOnce({ rows: [], changes: 1 }) // UPDATE orders
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // DELETE order_items
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // DELETE order_discounts
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // COMMIT
        .mockResolvedValueOnce({
          rows: [
            makeOrderRow({
              id: 'ord-001',
              number: 5,
              created_at: 1700000000000,
            }),
          ],
          changes: 0,
        })
        .mockResolvedValueOnce({ rows: [], changes: 0 })
        .mockResolvedValueOnce({ rows: [], changes: 0 })

      const repo = createOrderRepository(db)
      const result = await repo.update('ord-001', {
        number: 5,
        items: [],
        discounts: [],
        memo: [],
        soups: 0,
        total: 0,
        editor: '',
      })

      // The UPDATE SQL should NOT set number or created_at
      const updateCall = vi
        .mocked(db.exec)
        .mock.calls.find(([sql]) => String(sql).includes('UPDATE orders'))
      const sql = String(updateCall![0])
      expect(sql).not.toContain('number =')
      expect(sql).not.toContain('created_at =')

      // Returned order should preserve original values
      expect(result.number).toBe(5)
      expect(result.createdAt).toBe(1700000000000)
    })

    it('should rollback on error', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // BEGIN TRANSACTION
        .mockRejectedValueOnce(new Error('DB write failure')) // UPDATE orders fails

      // After error, ROLLBACK should be called
      vi.mocked(db.exec).mockResolvedValueOnce({ rows: [], changes: 0 }) // ROLLBACK

      const repo = createOrderRepository(db)

      await expect(
        repo.update('ord-001', {
          number: 1,
          items: [],
          discounts: [],
          memo: [],
          soups: 0,
          total: 0,
          editor: '',
        }),
      ).rejects.toThrow('DB write failure')

      // Verify ROLLBACK was called
      const rollbackCall = vi
        .mocked(db.exec)
        .mock.calls.find(([sql]) => String(sql) === 'ROLLBACK')
      expect(rollbackCall).toBeDefined()
    })

    it('should throw if updated order not found after update', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // BEGIN TRANSACTION
        .mockResolvedValueOnce({ rows: [], changes: 1 }) // UPDATE orders
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // DELETE order_items
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // DELETE order_discounts
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // COMMIT
        .mockResolvedValueOnce({ rows: [], changes: 0 }) // findById returns empty
      // no items/discounts since no order found

      const repo = createOrderRepository(db)

      await expect(
        repo.update('ord-ghost', {
          number: 1,
          items: [],
          discounts: [],
          memo: [],
          soups: 0,
          total: 0,
          editor: '',
        }),
      ).rejects.toThrow('Failed to retrieve updated order')
    })
  })
})
