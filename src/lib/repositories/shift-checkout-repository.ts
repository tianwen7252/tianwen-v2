import { nanoid } from 'nanoid'
import type { AsyncDatabase } from '@/lib/worker-database'
import type {
  ShiftCheckout,
  CreateShiftCheckout,
  ShiftType,
} from '@/lib/schemas'

export interface ShiftCheckoutRepository {
  create(data: CreateShiftCheckout): Promise<ShiftCheckout>
  findByDate(date: string): Promise<ShiftCheckout[]>
  findByDateAndShift(
    date: string,
    shift: ShiftType,
  ): Promise<ShiftCheckout | undefined>
  remove(id: string): Promise<boolean>
}

function toShiftCheckout(row: Record<string, unknown>): ShiftCheckout {
  return {
    id: String(row['id']),
    date: String(row['date']),
    shift: String(row['shift']) as ShiftType,
    orderStaffId:
      row['order_staff_id'] != null ? String(row['order_staff_id']) : undefined,
    orderStaffName: String(row['order_staff_name'] ?? ''),
    checkoutAt: Number(row['checkout_at']),
    createdAt: Number(row['created_at']),
    updatedAt: Number(row['updated_at']),
  }
}

export function createShiftCheckoutRepository(
  db: AsyncDatabase,
): ShiftCheckoutRepository {
  return {
    async create(data: CreateShiftCheckout) {
      const id = nanoid()
      const now = Date.now()
      await db.exec(
        `INSERT INTO shift_checkouts (id, date, shift, order_staff_id, order_staff_name, checkout_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.date,
          data.shift,
          data.orderStaffId ?? null,
          data.orderStaffName,
          data.checkoutAt,
          now,
          now,
        ],
      )
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM shift_checkouts WHERE id = ?',
        [id],
      )
      return toShiftCheckout(result.rows[0]!)
    },

    async findByDate(date: string) {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM shift_checkouts WHERE date = ? ORDER BY checkout_at ASC',
        [date],
      )
      return result.rows.map(toShiftCheckout)
    },

    async findByDateAndShift(date: string, shift: ShiftType) {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM shift_checkouts WHERE date = ? AND shift = ?',
        [date, shift],
      )
      const row = result.rows[0]
      return row ? toShiftCheckout(row) : undefined
    },

    async remove(id: string) {
      const result = await db.exec('DELETE FROM shift_checkouts WHERE id = ?', [
        id,
      ])
      return (result.changes ?? 0) > 0
    },
  }
}
