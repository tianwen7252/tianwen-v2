import { nanoid } from 'nanoid'
import dayjs from 'dayjs'
import type { AsyncDatabase } from '@/lib/worker-database'
import type { Order, CreateOrder } from '@/lib/schemas'
import { createOrderItemRepository } from './order-item-repository'
import { createOrderDiscountRepository } from './order-discount-repository'

export interface OrderRepository {
  findAll(): Promise<Order[]>
  findById(id: string): Promise<Order | undefined>
  findByDateRange(startDate: number, endDate: number): Promise<Order[]>
  create(data: CreateOrder): Promise<Order>
  update(id: string, data: CreateOrder): Promise<Order>
  remove(id: string): Promise<boolean>
  getNextOrderNumber(): Promise<number>
}

/**
 * Parse a raw DB row into the base Order fields (without normalized items/discounts).
 * Handles JSON.parse for the memo field.
 */
function rowToOrderBase(
  row: Record<string, unknown>,
): Omit<Order, 'items' | 'discounts'> {
  return {
    id: String(row['id']),
    number: Number(row['number']),
    memo: JSON.parse(String(row['memo'] ?? '[]')),
    soups: Number(row['soups']),
    total: Number(row['total']),
    originalTotal:
      row['original_total'] != null ? Number(row['original_total']) : undefined,
    editedMemo:
      row['edited_memo'] != null ? String(row['edited_memo']) : undefined,
    editor: String(row['editor'] ?? ''),
    createdAt: Number(row['created_at']),
    updatedAt: Number(row['updated_at']),
  }
}

export function createOrderRepository(db: AsyncDatabase): OrderRepository {
  const itemRepo = createOrderItemRepository(db)
  const discountRepo = createOrderDiscountRepository(db)

  async function attachRelated(
    base: Omit<Order, 'items' | 'discounts'>,
  ): Promise<Order> {
    const [items, discounts] = await Promise.all([
      itemRepo.findByOrderId(base.id),
      discountRepo.findByOrderId(base.id),
    ])
    return { ...base, items, discounts }
  }

  return {
    async findAll() {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM orders ORDER BY created_at DESC',
      )
      return Promise.all(result.rows.map(rowToOrderBase).map(attachRelated))
    },

    async findById(id: string) {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM orders WHERE id = ?',
        [id],
      )
      const row = result.rows[0]
      if (!row) return undefined
      return attachRelated(rowToOrderBase(row))
    },

    async findByDateRange(startDate: number, endDate: number) {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM orders WHERE created_at >= ? AND created_at <= ? ORDER BY created_at DESC',
        [startDate, endDate],
      )
      return Promise.all(result.rows.map(rowToOrderBase).map(attachRelated))
    },

    async create(data: CreateOrder) {
      const id = nanoid()
      const now = Date.now()

      await db.exec('BEGIN TRANSACTION')
      try {
        await db.exec(
          `INSERT INTO orders (id, number, memo, soups, total, original_total, edited_memo, editor, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            data.number,
            JSON.stringify(data.memo),
            data.soups,
            data.total,
            data.originalTotal ?? null,
            data.editedMemo ?? null,
            data.editor,
            now,
            now,
          ],
        )

        // Insert normalized items if any
        if (data.items.length > 0) {
          await itemRepo.createBatch(
            data.items.map(item => ({ ...item, orderId: id })),
          )
        }

        // Insert normalized discounts if any
        if (data.discounts.length > 0) {
          await discountRepo.createBatch(
            data.discounts.map(d => ({ ...d, orderId: id })),
          )
        }

        await db.exec('COMMIT')
      } catch (err) {
        await db.exec('ROLLBACK')
        throw err
      }

      const created = await this.findById(id)
      if (!created)
        throw new Error(`Failed to retrieve created order with id: ${id}`)
      return created
    },

    async update(id: string, data: CreateOrder) {
      const now = Date.now()

      await db.exec('BEGIN TRANSACTION')
      try {
        await db.exec(
          `UPDATE orders
           SET memo = ?, soups = ?, total = ?, original_total = ?, edited_memo = ?, editor = ?, updated_at = ?
           WHERE id = ?`,
          [
            JSON.stringify(data.memo),
            data.soups,
            data.total,
            data.originalTotal ?? null,
            data.editedMemo ?? null,
            data.editor,
            now,
            id,
          ],
        )

        // Replace child rows: delete existing, then insert new
        await itemRepo.removeByOrderId(id)
        await discountRepo.removeByOrderId(id)

        if (data.items.length > 0) {
          await itemRepo.createBatch(
            data.items.map(item => ({ ...item, orderId: id })),
          )
        }

        if (data.discounts.length > 0) {
          await discountRepo.createBatch(
            data.discounts.map(d => ({ ...d, orderId: id })),
          )
        }

        await db.exec('COMMIT')
      } catch (err) {
        await db.exec('ROLLBACK')
        throw err
      }

      const updated = await this.findById(id)
      if (!updated)
        throw new Error(`Failed to retrieve updated order with id: ${id}`)
      return updated
    },

    async remove(id: string) {
      // Delete child rows first to avoid FK constraint violations
      await itemRepo.removeByOrderId(id)
      await discountRepo.removeByOrderId(id)
      const result = await db.exec('DELETE FROM orders WHERE id = ?', [id])
      return (result.changes ?? 0) > 0
    },

    async getNextOrderNumber() {
      const todayStart = dayjs().startOf('day').valueOf()
      const tomorrowStart = dayjs().add(1, 'day').startOf('day').valueOf()

      const result = await db.exec<Record<string, unknown>>(
        'SELECT MAX(number) as max_number FROM orders WHERE created_at >= ? AND created_at < ?',
        [todayStart, tomorrowStart],
      )

      const row = result.rows[0]
      const maxNumber = row ? Number(row['max_number']) : null
      return maxNumber != null && !isNaN(maxNumber) ? maxNumber + 1 : 1
    },
  }
}
