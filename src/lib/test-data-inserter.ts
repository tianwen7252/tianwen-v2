/**
 * Test data inserter — orchestrates data generation and database insertion
 * with progress reporting. Uses raw SQL for batch inserts.
 */

import type { AsyncDatabase } from '@/lib/worker-database'
import {
  generateDayData,
  getDateRange,
  getCommoditiesForGeneration,
  getActiveEmployeeIds,
  getOrderCountForDay,
  createSeededRandom,
} from '@/lib/test-data-generator'
import { insertDefaultEmployeesAsync } from '@/lib/default-data'

// ─── Types ─────────────────────────────────────────────────────────────────

export interface InsertTestDataOptions {
  months: number
  ordersPerDay?: number
  seed?: number
  onProgress?: (progress: InsertProgress) => void
}

export interface InsertProgress {
  currentDay: number
  totalDays: number
  ordersInserted: number
  attendancesInserted: number
  phase: 'generating' | 'inserting'
}

export interface InsertTestDataResult {
  totalOrders: number
  totalOrderItems: number
  totalOrderDiscounts: number
  totalAttendances: number
  totalDailyData: number
  totalDays: number
}

// ─── SQL Templates ─────────────────────────────────────────────────────────

const SQL_INSERT_ORDER = `INSERT INTO orders (id, number, memo, soups, total, original_total, edited_memo, editor, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

const SQL_INSERT_ORDER_ITEM = `INSERT INTO order_items (id, order_id, commodity_id, name, price, quantity, includes_soup, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`

const SQL_INSERT_ORDER_DISCOUNT = `INSERT INTO order_discounts (id, order_id, label, amount, created_at) VALUES (?, ?, ?, ?, ?)`

const SQL_INSERT_ATTENDANCE = `INSERT INTO attendances (id, employee_id, date, clock_in, clock_out, type) VALUES (?, ?, ?, ?, ?, ?)`

const SQL_INSERT_DAILY_DATA = `INSERT INTO daily_data (id, date, total, original_total, created_at, updated_at, editor) VALUES (?, ?, ?, ?, ?, ?, ?)`

// ─── Transaction batch size ────────────────────────────────────────────────

// Commit every 7 days to balance memory pressure against rollback granularity.
// Larger batches reduce SQLite WAL overhead; smaller batches limit re-work on error.
const TRANSACTION_BATCH_SIZE = 7

// ─── Main function ─────────────────────────────────────────────────────────

/**
 * Generate and insert test data into the database.
 * Wraps every 7 days of inserts in a transaction for performance.
 */
export async function insertTestData(
  db: AsyncDatabase,
  options: InsertTestDataOptions,
): Promise<InsertTestDataResult> {
  const { months, ordersPerDay, seed, onProgress } = options

  // Seed default employees first — attendance records below have an FK to
  // employees, and default employees are no longer inserted at DB init.
  // INSERT OR IGNORE means this is a no-op if employees already exist.
  await insertDefaultEmployeesAsync(db)

  const dates = getDateRange(months)
  const commodities = getCommoditiesForGeneration()
  const activeEmployeeIds = getActiveEmployeeIds()
  const random = createSeededRandom(seed ?? Date.now())

  const totalDays = dates.length

  let totalOrders = 0
  let totalOrderItems = 0
  let totalOrderDiscounts = 0
  let totalAttendances = 0
  let totalDailyData = 0

  let transactionOpen = false

  for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
    const date = dates[dayIndex]!
    const currentDay = dayIndex + 1

    try {
      // Start a new transaction every TRANSACTION_BATCH_SIZE days
      if (dayIndex % TRANSACTION_BATCH_SIZE === 0) {
        await db.exec('BEGIN')
        transactionOpen = true
      }
      // Determine order count for this day
      const orderCount =
        ordersPerDay !== undefined ? ordersPerDay : getOrderCountForDay(random)

      // Generate all data for this day
      const dayData = generateDayData(
        date,
        commodities,
        activeEmployeeIds,
        orderCount,
        random,
      )

      // Report generating phase
      onProgress?.({
        currentDay,
        totalDays,
        ordersInserted: totalOrders,
        attendancesInserted: totalAttendances,
        phase: 'generating',
      })

      // Insert orders
      for (const order of dayData.orders) {
        await db.exec(SQL_INSERT_ORDER, [
          order.id,
          order.number,
          JSON.stringify(order.memo),
          order.soups,
          order.total,
          order.originalTotal ?? null,
          null, // editedMemo — generated orders never have edited memos
          order.editor,
          order.createdAt,
          order.updatedAt,
        ])
      }

      // Insert order items
      for (const item of dayData.orderItems) {
        await db.exec(SQL_INSERT_ORDER_ITEM, [
          item.id,
          item.orderId,
          item.commodityId,
          item.name,
          item.price,
          item.quantity,
          item.includesSoup ? 1 : 0,
          item.createdAt,
        ])
      }

      // Insert order discounts
      for (const discount of dayData.orderDiscounts) {
        await db.exec(SQL_INSERT_ORDER_DISCOUNT, [
          discount.id,
          discount.orderId,
          discount.label,
          discount.amount,
          discount.createdAt,
        ])
      }

      // Insert attendances
      for (const attendance of dayData.attendances) {
        await db.exec(SQL_INSERT_ATTENDANCE, [
          attendance.id,
          attendance.employeeId,
          attendance.date,
          attendance.clockIn ?? null,
          attendance.clockOut ?? null,
          attendance.type,
        ])
      }

      // Insert daily data
      await db.exec(SQL_INSERT_DAILY_DATA, [
        dayData.dailyData.id,
        dayData.dailyData.date,
        dayData.dailyData.total,
        dayData.dailyData.originalTotal,
        dayData.dailyData.createdAt,
        dayData.dailyData.updatedAt,
        dayData.dailyData.editor,
      ])

      // Update totals
      totalOrders += dayData.orders.length
      totalOrderItems += dayData.orderItems.length
      totalOrderDiscounts += dayData.orderDiscounts.length
      totalAttendances += dayData.attendances.length
      totalDailyData += 1

      // Report inserting phase
      onProgress?.({
        currentDay,
        totalDays,
        ordersInserted: totalOrders,
        attendancesInserted: totalAttendances,
        phase: 'inserting',
      })

      // Commit transaction at batch boundary or last day
      if (
        (dayIndex + 1) % TRANSACTION_BATCH_SIZE === 0 ||
        dayIndex === totalDays - 1
      ) {
        await db.exec('COMMIT')
        transactionOpen = false
      }

      // Yield to event loop
      await new Promise<void>(resolve => setTimeout(resolve, 0))
    } catch (error: unknown) {
      if (transactionOpen) {
        try {
          await db.exec('ROLLBACK')
        } catch {
          // ROLLBACK failed; original error is still re-thrown below
        }
        transactionOpen = false
      }
      throw error
    }
  }

  return {
    totalOrders,
    totalOrderItems,
    totalOrderDiscounts,
    totalAttendances,
    totalDailyData,
    totalDays,
  }
}

// ─── Clear test data ──────────────────────────────────────────────────────

/**
 * Delete ALL user data from the database: orders, items, discounts,
 * attendances, daily summaries, employees, and price change logs.
 * FK-safe deletion order: children first, then parents.
 */
export async function clearTestData(db: AsyncDatabase): Promise<void> {
  await db.exec('BEGIN')
  try {
    await db.exec('DELETE FROM order_items')
    await db.exec('DELETE FROM order_discounts')
    await db.exec('DELETE FROM orders')
    await db.exec('DELETE FROM daily_data')
    await db.exec('DELETE FROM attendances')
    await db.exec('DELETE FROM employees')
    await db.exec('DELETE FROM price_change_logs')
    await db.exec('DELETE FROM error_logs')
    await db.exec('DELETE FROM backup_logs')
    await db.exec('DELETE FROM custom_order_names')
    await db.exec('COMMIT')
  } catch (error: unknown) {
    try {
      await db.exec('ROLLBACK')
    } catch {
      // ROLLBACK failed; original error is still re-thrown below
    }
    throw error
  }
}
