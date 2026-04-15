/**
 * StatisticsRepository — aggregation queries for the analytics page.
 * Covers product KPIs, hourly distribution, top/bottom products,
 * daily revenue, average order value, staff KPIs, employee hours, and headcount.
 */

import type { AsyncDatabase } from '@/lib/worker-database'
import { formatTimeBuckets } from '@/lib/analytics/format-time-buckets'

// ─── Shared types ────────────────────────────────────────────────────────────

/** Unix millisecond timestamp range. */
export interface DateRange {
  startDate: number
  endDate: number
}

/** Product KPI summary for a date range. */
export interface ProductKpis {
  totalRevenue: number
  orderCount: number
  morningRevenue: number
  afternoonRevenue: number
  totalQuantity: number
  bentoQuantity: number
}

/** Single hourly order count bucket (0–23). */
export interface HourBucket {
  hour: number
  count: number
}

/** Top/bottom product ranking entry. */
export interface ProductRanking {
  comId: string
  name: string
  quantity: number
  revenue: number
}

/** Revenue or average value per calendar day. */
export interface DailyRevenue {
  date: string
  revenue: number
}

/** Staff KPI summary for a date range. */
export interface StaffKpis {
  activeEmployeeCount: number
  totalAttendanceDays: number
  avgMonthlyHours: number
  leaveCount: number
}

/** Per-employee working hours broken down by attendance type. */
export interface EmployeeHours {
  employeeId: string
  employeeName: string
  regular: number
  paidLeave: number
  sickLeave: number
  personalLeave: number
  absent: number
}

/** AM/PM revenue split for a single calendar day. */
export interface AmPmRevenueRow {
  date: string
  amRevenue: number
  pmRevenue: number
}

/** Number of employees who attended on a given date. */
export interface DailyHeadcount {
  date: string
  count: number
}

/** Order note/tag usage count. */
export interface OrderNoteCount {
  note: string
  count: number
}

/** Delivery order product distribution row. */
export interface DeliveryProductRow {
  commodityId: string
  commodityName: string
  quantity: number
  revenue: number
}

/** Per-product sales breakdown within a commodity category. */
export interface CategorySalesRow {
  date: string
  commodityId: string
  commodityName: string
  quantity: number
  revenue: number
}

// ─── Repository interface ────────────────────────────────────────────────────

export interface StatisticsRepository {
  getProductKpis(range: DateRange): Promise<ProductKpis>
  getHourlyOrderDistribution(range: DateRange): Promise<HourBucket[]>
  getTopProducts(
    range: DateRange,
    limit: number,
    orderBy: 'quantity' | 'revenue',
  ): Promise<ProductRanking[]>
  getBottomBentos(range: DateRange, limit: number): Promise<ProductRanking[]>
  getDailyRevenue(range: DateRange): Promise<DailyRevenue[]>
  getAvgOrderValue(range: DateRange): Promise<DailyRevenue[]>
  /** Returns daily sales quantity for a specific commodity as DailyRevenue (revenue = quantity). */
  getProductDailyRevenue(
    range: DateRange,
    commodityId: string,
  ): Promise<DailyRevenue[]>
  getStaffKpis(range: DateRange): Promise<StaffKpis>
  getEmployeeHours(range: DateRange): Promise<EmployeeHours[]>
  getDailyHeadcount(range: DateRange): Promise<DailyHeadcount[]>
  getDailyAttendeeList(date: string): Promise<string[]>
  getAmPmRevenue(range: DateRange): Promise<AmPmRevenueRow[]>
  /** Returns per-product sales breakdown for a commodity category. */
  getCategorySales(
    range: DateRange,
    typeId: string,
  ): Promise<CategorySalesRow[]>
  /** Returns order note tag usage frequency distribution. */
  getOrderNotesDistribution(range: DateRange): Promise<OrderNoteCount[]>
  /** Returns delivery order product distribution filtered by memo tag. */
  getDeliveryProductBreakdown(
    range: DateRange,
    memoTag?: string,
  ): Promise<DeliveryProductRow[]>
}

// ─── Row mappers ─────────────────────────────────────────────────────────────

function toProductKpis(row: Record<string, unknown>): ProductKpis {
  return {
    totalRevenue: Number(row['total_revenue'] ?? 0),
    orderCount: Number(row['order_count'] ?? 0),
    morningRevenue: Number(row['morning_revenue'] ?? 0),
    afternoonRevenue: Number(row['afternoon_revenue'] ?? 0),
    totalQuantity: Number(row['total_quantity'] ?? 0),
    bentoQuantity: Number(row['bento_quantity'] ?? 0),
  }
}

const ZERO_PRODUCT_KPIS: ProductKpis = {
  totalRevenue: 0,
  orderCount: 0,
  morningRevenue: 0,
  afternoonRevenue: 0,
  totalQuantity: 0,
  bentoQuantity: 0,
}

function toProductRanking(row: Record<string, unknown>): ProductRanking {
  return {
    comId: String(row['commodity_id']),
    name: String(row['name']),
    quantity: Number(row['quantity'] ?? 0),
    revenue: Number(row['revenue'] ?? 0),
  }
}

function toDailyRevenue(row: Record<string, unknown>): DailyRevenue {
  return {
    date: String(row['date']),
    revenue: Number(row['revenue'] ?? 0),
  }
}

function toEmployeeHours(row: Record<string, unknown>): EmployeeHours {
  return {
    employeeId: String(row['employee_id']),
    employeeName: String(row['employee_name']),
    regular: Number(row['regular'] ?? 0),
    paidLeave: Number(row['paid_leave'] ?? 0),
    sickLeave: Number(row['sick_leave'] ?? 0),
    personalLeave: Number(row['personal_leave'] ?? 0),
    absent: Number(row['absent'] ?? 0),
  }
}

function toAmPmRevenueRow(row: Record<string, unknown>): AmPmRevenueRow {
  return {
    date: String(row['date']),
    amRevenue: Number(row['am_revenue'] ?? 0),
    pmRevenue: Number(row['pm_revenue'] ?? 0),
  }
}

function toDailyHeadcount(row: Record<string, unknown>): DailyHeadcount {
  return {
    date: String(row['date']),
    count: Number(row['count'] ?? 0),
  }
}

function toOrderNoteCount(row: Record<string, unknown>): OrderNoteCount {
  return {
    note: String(row['note']),
    count: Number(row['count'] ?? 0),
  }
}

function toDeliveryProductRow(
  row: Record<string, unknown>,
): DeliveryProductRow {
  return {
    commodityId: String(row['commodity_id']),
    commodityName: String(row['commodity_name']),
    quantity: Number(row['quantity'] ?? 0),
    revenue: Number(row['revenue'] ?? 0),
  }
}

function toCategorySalesRow(row: Record<string, unknown>): CategorySalesRow {
  return {
    date: String(row['date']),
    commodityId: String(row['commodity_id']),
    commodityName: String(row['commodity_name']),
    quantity: Number(row['quantity'] ?? 0),
    revenue: Number(row['revenue'] ?? 0),
  }
}

// ─── Hour strftime helper ─────────────────────────────────────────────────────

/** Allowlist of column references permitted in LOCAL_HOUR to prevent injection. */
type TimeColumn = 'o.created_at' | 'created_at'

/** SQLite expression to extract local hour (0-23) from a Unix ms timestamp column. */
const LOCAL_HOUR = (col: TimeColumn) =>
  `CAST(strftime('%H', datetime(${col}/1000,'unixepoch','localtime')) AS INTEGER)`

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createStatisticsRepository(
  db: AsyncDatabase,
): StatisticsRepository {
  return {
    // ── Product KPIs ──────────────────────────────────────────────────────────
    async getProductKpis(range) {
      const hourExpr = LOCAL_HOUR('o.created_at')
      const result = await db.exec<Record<string, unknown>>(
        `SELECT
           COALESCE(SUM(o.total), 0)                                         AS total_revenue,
           COUNT(DISTINCT o.id)                                                AS order_count,
           COALESCE(SUM(CASE WHEN ${hourExpr} < 12 THEN o.total ELSE 0 END), 0)  AS morning_revenue,
           COALESCE(SUM(CASE WHEN ${hourExpr} >= 12 THEN o.total ELSE 0 END), 0) AS afternoon_revenue,
           COALESCE(SUM(oi.quantity), 0)                                      AS total_quantity,
           COALESCE(SUM(CASE WHEN oi.includes_soup = 1 THEN oi.quantity ELSE 0 END), 0) AS bento_quantity
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id
         WHERE o.created_at >= ? AND o.created_at <= ?`,
        [range.startDate, range.endDate],
      )
      const row = result.rows[0]
      return row ? toProductKpis(row) : { ...ZERO_PRODUCT_KPIS }
    },

    // ── Hourly distribution ───────────────────────────────────────────────────
    async getHourlyOrderDistribution(range) {
      const hourExpr = LOCAL_HOUR('created_at')
      const result = await db.exec<Record<string, unknown>>(
        `SELECT ${hourExpr} AS hour, COUNT(*) AS count
         FROM orders
         WHERE created_at >= ? AND created_at <= ?
         GROUP BY ${hourExpr}
         ORDER BY hour`,
        [range.startDate, range.endDate],
      )
      const buckets = result.rows.map(r => ({
        hour: Number(r['hour']),
        count: Number(r['count']),
      }))
      return formatTimeBuckets(buckets)
    },

    // ── Top products ──────────────────────────────────────────────────────────
    async getTopProducts(range, limit, orderBy) {
      const orderCol = orderBy === 'revenue' ? 'revenue' : 'quantity'
      const result = await db.exec<Record<string, unknown>>(
        `SELECT oi.commodity_id, c.name,
                SUM(oi.quantity) AS quantity,
                SUM(oi.quantity * oi.price) AS revenue
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         LEFT JOIN commodities c ON c.id = oi.commodity_id
         WHERE o.created_at >= ? AND o.created_at <= ?
         GROUP BY oi.commodity_id
         ORDER BY ${orderCol} DESC
         LIMIT ?`,
        [range.startDate, range.endDate, limit],
      )
      return result.rows.map(toProductRanking)
    },

    // ── Bottom bentos ─────────────────────────────────────────────────────────
    async getBottomBentos(range, limit) {
      const result = await db.exec<Record<string, unknown>>(
        `SELECT oi.commodity_id, c.name,
                SUM(oi.quantity) AS quantity,
                SUM(oi.quantity * oi.price) AS revenue
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         LEFT JOIN commodities c ON c.id = oi.commodity_id
         WHERE o.created_at >= ? AND o.created_at <= ?
           AND oi.includes_soup = 1
         GROUP BY oi.commodity_id
         ORDER BY quantity ASC
         LIMIT ?`,
        [range.startDate, range.endDate, limit],
      )
      return result.rows.map(toProductRanking)
    },

    // ── Daily revenue ─────────────────────────────────────────────────────────
    async getDailyRevenue(range) {
      const result = await db.exec<Record<string, unknown>>(
        `SELECT date(created_at/1000,'unixepoch','localtime') AS date,
                SUM(total) AS revenue
         FROM orders
         WHERE created_at >= ? AND created_at <= ?
         GROUP BY date(created_at/1000,'unixepoch','localtime')
         ORDER BY date`,
        [range.startDate, range.endDate],
      )
      return result.rows.map(toDailyRevenue)
    },

    // ── Average order value per day ───────────────────────────────────────────
    async getAvgOrderValue(range) {
      const result = await db.exec<Record<string, unknown>>(
        `SELECT date(created_at/1000,'unixepoch','localtime') AS date,
                AVG(total) AS revenue
         FROM orders
         WHERE created_at >= ? AND created_at <= ?
         GROUP BY date(created_at/1000,'unixepoch','localtime')
         ORDER BY date`,
        [range.startDate, range.endDate],
      )
      return result.rows.map(toDailyRevenue)
    },

    // ── Product daily revenue (quantity per day for a specific commodity) ────
    async getProductDailyRevenue(range, commodityId) {
      const result = await db.exec<Record<string, unknown>>(
        `SELECT date(o.created_at/1000,'unixepoch','localtime') AS date,
                SUM(oi.quantity) AS revenue
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE o.created_at >= ? AND o.created_at <= ?
           AND oi.commodity_id = ?
         GROUP BY date(o.created_at/1000,'unixepoch','localtime')
         ORDER BY date`,
        [range.startDate, range.endDate, commodityId],
      )
      return result.rows.map(toDailyRevenue)
    },

    // ── Staff KPIs ────────────────────────────────────────────────────────────
    async getStaffKpis(range) {
      const [empResult, daysResult, hoursResult, leaveResult] =
        await Promise.all([
          db.exec<Record<string, unknown>>(
            `SELECT COUNT(*) AS count FROM employees WHERE status = 'active'`,
          ),
          db.exec<Record<string, unknown>>(
            `SELECT COUNT(*) AS count FROM attendances
           WHERE clock_in >= ? AND clock_in <= ? AND type = 'regular'`,
            [range.startDate, range.endDate],
          ),
          db.exec<Record<string, unknown>>(
            `SELECT AVG((clock_out - clock_in) / 3600000.0) AS avg_hours
           FROM attendances
           WHERE clock_in >= ? AND clock_in <= ?
             AND clock_out IS NOT NULL AND type = 'regular'`,
            [range.startDate, range.endDate],
          ),
          db.exec<Record<string, unknown>>(
            `SELECT COUNT(*) AS count FROM attendances
           WHERE clock_in >= ? AND clock_in <= ?
             AND type IN ('paid_leave','sick_leave','personal_leave')`,
            [range.startDate, range.endDate],
          ),
        ])

      const empRow = empResult.rows[0]
      const daysRow = daysResult.rows[0]
      const hoursRow = hoursResult.rows[0]
      const leaveRow = leaveResult.rows[0]

      return {
        activeEmployeeCount: Number(empRow?.['count'] ?? 0),
        totalAttendanceDays: Number(daysRow?.['count'] ?? 0),
        avgMonthlyHours: Number(hoursRow?.['avg_hours'] ?? 0),
        leaveCount: Number(leaveRow?.['count'] ?? 0),
      }
    },

    // ── Employee hours ────────────────────────────────────────────────────────
    async getEmployeeHours(range) {
      const result = await db.exec<Record<string, unknown>>(
        `SELECT
           a.employee_id,
           e.name AS employee_name,
           COALESCE(SUM(CASE WHEN a.type = 'regular'
             THEN (a.clock_out - a.clock_in) / 3600000.0 ELSE 0 END), 0) AS regular,
           COALESCE(SUM(CASE WHEN a.type = 'paid_leave'
             THEN (a.clock_out - a.clock_in) / 3600000.0 ELSE 0 END), 0) AS paid_leave,
           COALESCE(SUM(CASE WHEN a.type = 'sick_leave'
             THEN (a.clock_out - a.clock_in) / 3600000.0 ELSE 0 END), 0) AS sick_leave,
           COALESCE(SUM(CASE WHEN a.type = 'personal_leave'
             THEN (a.clock_out - a.clock_in) / 3600000.0 ELSE 0 END), 0) AS personal_leave,
           COALESCE(SUM(CASE WHEN a.type = 'absent'
             THEN (a.clock_out - a.clock_in) / 3600000.0 ELSE 0 END), 0) AS absent
         FROM attendances a
         LEFT JOIN employees e ON e.id = a.employee_id
         WHERE a.clock_in >= ? AND a.clock_in <= ?
           AND a.clock_out IS NOT NULL
         GROUP BY a.employee_id
         ORDER BY e.name`,
        [range.startDate, range.endDate],
      )
      return result.rows.map(toEmployeeHours)
    },

    // ── Daily headcount ───────────────────────────────────────────────────────
    async getDailyHeadcount(range) {
      const result = await db.exec<Record<string, unknown>>(
        `SELECT date AS date, COUNT(DISTINCT employee_id) AS count
         FROM attendances
         WHERE clock_in >= ? AND clock_in <= ?
           AND type = 'regular'
         GROUP BY date
         ORDER BY date`,
        [range.startDate, range.endDate],
      )
      return result.rows.map(toDailyHeadcount)
    },

    // ── Daily attendee list ───────────────────────────────────────────────────
    async getDailyAttendeeList(date) {
      const result = await db.exec<Record<string, unknown>>(
        `SELECT e.name
         FROM attendances a
         LEFT JOIN employees e ON e.id = a.employee_id
         WHERE a.date = ?
           AND a.type = 'regular'
         ORDER BY e.name`,
        [date],
      )
      return result.rows.map(r => String(r['name']))
    },

    // ── AM/PM revenue split ─────────────────────────────────────────────────
    async getAmPmRevenue(range) {
      const hourExpr = LOCAL_HOUR('o.created_at')
      const result = await db.exec<Record<string, unknown>>(
        `SELECT date(o.created_at/1000,'unixepoch','localtime') AS date,
                COALESCE(SUM(CASE WHEN ${hourExpr} < 12 THEN o.total ELSE 0 END), 0) AS am_revenue,
                COALESCE(SUM(CASE WHEN ${hourExpr} >= 12 THEN o.total ELSE 0 END), 0) AS pm_revenue
         FROM orders o
         WHERE o.created_at >= ? AND o.created_at <= ?
         GROUP BY date(o.created_at/1000,'unixepoch','localtime')
         ORDER BY date`,
        [range.startDate, range.endDate],
      )
      return result.rows.map(toAmPmRevenueRow)
    },

    // ── Category sales breakdown ──────────────────────────────────────────────
    async getCategorySales(range, typeId) {
      const result = await db.exec<Record<string, unknown>>(
        `SELECT date(o.created_at/1000,'unixepoch','localtime') AS date,
                oi.commodity_id,
                c.name AS commodity_name,
                SUM(oi.quantity) AS quantity,
                SUM(oi.quantity * oi.price) AS revenue
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         LEFT JOIN commodities c ON c.id = oi.commodity_id
         WHERE o.created_at >= ? AND o.created_at <= ?
           AND c.type_id = ?
         GROUP BY date, oi.commodity_id
         ORDER BY date, revenue DESC`,
        [range.startDate, range.endDate, typeId],
      )
      return result.rows.map(toCategorySalesRow)
    },

    // ── Order notes distribution ──────────────────────────────────────────────
    async getOrderNotesDistribution(range) {
      const result = await db.exec<Record<string, unknown>>(
        `SELECT j.value AS note, COUNT(*) AS count
         FROM orders o, json_each(o.memo) j
         WHERE o.created_at >= ? AND o.created_at <= ?
           AND o.memo IS NOT NULL AND o.memo != '[]'
         GROUP BY j.value
         ORDER BY count DESC`,
        [range.startDate, range.endDate],
      )
      return result.rows.map(toOrderNoteCount)
    },

    // ── Delivery product breakdown ────────────────────────────────────────────
    async getDeliveryProductBreakdown(range, memoTag) {
      const tag = memoTag ?? '外送'
      const result = await db.exec<Record<string, unknown>>(
        `SELECT oi.commodity_id, c.name AS commodity_name,
                SUM(oi.quantity) AS quantity,
                SUM(oi.quantity * oi.price) AS revenue
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         LEFT JOIN commodities c ON c.id = oi.commodity_id
         WHERE o.created_at >= ? AND o.created_at <= ?
           AND EXISTS (SELECT 1 FROM json_each(o.memo) j WHERE j.value = ?)
         GROUP BY oi.commodity_id
         ORDER BY quantity DESC`,
        [range.startDate, range.endDate, tag],
      )
      return result.rows.map(toDeliveryProductRow)
    },
  }
}
