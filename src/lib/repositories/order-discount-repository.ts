import { nanoid } from 'nanoid'
import type { AsyncDatabase } from '@/lib/worker-database'
import type { OrderDiscount, CreateOrderDiscount } from '@/lib/schemas'

export interface OrderDiscountRepository {
  findByOrderId(orderId: string): Promise<OrderDiscount[]>
  createBatch(discounts: CreateOrderDiscount[]): Promise<OrderDiscount[]>
  removeByOrderId(orderId: string): Promise<number>
}

/**
 * Parse a raw DB row into an OrderDiscount object.
 */
function toOrderDiscount(row: Record<string, unknown>): OrderDiscount {
  return {
    id: String(row['id']),
    orderId: String(row['order_id']),
    label: String(row['label']),
    amount: Number(row['amount']),
    createdAt: Number(row['created_at']),
  }
}

export function createOrderDiscountRepository(
  db: AsyncDatabase,
): OrderDiscountRepository {
  return {
    async findByOrderId(orderId: string) {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM order_discounts WHERE order_id = ? ORDER BY created_at ASC',
        [orderId],
      )
      return result.rows.map(toOrderDiscount)
    },

    async createBatch(discounts: CreateOrderDiscount[]) {
      if (discounts.length === 0) return []

      const orderId = discounts[0]!.orderId
      if (discounts.some(d => d.orderId !== orderId)) {
        throw new Error(
          'createBatch: all discounts must share the same orderId',
        )
      }

      const now = Date.now()
      for (const discount of discounts) {
        const id = nanoid()
        await db.exec(
          `INSERT INTO order_discounts (id, order_id, label, amount, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [id, discount.orderId, discount.label, discount.amount, now],
        )
      }

      return this.findByOrderId(discounts[0]!.orderId)
    },

    async removeByOrderId(orderId: string) {
      const result = await db.exec(
        'DELETE FROM order_discounts WHERE order_id = ?',
        [orderId],
      )
      return result.changes
    },
  }
}
