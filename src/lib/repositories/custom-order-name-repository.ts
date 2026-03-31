import { nanoid } from 'nanoid'
import type { AsyncDatabase } from '@/lib/worker-database'
import type { CustomOrderName } from '@/lib/schemas'

// ─── Interface ──────────────────────────────────────────────────────────────

export interface CustomOrderNameRepository {
  findAll(): Promise<CustomOrderName[]>
  create(name: string): Promise<CustomOrderName>
  remove(id: string): Promise<boolean>
}

// ─── Row mapper ─────────────────────────────────────────────────────────────

function toCustomOrderName(row: Record<string, unknown>): CustomOrderName {
  return {
    id: String(row['id']),
    name: String(row['name']),
    createdAt: Number(row['created_at']),
  }
}

// ─── Factory ────────────────────────────────────────────────────────────────

export function createCustomOrderNameRepository(
  db: AsyncDatabase,
): CustomOrderNameRepository {
  return {
    async findAll() {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM custom_order_names ORDER BY created_at DESC',
      )
      return result.rows.map(toCustomOrderName)
    },

    async create(name: string) {
      const id = nanoid()
      const now = Date.now()
      // INSERT OR IGNORE handles duplicate names gracefully
      await db.exec(
        `INSERT OR IGNORE INTO custom_order_names (id, name, created_at) VALUES (?, ?, ?)`,
        [id, name, now],
      )
      // Return the row (may already exist with different id if duplicate)
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM custom_order_names WHERE name = ?',
        [name],
      )
      const row = result.rows[0]
      if (!row)
        throw new Error(`custom_order_names: row not found for name="${name}"`)
      return toCustomOrderName(row)
    },

    async remove(id: string) {
      const result = await db.exec(
        'DELETE FROM custom_order_names WHERE id = ?',
        [id],
      )
      return (result.changes ?? 0) > 0
    },
  }
}
