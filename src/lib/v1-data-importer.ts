/**
 * V1 data importer — writes transformed V1 backup data into the SQLite database.
 *
 * Imports tables in dependency order (commodity_types before commodities, etc.),
 * uses INSERT OR IGNORE to handle duplicates, and reports progress per table.
 */

import type { AsyncDatabase } from '@/lib/worker-database'
import type { TransformResult } from '@/lib/v1-data-transformer'

// ── Types ───────────────────────────────────────────────────────────────────

export interface V1ImportProgress {
  readonly phase:
    | 'downloading'
    | 'transforming'
    | 'orders'
    | 'order_items'
    | 'done'
  readonly current: number
  readonly total: number
  readonly tableName: string
}

export interface V1ImportResult {
  readonly counts: Record<string, number>
  readonly errors: readonly string[]
}

// ── Table column definitions ────────────────────────────────────────────────

/**
 * Column definitions for each V2 table, in the order they appear in INSERT SQL.
 * Only columns that can be supplied from V1 data are listed.
 */
const TABLE_COLUMNS: Record<string, readonly string[]> = {
  orders: [
    'id',
    'number',
    'memo',
    'soups',
    'total',
    'original_total',
    'edited_memo',
    'editor',
    'created_at',
    'updated_at',
  ],
  order_items: [
    'id',
    'order_id',
    'commodity_id',
    'name',
    'price',
    'quantity',
    'includes_soup',
    'created_at',
    'updated_at',
  ],
} as const

/**
 * Import order — commodity_types before commodities (FK), orders before order_items (FK).
 * Only essential tables: excludes order_types, employees, attendances, daily_data, order_discounts.
 */
const IMPORT_ORDER: readonly string[] = [
  'orders',
  'order_items',
] as const

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build INSERT OR IGNORE SQL for a given table.
 */
function buildInsertSql(tableName: string, columns: readonly string[]): string {
  const placeholders = columns.map(() => '?').join(', ')
  return `INSERT OR IGNORE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`
}

/**
 * Extract column values from a record, applying V1-specific coercions.
 * Missing columns get null (letting SQLite defaults apply).
 */
function extractValues(
  record: Record<string, unknown>,
  columns: readonly string[],
  tableName: string,
): unknown[] {
  return columns.map(col => {
    const value = record[col]

    // V1 memo is an array — store as JSON string
    if (col === 'memo' && tableName === 'orders') {
      if (Array.isArray(value)) {
        return JSON.stringify(value)
      }
      return value ?? '[]'
    }

    // V1 orders don't have editor — default to empty string
    if (col === 'editor' && tableName === 'orders' && value == null) {
      return ''
    }

    // V1 orders don't have original_total — use null
    if (col === 'original_total' && value == null) {
      return null
    }

    // V1 orders don't have updated_at — use created_at
    if (col === 'updated_at' && value == null) {
      return record.created_at ?? null
    }

    // Ensure IDs are strings
    if (col === 'id' && value != null) {
      return String(value)
    }

    // Ensure foreign key IDs are strings
    if (
      (col === 'type_id' ||
        col === 'order_id' ||
        col === 'commodity_id' ||
        col === 'employee_id') &&
      value != null
    ) {
      return String(value)
    }

    // Ensure on_market is a number (V1 uses string "1"/"0")
    if (col === 'on_market') {
      return value != null ? Number(value) || 0 : 1
    }

    // Ensure includes_soup is a number (V1 doesn't have this field)
    if (col === 'includes_soup') {
      return value != null ? (Number(value) || 0) : 0
    }

    // Ensure priority is a number
    if (col === 'priority') {
      return value != null ? Number(value) || 0 : 0
    }

    return value ?? null
  })
}

// ── Progress batch size ─────────────────────────────────────────────────────

/** Report progress every N rows within a large table */
const PROGRESS_BATCH_SIZE = 500

// ── Main importer ───────────────────────────────────────────────────────────

/**
 * Import transformed V1 data into the SQLite database.
 *
 * - Inserts tables in dependency order
 * - Uses transactions (BEGIN/COMMIT) per table for performance
 * - Uses INSERT OR IGNORE to skip duplicates
 * - Collects per-row errors without aborting the entire import
 * - Reports progress after each table or every PROGRESS_BATCH_SIZE rows
 */
export async function importV1Data(
  db: AsyncDatabase,
  transformed: TransformResult,
  onProgress?: (progress: V1ImportProgress) => void,
): Promise<V1ImportResult> {
  const counts: Record<string, number> = {}
  const errors: string[] = []

  // Map V1 order_items commodity_id to V2 commodity IDs by matching product name.
  // This way order_items.commodity_id points to real V2 commodities → correct categories.
  const v2NameToId = new Map<string, string>()
  const v2Rows = await db.exec<{ id: string; name: string }>(
    'SELECT id, name FROM commodities',
  )
  for (const row of v2Rows.rows) {
    v2NameToId.set(row.name, row.id)
  }

  // Remap commodity_id in order items
  const remappedOrderItems = transformed.orderItems.map(item => {
    const name = String(item.name ?? '')
    const v2Id = v2NameToId.get(name)
    if (v2Id) {
      return { ...item, commodity_id: v2Id }
    }
    return item
  })

  // Disable FK for the few unmatched items (e.g., 沙拉, 4包水餃)
  // whose commodity_id still references non-existent V1 IDs.
  await db.exec('PRAGMA foreign_keys = OFF')

  try {
  for (const tableName of IMPORT_ORDER) {
    let records: readonly Record<string, unknown>[]
    if (tableName === 'order_items') {
      records = remappedOrderItems
    } else {
      records = transformed.tables.get(tableName) ?? []
    }

    const columns = TABLE_COLUMNS[tableName]
    if (!columns || records.length === 0) {
      counts[tableName] = 0
      onProgress?.({
        phase: tableName as V1ImportProgress['phase'],
        current: 0,
        total: 0,
        tableName,
      })
      continue
    }

    const sql = buildInsertSql(tableName, columns)
    let inserted = 0

    // Begin transaction for this table
    await db.exec('BEGIN TRANSACTION')

    try {
      for (let i = 0; i < records.length; i++) {
        const record = records[i]!
        const values = extractValues(record, columns, tableName)

        try {
          const result = await db.exec(sql, values)
          inserted += result.changes
        } catch (err: unknown) {
          const msg =
            err instanceof Error ? err.message : 'Unknown insert error'
          errors.push(`[${tableName}] Row ${i}: ${msg}`)
        }

        // Report progress periodically
        if ((i + 1) % PROGRESS_BATCH_SIZE === 0 || i === records.length - 1) {
          onProgress?.({
            phase: tableName as V1ImportProgress['phase'],
            current: i + 1,
            total: records.length,
            tableName,
          })
        }
      }

      await db.exec('COMMIT')
    } catch (err: unknown) {
      // If COMMIT fails, try to rollback
      try {
        await db.exec('ROLLBACK')
      } catch {
        // Rollback failed — already in an error state
      }
      const msg =
        err instanceof Error ? err.message : 'Unknown transaction error'
      errors.push(`[${tableName}] Transaction error: ${msg}`)
    }

    counts[tableName] = inserted
  }

  } finally {
    await db.exec('PRAGMA foreign_keys = ON')
  }

  // Signal completion
  onProgress?.({
    phase: 'done',
    current: 0,
    total: 0,
    tableName: 'done',
  })

  return { counts, errors }
}
