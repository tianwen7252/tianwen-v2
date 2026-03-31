import { nanoid } from 'nanoid'
import type { AsyncDatabase } from '@/lib/worker-database'
import type { OrderType, CreateOrderType } from '@/lib/schemas'

export interface OrderTypeRepository {
  findAll(): Promise<OrderType[]>
  findById(id: string): Promise<OrderType | undefined>
  create(data: CreateOrderType): Promise<OrderType>
  update(
    id: string,
    data: Partial<CreateOrderType>,
  ): Promise<OrderType | undefined>
  remove(id: string): Promise<boolean>
  updatePriorities(ids: string[]): Promise<void>
}

/**
 * Parse a raw DB row into an OrderType object.
 */
function toOrderType(row: Record<string, unknown>): OrderType {
  return {
    id: String(row['id']),
    name: String(row['name']),
    priority: Number(row['priority']),
    type: String(row['type']),
    color: row['color'] != null ? String(row['color']) : undefined,
    editor: row['editor'] != null ? String(row['editor']) : undefined,
    createdAt: Number(row['created_at']),
    updatedAt: Number(row['updated_at']),
  }
}

export function createOrderTypeRepository(
  db: AsyncDatabase,
): OrderTypeRepository {
  return {
    async findAll() {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM order_types ORDER BY priority ASC, name ASC',
      )
      return result.rows.map(toOrderType)
    },

    async findById(id: string) {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM order_types WHERE id = ?',
        [id],
      )
      const row = result.rows[0]
      return row ? toOrderType(row) : undefined
    },

    async create(data: CreateOrderType) {
      const id = nanoid()
      const now = Date.now()
      await db.exec(
        `INSERT INTO order_types (id, name, priority, type, color, editor, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.name,
          data.priority,
          data.type,
          data.color ?? null,
          data.editor ?? null,
          now,
          now,
        ],
      )
      const created = await this.findById(id)
      if (!created)
        throw new Error(`Failed to retrieve created order type with id: ${id}`)
      return created
    },

    async update(id: string, data: Partial<CreateOrderType>) {
      const existing = await this.findById(id)
      if (!existing) return undefined

      const fields: string[] = []
      const values: unknown[] = []

      if (data.name !== undefined) {
        fields.push('name = ?')
        values.push(data.name)
      }
      if (data.priority !== undefined) {
        fields.push('priority = ?')
        values.push(data.priority)
      }
      if (data.type !== undefined) {
        fields.push('type = ?')
        values.push(data.type)
      }
      if (data.color !== undefined) {
        fields.push('color = ?')
        values.push(data.color)
      }
      if (data.editor !== undefined) {
        fields.push('editor = ?')
        values.push(data.editor)
      }

      if (fields.length === 0) return existing

      fields.push('updated_at = ?')
      values.push(Date.now())
      values.push(id)

      await db.exec(
        `UPDATE order_types SET ${fields.join(', ')} WHERE id = ?`,
        values,
      )
      const updated = await this.findById(id)
      return updated!
    },

    async remove(id: string) {
      const result = await db.exec('DELETE FROM order_types WHERE id = ?', [id])
      return result.changes > 0
    },

    async updatePriorities(ids: string[]) {
      for (let i = 0; i < ids.length; i++) {
        const priority = i + 1
        const now = Date.now()
        await db.exec(
          'UPDATE order_types SET priority = ?, updated_at = ? WHERE id = ?',
          [priority, now, ids[i]],
        )
      }
    },
  }
}
