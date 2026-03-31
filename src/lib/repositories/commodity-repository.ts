import { nanoid } from 'nanoid'
import type { AsyncDatabase } from '@/lib/worker-database'
import type { Commodity, CreateCommodity } from '@/lib/schemas'

export interface CommodityRepository {
  findAll(): Promise<Commodity[]>
  findByTypeId(typeId: string): Promise<Commodity[]>
  findById(id: string): Promise<Commodity | undefined>
  findOnMarket(): Promise<Commodity[]>
  create(data: CreateCommodity): Promise<Commodity>
  update(
    id: string,
    data: Partial<CreateCommodity>,
  ): Promise<Commodity | undefined>
  remove(id: string): Promise<boolean>
  updatePriorities(ids: string[]): Promise<void>
}

/**
 * Parse a raw DB row into a Commodity object.
 */
function toCommodity(row: Record<string, unknown>): Commodity {
  return {
    id: String(row['id']),
    typeId: String(row['type_id']),
    name: String(row['name']),
    image: row['image'] != null ? String(row['image']) : undefined,
    price: Number(row['price']),
    priority: Number(row['priority']),
    onMarket: row['on_market'] === 1 || row['on_market'] === true,
    hideOnMode:
      row['hide_on_mode'] != null ? String(row['hide_on_mode']) : undefined,
    editor: row['editor'] != null ? String(row['editor']) : undefined,
    includesSoup: row['includes_soup'] === 1 || row['includes_soup'] === true,
    createdAt: Number(row['created_at']),
    updatedAt: Number(row['updated_at']),
  }
}

export function createCommodityRepository(
  db: AsyncDatabase,
): CommodityRepository {
  return {
    async findAll() {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM commodities ORDER BY priority ASC, name ASC',
      )
      return result.rows.map(toCommodity)
    },

    async findByTypeId(typeId: string) {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM commodities WHERE type_id = ? ORDER BY priority ASC, name ASC',
        [typeId],
      )
      return result.rows.map(toCommodity)
    },

    async findById(id: string) {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM commodities WHERE id = ?',
        [id],
      )
      const row = result.rows[0]
      return row ? toCommodity(row) : undefined
    },

    async findOnMarket() {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM commodities WHERE on_market = 1 ORDER BY priority ASC, name ASC',
      )
      return result.rows.map(toCommodity)
    },

    async create(data: CreateCommodity) {
      const id = nanoid()
      const now = Date.now()
      await db.exec(
        `INSERT INTO commodities (id, type_id, name, image, price, priority, on_market, hide_on_mode, editor, includes_soup, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.typeId,
          data.name,
          data.image ?? null,
          data.price,
          data.priority,
          data.onMarket ? 1 : 0,
          data.hideOnMode ?? null,
          data.editor ?? null,
          data.includesSoup ? 1 : 0,
          now,
          now,
        ],
      )
      const created = await this.findById(id)
      if (!created)
        throw new Error(`Failed to retrieve created commodity with id: ${id}`)
      return created
    },

    async update(id: string, data: Partial<CreateCommodity>) {
      const existing = await this.findById(id)
      if (!existing) return undefined

      const fields: string[] = []
      const values: unknown[] = []

      if (data.typeId !== undefined) {
        fields.push('type_id = ?')
        values.push(data.typeId)
      }
      if (data.name !== undefined) {
        fields.push('name = ?')
        values.push(data.name)
      }
      if (data.image !== undefined) {
        fields.push('image = ?')
        values.push(data.image)
      }
      if (data.price !== undefined) {
        fields.push('price = ?')
        values.push(data.price)
      }
      if (data.priority !== undefined) {
        fields.push('priority = ?')
        values.push(data.priority)
      }
      if (data.onMarket !== undefined) {
        fields.push('on_market = ?')
        values.push(data.onMarket ? 1 : 0)
      }
      if (data.hideOnMode !== undefined) {
        fields.push('hide_on_mode = ?')
        values.push(data.hideOnMode)
      }
      if (data.editor !== undefined) {
        fields.push('editor = ?')
        values.push(data.editor)
      }
      if (data.includesSoup !== undefined) {
        fields.push('includes_soup = ?')
        values.push(data.includesSoup ? 1 : 0)
      }

      if (fields.length === 0) return existing

      fields.push('updated_at = ?')
      values.push(Date.now())
      values.push(id)

      await db.exec(
        `UPDATE commodities SET ${fields.join(', ')} WHERE id = ?`,
        values,
      )
      const updated = await this.findById(id)
      return updated!
    },

    async remove(id: string) {
      const result = await db.exec('DELETE FROM commodities WHERE id = ?', [id])
      return result.changes > 0
    },

    async updatePriorities(ids: string[]) {
      for (let i = 0; i < ids.length; i++) {
        const priority = i + 1
        const now = Date.now()
        await db.exec(
          'UPDATE commodities SET priority = ?, updated_at = ? WHERE id = ?',
          [priority, now, ids[i]],
        )
      }
    },
  }
}
