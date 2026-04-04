/**
 * Seed data module for initializing the database with sample data.
 * Raw data lives in seed-data-consts.ts for easy editing.
 * This file builds typed domain objects and handles database seeding.
 */

import dayjs from 'dayjs'
import type {
  Employee,
  Attendance,
  CommodityType,
  Commodity,
} from '@/lib/schemas'
import type { Database } from '@/lib/database'
import {
  EMPLOYEE_SEEDS,
  ATTENDANCE_SEEDS,
  COMMODITY_TYPE_SEEDS,
  COMMODITY_SEEDS,
} from '@/constants/seed-data'

// ─── Timestamp helpers ──────────────────────────────────────────────────────

const BASE_TS = 1700000000000

/** Generate a createdAt timestamp based on days ago from now */
function daysAgo(days: number): number {
  return Date.now() - 86400000 * days
}

// ─── Build Employees ────────────────────────────────────────────────────────

const EMPLOYEE_TIMESTAMPS: Record<
  string,
  { createdAt: number; updatedAt: number }
> = {
  'emp-001': { createdAt: daysAgo(365), updatedAt: BASE_TS },
  'emp-002': { createdAt: BASE_TS * 10, updatedAt: daysAgo(15) },
  'emp-003': { createdAt: daysAgo(200), updatedAt: daysAgo(5) },
  'emp-004': { createdAt: daysAgo(60), updatedAt: daysAgo(2) },
  'emp-005': { createdAt: daysAgo(500), updatedAt: daysAgo(80) },
  'emp-006': { createdAt: BASE_TS, updatedAt: daysAgo(1) },
  'emp-007': { createdAt: daysAgo(50), updatedAt: daysAgo(3) },
  'emp-008': { createdAt: daysAgo(40), updatedAt: daysAgo(2) },
  'emp-009': { createdAt: daysAgo(25), updatedAt: daysAgo(1) },
  'emp-010': { createdAt: daysAgo(15), updatedAt: daysAgo(1) },
  'emp-011': { createdAt: daysAgo(10), updatedAt: daysAgo(1) },
}

export const SEED_EMPLOYEES: readonly Employee[] = EMPLOYEE_SEEDS.map(seed => {
  const ts = EMPLOYEE_TIMESTAMPS[seed.id] ?? {
    createdAt: BASE_TS,
    updatedAt: BASE_TS,
  }
  return {
    ...seed,
    createdAt: ts.createdAt,
    updatedAt: ts.updatedAt,
  }
}) as readonly Employee[]

// ─── Build Attendances ──────────────────────────────────────────────────────

/**
 * Build sample attendance records for today.
 * Returns a new array on each call (immutable).
 */
export function buildSeedAttendances(): readonly Attendance[] {
  const today = dayjs().format('YYYY-MM-DD')
  const baseTime = dayjs(today)

  return ATTENDANCE_SEEDS.map(seed => {
    const now = Date.now()
    const result: Attendance = {
      id: seed.id,
      employeeId: seed.employeeId,
      date: today,
      clockIn: baseTime
        .hour(seed.clockInHour)
        .minute(seed.clockInMinute)
        .valueOf(),
      type: seed.type,
      createdAt: now,
      updatedAt: now,
    }
    if (seed.clockOutHour != null && seed.clockOutMinute != null) {
      return {
        ...result,
        clockOut: baseTime
          .hour(seed.clockOutHour)
          .minute(seed.clockOutMinute)
          .valueOf(),
      }
    }
    return result
  })
}

// ─── Build Commodity Types ──────────────────────────────────────────────────

export const SEED_COMMODITY_TYPES: readonly CommodityType[] =
  COMMODITY_TYPE_SEEDS.map(seed => ({
    ...seed,
    createdAt: BASE_TS,
    updatedAt: BASE_TS,
  })) as readonly CommodityType[]

// ─── Build Commodities ──────────────────────────────────────────────────────

export const SEED_COMMODITIES: readonly Commodity[] = COMMODITY_SEEDS.map(
  seed => ({
    id: seed.id,
    typeId: seed.typeId,
    name: seed.name,
    image: seed.imageKey,
    price: seed.price,
    priority: seed.priority,
    onMarket: true,
    includesSoup: seed.includesSoup ?? false,
    hideOnMode: seed.hideOnMode,
    createdAt: BASE_TS,
    updatedAt: BASE_TS,
  }),
) as readonly Commodity[]

// ─── Database Seeding ───────────────────────────────────────────────────────

/** Seed employees and attendances into an empty database. */
export function seedEmployees(db: Database): void {
  for (const emp of SEED_EMPLOYEES) {
    db.exec(
      `INSERT OR IGNORE INTO employees (id, name, avatar, status, shift_type, employee_no, is_admin, hire_date, resignation_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        emp.id,
        emp.name,
        emp.avatar ?? null,
        emp.status,
        emp.shiftType,
        emp.employeeNo ?? null,
        emp.isAdmin ? 1 : 0,
        emp.hireDate ?? null,
        emp.resignationDate ?? null,
        emp.createdAt,
        emp.updatedAt,
      ],
    )
  }

  const attendances = buildSeedAttendances()
  for (const att of attendances) {
    db.exec(
      `INSERT OR IGNORE INTO attendances (id, employee_id, date, clock_in, clock_out, type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        att.id,
        att.employeeId,
        att.date,
        att.clockIn ?? null,
        att.clockOut ?? null,
        att.type,
      ],
    )
  }
}

/** Seed commodity types and commodities into an empty database. */
export function seedCommodities(db: Database): void {
  for (const ct of SEED_COMMODITY_TYPES) {
    db.exec(
      `INSERT OR IGNORE INTO commodity_types (id, type_id, type, label, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        ct.id,
        ct.typeId,
        ct.type,
        ct.label,
        ct.color,
        ct.createdAt,
        ct.updatedAt,
      ],
    )
  }

  for (const com of SEED_COMMODITIES) {
    db.exec(
      `INSERT OR IGNORE INTO commodities (id, type_id, name, image, price, priority, on_market, hide_on_mode, editor, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        com.createdAt,
        com.updatedAt,
      ],
    )
  }
}

/**
 * Insert all seed data into the database using parameterized SQL.
 * Seeds employees and commodities independently based on table emptiness.
 */
export function seedDatabase(db: Database): void {
  seedEmployees(db)
  seedCommodities(db)
}
