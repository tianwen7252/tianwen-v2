/**
 * V1 data transformer — converts V1 Dexie/IndexedDB JSON backup format
 * to V2 SQLite schema format.
 *
 * Handles table name mapping, camelCase-to-snake_case field conversion,
 * type coercion for V1/V2 differences, and order data parsing.
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface V1BackupData {
  readonly [tableName: string]: readonly Record<string, unknown>[]
}

/** A single parsed order item from V1's calculator-style data array */
export interface V1OrderItem {
  readonly commodityId: string
  readonly name: string
  readonly price: number
  readonly quantity: number
  readonly includesSoup: boolean
}

/** A single parsed discount from V1's calculator-style data array */
export interface V1OrderDiscount {
  readonly label: string
  readonly amount: number
}

/** Result of parsing a V1 order's data array */
export interface V1ParsedOrderData {
  readonly items: readonly V1OrderItem[]
  readonly discounts: readonly V1OrderDiscount[]
}

export interface TransformResult {
  readonly tables: ReadonlyMap<string, readonly Record<string, unknown>[]>
  readonly orderItems: readonly Record<string, unknown>[]
  readonly orderDiscounts: readonly Record<string, unknown>[]
  /** Auto-generated hidden commodities for order items with no matching product */
  readonly retiredCommodities: readonly Record<string, unknown>[]
  readonly warnings: readonly string[]
}

// ── Constants ───────────────────────────────────────────────────────────────

/**
 * Map of V1 table names to V2 table names.
 * V1 uses Dexie names like "commondity", "commondityType", "orderTypes".
 * Tables not in this map are considered unknown and skipped.
 */
const TABLE_NAME_MAP: Record<string, string> = {
  commondityType: 'commodity_types',
  commondity: 'commodities',
  orderTypes: 'order_types',
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
 * Includes V1's uppercase-D "typeID" variant.
 */
const FIELD_NAME_MAP: Record<string, string> = {
  typeID: 'type_id',
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
 * Transform field names from V1 camelCase to V2 snake_case,
 * and apply type coercion for V1/V2 differences.
 * Returns a new record with all field names mapped and values coerced.
 */
function transformFieldNames(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(record)) {
    const mappedKey = FIELD_NAME_MAP[key] ?? key
    result[mappedKey] = value
  }

  // Type coercion: V1 IDs are numbers, V2 uses text
  if (result.id != null) {
    result.id = String(result.id)
  }

  // Type coercion: V1 type_id may be numeric
  if (result.type_id != null) {
    result.type_id = String(result.type_id)
  }

  // Type coercion: V1 onMarket is string "1"/"0", V2 uses integer 1/0
  if (result.on_market != null) {
    result.on_market = Number(result.on_market) || 0
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
    updated_at: record.updated_at ?? record.created_at ?? now,
  }
}

// ── Order data parser ──────────────────────────────────────────────────────

/**
 * Determine if a V1 data entry is an operator (+ or *).
 */
function isOperator(
  entry: Record<string, unknown>,
): entry is Record<string, unknown> & { operator: string } {
  return typeof entry.operator === 'string' && entry.operator !== ''
}

/**
 * Determine if a V1 data entry is a food/product item (has res field).
 */
function isItem(entry: Record<string, unknown>): boolean {
  return typeof entry.res === 'string' && entry.res !== ''
}

/**
 * Parse V1's calculator-style order data array into structured items and discounts.
 *
 * V1 data format:
 * - Item: {value: "110", res: "蒜泥白肉飯", type: "main-dish"}
 * - Operator: {value: "", operator: "+"}
 * - Multiplier: {value: "2", operator: "*"}
 * - Item with amount hint: {value: "120", res: "炸雞腿飯", type: "main-dish", amount: "2"}
 *
 * Items with negative value or containing "折" in name are treated as discounts.
 */
export function parseV1OrderData(
  data: unknown[],
  orderId: string,
): V1ParsedOrderData {
  if (!Array.isArray(data) || data.length === 0) {
    return { items: [], discounts: [] }
  }

  const items: V1OrderItem[] = []
  const discounts: V1OrderDiscount[] = []

  // First pass: collect raw items and apply multipliers
  const rawItems: Array<{
    name: string
    price: number
    type: string
    quantity: number
  }> = []

  for (let i = 0; i < data.length; i++) {
    const entry = data[i] as Record<string, unknown>
    if (!entry || typeof entry !== 'object') continue

    if (isItem(entry)) {
      const name = String(entry.res)
      const price = Number(entry.value) || 0
      const type = typeof entry.type === 'string' ? entry.type : ''
      // Check if amount hint is provided directly on the item
      const amountHint =
        entry.amount != null ? Number(entry.amount) || 1 : 1
      rawItems.push({ name, price, type, quantity: amountHint })
    } else if (isOperator(entry) && entry.operator === '*') {
      // Multiplier applies to the previous item
      const multiplier = Number(entry.value) || 1
      if (rawItems.length > 0) {
        const lastItem = rawItems[rawItems.length - 1]!
        rawItems[rawItems.length - 1] = {
          ...lastItem,
          quantity: multiplier,
        }
      }
    }
    // "+" operators are just separators — skip them
  }

  // Second pass: categorize into items vs discounts
  for (const raw of rawItems) {
    const isDiscount = raw.price < 0 || raw.name.includes('折')

    if (isDiscount) {
      discounts.push({
        label: raw.name,
        amount: Math.abs(raw.price) * raw.quantity,
      })
    } else {
      items.push({
        commodityId: `v1-import-${orderId}`,
        name: raw.name,
        price: raw.price,
        quantity: raw.quantity,
        includesSoup: raw.type === 'main-dish',
      })
    }
  }

  return { items, discounts }
}

// ── Main transformer ────────────────────────────────────────────────────────

/**
 * Transform V1 backup data to V2 schema format.
 *
 * - Maps V1 table names to V2 (e.g., commondityType -> commodity_types)
 * - Converts camelCase field names to snake_case
 * - Applies type coercion (numeric IDs to strings, onMarket to number)
 * - Adds missing created_at/updated_at timestamps
 * - Parses V1 order data arrays into order_items and order_discounts
 * - Reports warnings for missing or unknown tables
 */
export function transformV1Data(data: V1BackupData): TransformResult {
  const tables = new Map<string, readonly Record<string, unknown>[]>()
  const warnings: string[] = []
  const inputTableNames = new Set(Object.keys(data))
  const allOrderItems: Record<string, unknown>[] = []
  const allOrderDiscounts: Record<string, unknown>[] = []
  // Track retired commodities: items referenced in orders but not in commodity list
  const retiredMap = new Map<string, Record<string, unknown>>()

  // Process each input table
  for (const [v1Name, records] of Object.entries(data)) {
    const v2Name = TABLE_NAME_MAP[v1Name]

    if (!v2Name) {
      // Unknown table — skip and warn
      warnings.push(`Skipping unknown V1 table: ${v1Name}`)
      continue
    }

    // Transform each record: field name mapping + type coercion + default timestamps
    const transformedRecords = records.map(record => {
      const withSnakeCase = transformFieldNames(record)
      return addDefaultTimestamps(withSnakeCase)
    })

    // For orders, extract order_items and order_discounts from V1 data arrays
    if (v2Name === 'orders') {
      // Build a name→id lookup from V1 commodities for matching order items
      const commodityNameMap = new Map<string, string>()
      const v1Commodities = tables.get('commodities') ?? []
      for (const c of v1Commodities) {
        if (c.name && c.id) {
          commodityNameMap.set(String(c.name), String(c.id))
        }
      }

      for (const record of transformedRecords) {
        const orderId = String(record.id ?? '')
        const rawData = record.data

        if (Array.isArray(rawData)) {
          const parsed = parseV1OrderData(rawData, orderId)
          const createdAt = record.created_at ?? Date.now()
          const updatedAt = record.updated_at ?? createdAt

          // Build order_items records — match commodity_id by name,
          // auto-create retired commodity for unmatched items
          for (let i = 0; i < parsed.items.length; i++) {
            const item = parsed.items[i]!
            let matchedId = commodityNameMap.get(item.name)

            if (!matchedId) {
              // Create a stable retired commodity ID from the item name
              const retiredId = `v1-retired-${item.name}`
              matchedId = retiredId

              // Only create one retired commodity per unique name
              if (!retiredMap.has(retiredId)) {
                retiredMap.set(retiredId, {
                  id: retiredId,
                  type_id: 'retired',
                  name: item.name,
                  image: null,
                  price: item.price,
                  priority: 0,
                  on_market: 0,
                  hide_on_mode: null,
                  editor: null,
                  includes_soup: item.includesSoup ? 1 : 0,
                  created_at: createdAt,
                  updated_at: updatedAt,
                })
              }
            }

            allOrderItems.push({
              id: `v1-oi-${orderId}-${i}`,
              order_id: orderId,
              commodity_id: matchedId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              includes_soup: item.includesSoup ? 1 : 0,
              created_at: createdAt,
              updated_at: updatedAt,
            })
          }

          // Build order_discounts records
          for (let i = 0; i < parsed.discounts.length; i++) {
            const discount = parsed.discounts[i]!
            allOrderDiscounts.push({
              id: `v1-od-${orderId}-${i}`,
              order_id: orderId,
              label: discount.label,
              amount: discount.amount,
              created_at: createdAt,
              updated_at: updatedAt,
            })
          }
        }
      }

      // Remove 'data' field from order records (not part of V2 schema)
      const ordersWithoutData = transformedRecords.map(record => {
        const { data: _data, ...rest } = record
        return rest
      })
      tables.set(v2Name, ordersWithoutData)
    } else {
      tables.set(v2Name, transformedRecords)
    }
  }

  // Check for missing known tables
  for (const knownTable of KNOWN_V1_TABLES) {
    if (!inputTableNames.has(knownTable)) {
      warnings.push(`Missing V1 table: ${knownTable}`)
    }
  }

  return {
    tables,
    orderItems: allOrderItems,
    orderDiscounts: allOrderDiscounts,
    retiredCommodities: [...retiredMap.values()],
    warnings,
  }
}
