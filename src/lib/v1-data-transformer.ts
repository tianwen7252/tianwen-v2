/**
 * V1 data transformer — converts V1 Dexie/IndexedDB JSON backup format
 * to V2 SQLite schema format.
 *
 * Handles table name mapping, camelCase-to-snake_case field conversion,
 * and default timestamps for records that lack them.
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface V1BackupData {
  readonly [tableName: string]: readonly Record<string, unknown>[]
}

export interface TransformResult {
  readonly tables: ReadonlyMap<string, readonly Record<string, unknown>[]>
  readonly warnings: readonly string[]
}

// ── Constants ───────────────────────────────────────────────────────────────

/**
 * Map of V1 table names to V2 table names.
 * Tables not in this map are considered unknown and skipped.
 */
const TABLE_NAME_MAP: Record<string, string> = {
  commondity_types: 'commodity_types',
  commondities: 'commodities',
  orders: 'orders',
  employees: 'employees',
  attendances: 'attendances',
  dailyData: 'daily_data',
} as const

/**
 * All known V1 table names — used to generate warnings for missing tables.
 */
const KNOWN_V1_TABLES = Object.keys(TABLE_NAME_MAP)

/**
 * camelCase field names to snake_case mappings used across V1 tables.
 */
const FIELD_NAME_MAP: Record<string, string> = {
  typeId: 'type_id',
  onMarket: 'on_market',
  hideOnMode: 'hide_on_mode',
  includesSoup: 'includes_soup',
  employeeId: 'employee_id',
  clockIn: 'clock_in',
  clockOut: 'clock_out',
  shiftType: 'shift_type',
  employeeNo: 'employee_no',
  isAdmin: 'is_admin',
  hireDate: 'hire_date',
  resignationDate: 'resignation_date',
  originalTotal: 'original_total',
  editedMemo: 'edited_memo',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
} as const

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Transform field names from V1 camelCase to V2 snake_case.
 * Returns a new record with all field names mapped.
 */
function transformFieldNames(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(record)) {
    const mappedKey = FIELD_NAME_MAP[key] ?? key
    result[mappedKey] = value
  }

  return result
}

/**
 * Add default created_at and updated_at timestamps if not present.
 * Uses current time in milliseconds (matching SQLite unixepoch * 1000 format).
 */
function addDefaultTimestamps(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const now = Date.now()

  return {
    ...record,
    created_at: record.created_at ?? now,
    updated_at: record.updated_at ?? now,
  }
}

// ── Main transformer ────────────────────────────────────────────────────────

/**
 * Transform V1 backup data to V2 schema format.
 *
 * - Maps V1 table names to V2 (e.g., commondity_types -> commodity_types)
 * - Converts camelCase field names to snake_case
 * - Adds missing created_at/updated_at timestamps
 * - Reports warnings for missing or unknown tables
 */
export function transformV1Data(data: V1BackupData): TransformResult {
  const tables = new Map<string, readonly Record<string, unknown>[]>()
  const warnings: string[] = []
  const inputTableNames = new Set(Object.keys(data))

  // Process each input table
  for (const [v1Name, records] of Object.entries(data)) {
    const v2Name = TABLE_NAME_MAP[v1Name]

    if (!v2Name) {
      // Unknown table — skip and warn
      warnings.push(`Skipping unknown V1 table: ${v1Name}`)
      continue
    }

    // Transform each record: field name mapping + default timestamps
    const transformedRecords = records.map(record => {
      const withSnakeCase = transformFieldNames(record)
      return addDefaultTimestamps(withSnakeCase)
    })

    tables.set(v2Name, transformedRecords)
  }

  // Check for missing known tables
  for (const knownTable of KNOWN_V1_TABLES) {
    if (!inputTableNames.has(knownTable)) {
      warnings.push(`Missing V1 table: ${knownTable}`)
    }
  }

  return { tables, warnings }
}
