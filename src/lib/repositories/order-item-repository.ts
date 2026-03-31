import { nanoid } from 'nanoid'
import type { AsyncDatabase } from '@/lib/worker-database'
import type { OrderItem, CreateOrderItem } from '@/lib/schemas'

export interface OrderItemRepository {
  findByOrderId(orderId: string): Promise<OrderItem[]>
  createBatch(items: CreateOrderItem[]): Promise<OrderItem[]>
  removeByOrderId(orderId: string): Promise<number>
}

/**
 * Parse a raw DB row into an OrderItem object.
 */
function toOrderItem(row: Record<string, unknown>): OrderItem {
  return {
    id: String(row['id']),
    orderId: String(row['order_id']),
    commodityId: String(row['commodity_id']),
    name: String(row['name']),
    price: Number(row['price']),
    quantity: Number(row['quantity']),
    includesSoup: Number(row['includes_soup']) !== 0,
    createdAt: Number(row['created_at']),
  }
}

export function createOrderItemRepository(
  db: AsyncDatabase,
): OrderItemRepository {
  return {
    async findByOrderId(orderId: string) {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC',
        [orderId],
      )
      return result.rows.map(toOrderItem)
    },

    async createBatch(items: CreateOrderItem[]) {
      if (items.length === 0) return []

      const orderId = items[0]!.orderId
      if (items.some(item => item.orderId !== orderId)) {
        throw new Error('createBatch: all items must share the same orderId')
      }

      const now = Date.now()
      for (const item of items) {
        const id = nanoid()
        await db.exec(
          `INSERT INTO order_items (id, order_id, commodity_id, name, price, quantity, includes_soup, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            item.orderId,
            item.commodityId,
            item.name,
            item.price,
            item.quantity,
            item.includesSoup ? 1 : 0,
            now,
          ],
        )
      }

      return this.findByOrderId(items[0]!.orderId)
    },

    async removeByOrderId(orderId: string) {
      const result = await db.exec(
        'DELETE FROM order_items WHERE order_id = ?',
        [orderId],
      )
      return result.changes
    },
  }
}
