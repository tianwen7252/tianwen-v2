import { nanoid } from 'nanoid'
import type { AsyncDatabase } from '@/lib/worker-database'
import type { ErrorLog } from '@/lib/schemas'

export interface ErrorLogRepository {
  create(message: string, source: string, stack?: string): Promise<ErrorLog>
  findRecent(limit?: number): Promise<ErrorLog[]>
  findPaginated(page: number, pageSize: number): Promise<ErrorLog[]>
  clearAll(): Promise<void>
  count(): Promise<number>
}

/**
 * Parse a raw DB row into an ErrorLog object.
 */
function toErrorLog(row: Record<string, unknown>): ErrorLog {
  return {
    id: String(row['id']),
    message: String(row['message']),
    source: String(row['source']),
    stack: row['stack'] != null ? String(row['stack']) : null,
    createdAt: Number(row['created_at']),
    updatedAt: Number(row['updated_at']),
  }
}

export function createErrorLogRepository(
  db: AsyncDatabase,
): ErrorLogRepository {
  return {
    async create(message: string, source: string, stack?: string) {
      const id = nanoid()
      const now = Date.now()
      await db.exec(
        `INSERT INTO error_logs (id, message, source, stack, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [id, message, source, stack ?? null, now],
      )
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM error_logs WHERE id = ?',
        [id],
      )
      return toErrorLog(result.rows[0]!)
    },

    async findRecent(limit = 50) {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM error_logs ORDER BY created_at DESC LIMIT ?',
        [limit],
      )
      return result.rows.map(toErrorLog)
    },

    async findPaginated(page: number, pageSize: number) {
      if (page < 1) {
        throw new Error(`page must be >= 1, got ${page}`)
      }
      if (pageSize < 1) {
        throw new Error(`pageSize must be >= 1, got ${pageSize}`)
      }
      const offset = (page - 1) * pageSize
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM error_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [pageSize, offset],
      )
      return result.rows.map(toErrorLog)
    },

    async clearAll() {
      await db.exec('DELETE FROM error_logs')
    },

    async count() {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT COUNT(*) FROM error_logs',
      )
      return Number(result.rows[0]!['COUNT(*)'])
    },
  }
}
