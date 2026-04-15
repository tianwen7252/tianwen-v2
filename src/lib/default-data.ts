/**
 * Default data module for initializing the database with application default data.
 * Raw data lives in @/constants/default-data for easy editing.
 * This file builds typed domain objects and handles database insertion and cleanup.
 */

import type {
  Employee,
  CommodityType,
  Commodity,
  OrderType,
} from '@/lib/schemas'
import type { Database } from '@/lib/database'
import { getDatabase } from '@/lib/repositories/provider'
import {
  EMPLOYEE_SEEDS,
  COMMODITY_TYPE_SEEDS,
  COMMODITY_SEEDS,
  ORDER_TYPE_SEEDS,
  UPDATE_DEFAULT_DATA_NUMBER,
} from '@/constants/default-data'

// ─── Storage key ────────────────────────────────────────────────────────────

const VERSION_KEY = 'UPDATE_DEFAULT_DATA_NUMBER'

// ─── Timestamp helpers ──────────────────────────────────────────────────────

const BASE_TS = 1700000000000

function daysAgo(days: number): number {
  return Date.now() - 86400000 * days
}

// ─── Build Employees ────────────────────────────────────────────────────────

const EMPLOYEE_TIMESTAMPS: Record<
  string,
  { createdAt: number; updatedAt: number }
> = {
  'emp-001': { createdAt: daysAgo(365), updatedAt: BASE_TS },
  'emp-002': { createdAt: BASE_TS, updatedAt: daysAgo(15) },
  'emp-003': { createdAt: daysAgo(200), updatedAt: daysAgo(5) },
  'emp-004': { createdAt: daysAgo(60), updatedAt: daysAgo(2) },
  'emp-005': { createdAt: daysAgo(50), updatedAt: daysAgo(3) },
  'emp-006': { createdAt: daysAgo(40), updatedAt: daysAgo(2) },
  'emp-007': { createdAt: daysAgo(25), updatedAt: daysAgo(1) },
  'emp-008': { createdAt: daysAgo(15), updatedAt: daysAgo(1) },
}

export const DEFAULT_EMPLOYEES: readonly Employee[] = EMPLOYEE_SEEDS.map(
  seed => {
    const ts = EMPLOYEE_TIMESTAMPS[seed.id] ?? {
      createdAt: BASE_TS,
      updatedAt: BASE_TS,
    }
    return {
      ...seed,
      isDefaultOrderStaff: seed.isDefaultOrderStaff ?? false,
      createdAt: ts.createdAt,
      updatedAt: ts.updatedAt,
    }
  },
) as readonly Employee[]

// ─── Build Commodity Types ──────────────────────────────────────────────────

export const DEFAULT_COMMODITY_TYPES: readonly CommodityType[] =
  COMMODITY_TYPE_SEEDS.map(seed => ({
    ...seed,
    createdAt: BASE_TS,
    updatedAt: BASE_TS,
  })) as readonly CommodityType[]

// ─── Build Commodities ──────────────────────────────────────────────────────

export const DEFAULT_COMMODITIES: readonly Commodity[] = COMMODITY_SEEDS.map(
  seed => ({
    id: seed.id,
    typeId: seed.typeId,
    name: seed.name,
    image: seed.imageKey,
    price: seed.price,
    priority: seed.priority,
    onMarket: true,
    hideOnMode: seed.hideOnMode,
    includesSoup: seed.includesSoup ?? false,
    createdAt: BASE_TS,
    updatedAt: BASE_TS,
  }),
) as readonly Commodity[]

// ─── Build Order Types ─────────────────────────────────────────────────────

export const DEFAULT_ORDER_TYPES: readonly OrderType[] = ORDER_TYPE_SEEDS.map(
  seed => ({
    ...seed,
    createdAt: BASE_TS,
    updatedAt: BASE_TS,
  }),
) as readonly OrderType[]

// ─── LocalStorage version check ──────────────────────────────────────────────

/**
 * Returns true if the stored default-data version in localStorage differs
 * from the current UPDATE_DEFAULT_DATA_NUMBER constant, or if no version
 * has been stored yet.
 *
 * Must be called on the main thread (not inside a Web Worker).
 */
export function shouldResetDefaultData(): boolean {
  const stored = localStorage.getItem(VERSION_KEY)
  return stored !== String(UPDATE_DEFAULT_DATA_NUMBER)
}

/**
 * Writes the current UPDATE_DEFAULT_DATA_NUMBER into localStorage so that
 * subsequent app launches know the default data is already at this version.
 *
 * Must be called on the main thread (not inside a Web Worker).
 */
export function markDefaultDataVersion(): void {
  localStorage.setItem(VERSION_KEY, String(UPDATE_DEFAULT_DATA_NUMBER))
}

// ─── Database operations ─────────────────────────────────────────────────────

/**
 * Deletes only the known default data items from the database using their
 * well-known IDs. User-created data with other IDs is left untouched.
 *
 * FK-safe deletion order:
 *   commodities → commodity_types (if no user commodities reference them)
 *   attendances (for default employees) → employees
 */
export function deleteDefaultData(db: Database): void {
  const employeeIds = EMPLOYEE_SEEDS.map(s => s.id)
  const typeIds = COMMODITY_TYPE_SEEDS.map(s => s.id)
  const typeIdValues = COMMODITY_TYPE_SEEDS.map(s => s.typeId)
  const commodityIds = COMMODITY_SEEDS.map(s => s.id)

  const placeholders = (ids: readonly string[]) => ids.map(() => '?').join(', ')

  // Delete default commodities first (child of commodity_types via type_id FK)
  db.exec(
    `DELETE FROM commodities WHERE id IN (${placeholders(commodityIds)})`,
    commodityIds,
  )

  // Only delete commodity_types if no user-created commodities still reference them.
  // Skipped when users have added custom menu items using the default type IDs.
  const remaining = db.exec<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM commodities WHERE type_id IN (${placeholders(typeIdValues)})`,
    typeIdValues,
  )
  if (Number(remaining.rows[0]?.cnt ?? 0) === 0) {
    db.exec(
      `DELETE FROM commodity_types WHERE id IN (${placeholders(typeIds)})`,
      typeIds,
    )
  }

  // Delete attendances for default employees before deleting the employees
  // (FK: attendances.employee_id → employees.id)
  db.exec(
    `DELETE FROM attendances WHERE employee_id IN (${placeholders(employeeIds)})`,
    employeeIds,
  )

  db.exec(
    `DELETE FROM employees WHERE id IN (${placeholders(employeeIds)})`,
    employeeIds,
  )
}

/**
 * Deletes ALL rows from every table in the database.
 * This is a destructive operation intended for development resets only.
 */
export function clearAllData(db: Database): void {
  db.exec('DELETE FROM attendances')
  db.exec('DELETE FROM order_items')
  db.exec('DELETE FROM order_discounts')
  db.exec('DELETE FROM orders')
  db.exec('DELETE FROM commodities')
  db.exec('DELETE FROM commodity_types')
  db.exec('DELETE FROM order_types')
  db.exec('DELETE FROM daily_data')
  db.exec('DELETE FROM employees')
  db.exec('DELETE FROM price_change_logs')
}

// ─── Database insertion ──────────────────────────────────────────────────────

/** Insert all default employees into the database. Skips existing rows. */
export function insertDefaultEmployees(db: Database): void {
  for (const emp of DEFAULT_EMPLOYEES) {
    db.exec(
      `INSERT OR IGNORE INTO employees (id, name, avatar, status, shift_type, employee_no, is_admin, is_default_order_staff, hire_date, resignation_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        emp.id,
        emp.name,
        emp.avatar ?? null,
        emp.status,
        emp.shiftType,
        emp.employeeNo ?? null,
        emp.isAdmin ? 1 : 0,
        emp.isDefaultOrderStaff ? 1 : 0,
        emp.hireDate ?? null,
        emp.resignationDate ?? null,
        emp.createdAt,
        emp.updatedAt,
      ],
    )
  }
}

/**
 * Async version of insertDefaultEmployees for use from the main thread.
 * Called by the dev test-data page before inserting attendance records,
 * since attendances have an FK to employees.
 */
export async function insertDefaultEmployeesAsync(
  db: import('@/lib/worker-database').AsyncDatabase,
): Promise<void> {
  for (const emp of DEFAULT_EMPLOYEES) {
    await db.exec(
      `INSERT OR IGNORE INTO employees (id, name, avatar, status, shift_type, employee_no, is_admin, is_default_order_staff, hire_date, resignation_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        emp.id,
        emp.name,
        emp.avatar ?? null,
        emp.status,
        emp.shiftType,
        emp.employeeNo ?? null,
        emp.isAdmin ? 1 : 0,
        emp.isDefaultOrderStaff ? 1 : 0,
        emp.hireDate ?? null,
        emp.resignationDate ?? null,
        emp.createdAt,
        emp.updatedAt,
      ],
    )
  }
}

/** Insert all default order types into the database. Skips existing rows. */
export function insertDefaultOrderTypes(db: Database): void {
  for (const ot of DEFAULT_ORDER_TYPES) {
    db.exec(
      `INSERT OR IGNORE INTO order_types (id, name, priority, type, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        ot.id,
        ot.name,
        ot.priority,
        ot.type,
        ot.color ?? null,
        ot.createdAt,
        ot.updatedAt,
      ],
    )
  }
}

/**
 * Reset commodity-related data: deletes all commodities, commodity_types, and order_types,
 * then re-inserts defaults. Does NOT touch employees or attendances.
 */
export function resetCommodityData(db: Database): void {
  db.exec('DELETE FROM commodities')
  db.exec('DELETE FROM commodity_types')
  db.exec('DELETE FROM order_types')
  db.exec('DELETE FROM price_change_logs')
  insertDefaultCommodities(db)
  insertDefaultOrderTypes(db)
}

/**
 * Async version of resetCommodityData for use from the main thread.
 * Deletes all commodities, commodity_types, and order_types via AsyncDatabase,
 * then re-inserts defaults. Does NOT touch employees or attendances.
 */
export async function resetCommodityDataAsync(): Promise<void> {
  const db = getDatabase()

  await db.exec('BEGIN')
  try {
    await db.exec('DELETE FROM commodities')
    await db.exec('DELETE FROM commodity_types')
    await db.exec('DELETE FROM order_types')
    await db.exec('DELETE FROM price_change_logs')

    // Re-insert default commodity types
    for (const ct of DEFAULT_COMMODITY_TYPES) {
      await db.exec(
        `INSERT OR IGNORE INTO commodity_types (id, type_id, type, label, color, priority, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ct.id,
          ct.typeId,
          ct.type,
          ct.label,
          ct.color,
          ct.priority,
          ct.createdAt,
          ct.updatedAt,
        ],
      )
    }

    // Re-insert default commodities
    for (const com of DEFAULT_COMMODITIES) {
      await db.exec(
        `INSERT OR IGNORE INTO commodities (id, type_id, name, image, price, priority, on_market, hide_on_mode, editor, includes_soup, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          com.id,
          com.typeId,
          com.name,
          com.image ?? null,
          com.price,
          com.priority,
          com.onMarket ? 1 : 0,
          com.hideOnMode ?? null,
          com.editor ?? null,
          com.includesSoup ? 1 : 0,
          com.createdAt,
          com.updatedAt,
        ],
      )
    }

    // Re-insert default order types
    for (const ot of DEFAULT_ORDER_TYPES) {
      await db.exec(
        `INSERT OR IGNORE INTO order_types (id, name, priority, type, color, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          ot.id,
          ot.name,
          ot.priority,
          ot.type,
          ot.color ?? null,
          ot.createdAt,
          ot.updatedAt,
        ],
      )
    }

    await db.exec('COMMIT')
  } catch (err) {
    await db.exec('ROLLBACK')
    throw err
  }
}

/** Insert all default commodity types and commodities into the database. Skips existing rows. */
export function insertDefaultCommodities(db: Database): void {
  for (const ct of DEFAULT_COMMODITY_TYPES) {
    db.exec(
      `INSERT OR IGNORE INTO commodity_types (id, type_id, type, label, color, priority, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ct.id,
        ct.typeId,
        ct.type,
        ct.label,
        ct.color,
        ct.priority,
        ct.createdAt,
        ct.updatedAt,
      ],
    )
  }

  for (const com of DEFAULT_COMMODITIES) {
    db.exec(
      `INSERT OR IGNORE INTO commodities (id, type_id, name, image, price, priority, on_market, hide_on_mode, editor, includes_soup, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        com.id,
        com.typeId,
        com.name,
        com.image ?? null,
        com.price,
        com.priority,
        com.onMarket ? 1 : 0,
        com.hideOnMode ?? null,
        com.editor ?? null,
        com.includesSoup ? 1 : 0,
        com.createdAt,
        com.updatedAt,
      ],
    )
  }
}
