/**
 * Tests for OrderDiscountRepository.
 * Uses a mock AsyncDatabase since SQLite WASM cannot run in Node/Vitest.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AsyncDatabase } from '@/lib/worker-database'
import { createOrderDiscountRepository } from './order-discount-repository'

function createMockAsyncDb(): AsyncDatabase {
  return {
    exec: vi.fn(async () => ({ rows: [], changes: 0 })),
    exportDatabase: vi.fn(async () => new Uint8Array()),
  }
}

describe('OrderDiscountRepository', () => {
  let db: AsyncDatabase

  beforeEach(() => {
    db = createMockAsyncDb()
  })

  // ─── findByOrderId ───────────────────────────────────────────────────────────

  describe('findByOrderId()', () => {
    it('calls db.exec with correct SQL and orderId param', async () => {
      const repo = createOrderDiscountRepository(db)
      await repo.findByOrderId('order-001')

      expect(db.exec).toHaveBeenCalledWith(
        'SELECT * FROM order_discounts WHERE order_id = ? ORDER BY created_at ASC',
        ['order-001'],
      )
    })

    it('returns empty array when no discounts exist', async () => {
      const repo = createOrderDiscountRepository(db)
      const result = await repo.findByOrderId('order-001')

      expect(result).toEqual([])
    })

    it('maps all fields correctly to OrderDiscount shape', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'disc-001',
            order_id: 'order-001',
            label: '員工折扣',
            amount: 20,
            created_at: 1700000000000,
            updated_at: 1700000000000,
          },
        ],
        changes: 0,
      })

      const repo = createOrderDiscountRepository(db)
      const result = await repo.findByOrderId('order-001')

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'disc-001',
        orderId: 'order-001',
        label: '員工折扣',
        amount: 20,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      })
    })

    it('returns multiple discounts sorted by created_at ASC', async () => {
      vi.mocked(db.exec).mockResolvedValueOnce({
        rows: [
          {
            id: 'disc-001',
            order_id: 'order-001',
            label: '會員折扣',
            amount: 10,
            created_at: 1700000000000,
          },
          {
            id: 'disc-002',
            order_id: 'order-001',
            label: '生日優惠',
            amount: 50,
            created_at: 1700000001000,
          },
        ],
        changes: 0,
      })

      const repo = createOrderDiscountRepository(db)
      const result = await repo.findByOrderId('order-001')

      expect(result).toHaveLength(2)
      expect(result[0]!.id).toBe('disc-001')
      expect(result[1]!.id).toBe('disc-002')
    })
  })

  // ─── createBatch ─────────────────────────────────────────────────────────────

  describe('createBatch()', () => {
    it('returns empty array for empty input', async () => {
      const repo = createOrderDiscountRepository(db)
      const result = await repo.createBatch([])

      expect(result).toEqual([])
      expect(db.exec).not.toHaveBeenCalled()
    })

    it('calls INSERT for each discount in batch', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'generated-id-1',
              order_id: 'order-001',
              label: '員工折扣',
              amount: 20,
              created_at: 1700000000000,
            },
            {
              id: 'generated-id-2',
              order_id: 'order-001',
              label: '生日優惠',
              amount: 50,
              created_at: 1700000000000,
            },
          ],
          changes: 0,
        })

      const repo = createOrderDiscountRepository(db)
      await repo.createBatch([
        { orderId: 'order-001', label: '員工折扣', amount: 20 },
        { orderId: 'order-001', label: '生日優惠', amount: 50 },
      ])

      const insertCalls = vi
        .mocked(db.exec)
        .mock.calls.filter(call => String(call[0]).includes('INSERT'))
      expect(insertCalls).toHaveLength(2)
    })

    it('returns created discounts via findByOrderId', async () => {
      const mockRows = [
        {
          id: 'generated-id',
          order_id: 'order-001',
          label: '員工折扣',
          amount: 20,
          created_at: 1700000000000,
        },
      ]

      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({ rows: mockRows, changes: 0 })

      const repo = createOrderDiscountRepository(db)
      const result = await repo.createBatch([
        { orderId: 'order-001', label: '員工折扣', amount: 20 },
      ])

      expect(result).toHaveLength(1)
      expect(result[0]!.orderId).toBe('order-001')
      expect(result[0]!.label).toBe('員工折扣')
      expect(result[0]!.amount).toBe(20)
    })

    it('throws when discounts have different orderIds', async () => {
      const repo = createOrderDiscountRepository(db)
      await expect(
        repo.createBatch([
          { orderId: 'order-001', label: '員工折扣', amount: 20 },
          { orderId: 'order-002', label: '生日優惠', amount: 50 },
        ]),
      ).rejects.toThrow(
        'createBatch: all discounts must share the same orderId',
      )
    })

    it('inserts correct SQL into order_discounts table', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'generated-id',
              order_id: 'order-001',
              label: '員工折扣',
              amount: 20,
              created_at: 1700000000000,
            },
          ],
          changes: 0,
        })

      const repo = createOrderDiscountRepository(db)
      await repo.createBatch([
        { orderId: 'order-001', label: '員工折扣', amount: 20 },
      ])

      const insertCall = vi.mocked(db.exec).mock.calls[0]
      expect(String(insertCall![0])).toContain('INSERT INTO order_discounts')
    })

    it('passes correct params for INSERT', async () => {
      vi.mocked(db.exec)
        .mockResolvedValueOnce({ rows: [], changes: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'generated-id',
              order_id: 'order-001',
              label: '員工折扣',
              amount: 20,
              created_at: 1700000000000,
            },
          ],
          changes: 0,
        })

      const repo = createOrderDiscountRepository(db)
      await repo.createBatch([
        { orderId: 'order-001', label: '員工折扣', amount: 20 },
      ])

      const insertCall = vi.mocked(db.exec).mock.calls[0]
      // Params: [id, orderId, label, amount, createdAt]
      expect(insertCall![1]![1]).toBe('order-001')
      expect(insertCall![1]![2]).toBe('員工折扣')
      expect(insertCall![1]![3]).toBe(20)
    })
  })

  // ─── removeByOrderId ─────────────────────────────────────────────────────────

  describe('removeByOrderId()', () => {
    it('calls DELETE with orderId param', async () => {
      const repo = createOrderDiscountRepository(db)
      await repo.removeByOrderId('order-001')

      expect(db.exec).toHaveBeenCalledWith(
        'DELETE FROM order_discounts WHERE order_id = ?',
        ['order-001'],
      )
    })

    it('returns number of deleted rows', async () => {
      db.exec = vi.fn(async () => ({ rows: [], changes: 2 }))
      const repo = createOrderDiscountRepository(db)
      const result = await repo.removeByOrderId('order-001')

      expect(result).toBe(2)
    })

    it('returns 0 when no rows matched', async () => {
      db.exec = vi.fn(async () => ({ rows: [], changes: 0 }))
      const repo = createOrderDiscountRepository(db)
      const result = await repo.removeByOrderId('non-existent')

      expect(result).toBe(0)
    })
  })
})
