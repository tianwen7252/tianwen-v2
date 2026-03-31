import { nanoid } from 'nanoid'
import type { AsyncDatabase } from '@/lib/worker-database'
import type { CommodityType, CreateCommodityType } from '@/lib/schemas'

export interface CommodityTypeRepository {
  findAll(): Promise<CommodityType[]>
  findById(id: string): Promise<CommodityType | undefined>
  findByTypeId(typeId: string): Promise<CommodityType | undefined>
  create(data: CreateCommodityType): Promise<CommodityType>
  update(
    id: string,
    data: Partial<CreateCommodityType>,
  ): Promise<CommodityType | undefined>
  remove(id: string): Promise<boolean>
  updatePriorities(ids: string[]): Promise<void>
}

/**
 * Parse a raw DB row into a CommodityType object.
 */
function toCommodityType(row: Record<string, unknown>): CommodityType {
  return {
    id: String(row['id']),
    typeId: String(row['type_id']),
    type: String(row['type']),
    label: String(row['label']),
    color: String(row['color'] ?? ''),
    priority: Number(row['priority'] ?? 0),
    createdAt: Number(row['created_at']),
    updatedAt: Number(row['updated_at']),
  }
}

export function createCommodityTypeRepository(
  db: AsyncDatabase,
): CommodityTypeRepository {
  return {
    async findAll() {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM commodity_types ORDER BY priority ASC, id ASC',
      )
      return result.rows.map(toCommodityType)
    },

    async findById(id: string) {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM commodity_types WHERE id = ?',
        [id],
      )
      const row = result.rows[0]
      return row ? toCommodityType(row) : undefined
    },

    async findByTypeId(typeId: string) {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM commodity_types WHERE type_id = ?',
        [typeId],
      )
      const row = result.rows[0]
      return row ? toCommodityType(row) : undefined
    },

    async create(data: CreateCommodityType) {
      const id = nanoid()
      const now = Date.now()
      await db.exec(
        `INSERT INTO commodity_types (id, type_id, type, label, color, priority, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.typeId,
          data.type,
          data.label,
          data.color,
          data.priority ?? 0,
          now,
          now,
        ],
      )
      const created = await this.findById(id)
      if (!created)
        throw new Error(
          `Failed to retrieve created commodity type with id: ${id}`,
        )
      return created
    },

    async update(id: string, data: Partial<CreateCommodityType>) {
      const existing = await this.findById(id)
      if (!existing) return undefined

      const fields: string[] = []
      const values: unknown[] = []

      if (data.typeId !== undefined) {
        fields.push('type_id = ?')
        values.push(data.typeId)
      }
      if (data.type !== undefined) {
        fields.push('type = ?')
        values.push(data.type)
      }
      if (data.label !== undefined) {
        fields.push('label = ?')
        values.push(data.label)
      }
      if (data.color !== undefined) {
        fields.push('color = ?')
        values.push(data.color)
      }
      if (data.priority !== undefined) {
        fields.push('priority = ?')
        values.push(data.priority)
      }

      if (fields.length === 0) return existing

      fields.push('updated_at = ?')
      values.push(Date.now())
      values.push(id)

      await db.exec(
        `UPDATE commodity_types SET ${fields.join(', ')} WHERE id = ?`,
        values,
      )
      const updated = await this.findById(id)
      return updated!
    },

    async remove(id: string) {
      const result = await db.exec('DELETE FROM commodity_types WHERE id = ?', [
        id,
      ])
      return result.changes > 0
    },

    async updatePriorities(ids: string[]) {
      const now = Date.now()
      for (let i = 0; i < ids.length; i++) {
        await db.exec(
          'UPDATE commodity_types SET priority = ?, updated_at = ? WHERE id = ?',
          [i + 1, now, ids[i]],
        )
      }
    },
  }
}
