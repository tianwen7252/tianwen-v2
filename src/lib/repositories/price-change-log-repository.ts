import { nanoid } from 'nanoid'
import type { AsyncDatabase } from '@/lib/worker-database'
import type { PriceChangeLog } from '@/lib/schemas'

export interface PriceChangeLogRepository {
  findAll(limit?: number, offset?: number): Promise<PriceChangeLog[]>
  count(): Promise<number>
  create(data: {
    commodityId: string
    commodityName: string
    oldPrice: number
    newPrice: number
    editor?: string
  }): Promise<PriceChangeLog>
}

/**
 * Parse a raw DB row into a PriceChangeLog object.
 */
function toPriceChangeLog(row: Record<string, unknown>): PriceChangeLog {
  return {
    id: String(row['id']),
    commodityId: String(row['commodity_id']),
    commodityName: String(row['commodity_name']),
    oldPrice: Number(row['old_price']),
    newPrice: Number(row['new_price']),
    editor: String(row['editor']),
    createdAt: Number(row['created_at']),
    updatedAt: Number(row['updated_at']),
  }
}

export function createPriceChangeLogRepository(
  db: AsyncDatabase,
): PriceChangeLogRepository {
  return {
    async findAll(limit = 20, offset = 0) {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM price_change_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset],
      )
      return result.rows.map(toPriceChangeLog)
    },

    async count() {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT COUNT(*) FROM price_change_logs',
      )
      return Number(result.rows[0]!['COUNT(*)'])
    },

    async create(data) {
      const id = nanoid()
      const now = Date.now()
      await db.exec(
        `INSERT INTO price_change_logs (id, commodity_id, commodity_name, old_price, new_price, editor, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.commodityId,
          data.commodityName,
          data.oldPrice,
          data.newPrice,
          data.editor ?? '',
          now,
        ],
      )
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM price_change_logs WHERE id = ?',
        [id],
      )
      return toPriceChangeLog(result.rows[0]!)
    },
  }
}
