import { nanoid } from 'nanoid'
import type { AsyncDatabase } from '@/lib/worker-database'
import type { BackupLog, BackupLogType, BackupLogStatus } from '@/lib/schemas'
import { backupLogTypeEnum, backupLogStatusEnum } from '@/lib/schemas'

export interface CreateBackupLogOptions {
  readonly filename?: string
  readonly size?: number
  readonly durationMs?: number
  readonly errorMessage?: string
}

export interface BackupLogRepository {
  create(
    type: BackupLogType,
    status: BackupLogStatus,
    options?: CreateBackupLogOptions,
  ): Promise<BackupLog>
  findPaginated(page: number, pageSize: number): Promise<BackupLog[]>
  /**
   * Get the `created_at` timestamp (ms) of the most recent successful backup,
   * or `null` if none exists. Used on app bootstrap to hydrate
   * `lastBackupTime` so that auto-backup scheduling survives PWA reloads.
   */
  findLatestSuccessfulTimestamp(): Promise<number | null>
  count(): Promise<number>
  clearAll(): Promise<void>
}

/**
 * Parse a raw DB row into a BackupLog object.
 */
function toBackupLog(row: Record<string, unknown>): BackupLog {
  return {
    id: String(row['id']),
    type: backupLogTypeEnum.parse(String(row['type'])),
    status: backupLogStatusEnum.parse(String(row['status'])),
    filename: row['filename'] != null ? String(row['filename']) : null,
    size: row['size'] != null ? Number(row['size']) : 0,
    durationMs: row['duration_ms'] != null ? Number(row['duration_ms']) : 0,
    errorMessage:
      row['error_message'] != null ? String(row['error_message']) : null,
    createdAt: Number(row['created_at']),
    updatedAt: Number(row['updated_at']),
  }
}

export function createBackupLogRepository(
  db: AsyncDatabase,
): BackupLogRepository {
  return {
    async create(
      type: BackupLogType,
      status: BackupLogStatus,
      options?: CreateBackupLogOptions,
    ) {
      const id = nanoid()
      const now = Date.now()
      await db.exec(
        `INSERT INTO backup_logs (id, type, status, filename, size, duration_ms, error_message, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          type,
          status,
          options?.filename ?? null,
          options?.size ?? 0,
          options?.durationMs ?? 0,
          options?.errorMessage ?? null,
          now,
        ],
      )
      const result = await db.exec<Record<string, unknown>>(
        'SELECT * FROM backup_logs WHERE id = ?',
        [id],
      )
      const row = result.rows[0]
      if (!row) {
        throw new Error(
          `BackupLog insert succeeded but row not found: id=${id}`,
        )
      }
      return toBackupLog(row)
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
        'SELECT * FROM backup_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [pageSize, offset],
      )
      return result.rows.map(toBackupLog)
    },

    async findLatestSuccessfulTimestamp() {
      const result = await db.exec<Record<string, unknown>>(
        `SELECT created_at FROM backup_logs
         WHERE status = 'success'
         ORDER BY created_at DESC
         LIMIT 1`,
      )
      const row = result.rows[0]
      if (!row || row['created_at'] == null) {
        return null
      }
      return Number(row['created_at'])
    },

    async clearAll() {
      await db.exec('DELETE FROM backup_logs')
    },

    async count() {
      const result = await db.exec<Record<string, unknown>>(
        'SELECT COUNT(*) AS count FROM backup_logs',
      )
      return Number(result.rows[0]!['count'])
    },
  }
}
