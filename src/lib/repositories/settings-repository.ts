/**
 * Settings repository — persists app settings to SQLite via schema_meta table.
 * Uses key-value pairs with "setting:" prefix to distinguish from schema metadata.
 */

import type { AsyncDatabase } from '@/lib/worker-database'

export interface SettingsRepository {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
}

function settingsKey(key: string): string {
  return `setting:${key}`
}

export function createSettingsRepository(
  db: AsyncDatabase,
): SettingsRepository {
  return {
    async get(key: string): Promise<string | null> {
      const result = await db.exec<{ value: string }>(
        'SELECT value FROM schema_meta WHERE key = ?',
        [settingsKey(key)],
      )
      return result.rows[0]?.value ?? null
    },

    async set(key: string, value: string): Promise<void> {
      await db.exec(
        'INSERT OR REPLACE INTO schema_meta (key, value) VALUES (?, ?)',
        [settingsKey(key), value],
      )
    },

    async remove(key: string): Promise<void> {
      await db.exec('DELETE FROM schema_meta WHERE key = ?', [settingsKey(key)])
    },
  }
}
