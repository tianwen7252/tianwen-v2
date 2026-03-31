/**
 * Test data generator for restaurant POS system.
 * Pure functions — no database dependency, just returns data objects.
 */

import dayjs from 'dayjs'
import { nanoid } from 'nanoid'
import { COMMODITY_SEEDS, EMPLOYEE_SEEDS } from '@/constants/seed-data'

// ─── Types ─────────────────────────────────────────────────────────────────

export interface GeneratedOrder {
  id: string
  number: number
  memo: string[]
  soups: number
  total: number
  originalTotal?: number
  editor: string
  createdAt: number // unix ms
  updatedAt: number // unix ms
}

export interface GeneratedOrderItem {
  id: string
  orderId: string
  commodityId: string
  name: string
  price: number
  quantity: number
  includesSoup: boolean
  createdAt: number
}

export interface GeneratedOrderDiscount {
  id: string
  orderId: string
  label: string
  amount: number
  createdAt: number
}

export interface GeneratedAttendance {
  id: string
  employeeId: string
  date: string // 'YYYY-MM-DD'
  clockIn?: number // unix ms
  clockOut?: number // unix ms
  type: 'regular' | 'paid_leave' | 'sick_leave' | 'personal_leave'
}

export interface GeneratedDailyData {
  id: string
  date: string // 'YYYY-MM-DD'
  total: number
  originalTotal: number
  createdAt: number
  updatedAt: number
  editor: string
}

export interface DayGenerationResult {
  orders: GeneratedOrder[]
  orderItems: GeneratedOrderItem[]
  orderDiscounts: GeneratedOrderDiscount[]
  attendances: GeneratedAttendance[]
  dailyData: GeneratedDailyData
}

export interface CommoditySeedInput {
  id: string
  typeId: string // 'bento' | 'single' | 'drink' | 'dumpling'
  name: string
  price: number
  includesSoup?: boolean
}

// ─── Seeded Random ─────────────────────────────────────────────────────────

/**
 * Create a seeded PRNG using the Mulberry32 algorithm.
 * Returns a function that produces deterministic pseudo-random numbers [0, 1).
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed | 0

  return (): number => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ─── Date Range ────────────────────────────────────────────────────────────

/**
 * Return an array of 'YYYY-MM-DD' strings from (today - months) to today.
 */
export function getDateRange(months: number): string[] {
  const start = dayjs().subtract(months, 'month')
  const end = dayjs()
  const totalDays = end.diff(start, 'day')
  const dates: string[] = []

  for (let i = 0; i <= totalDays; i++) {
    dates.push(start.add(i, 'day').format('YYYY-MM-DD'))
  }

  return dates
}

// ─── Order Count ───────────────────────────────────────────────────────────

/**
 * Return a random order count uniformly distributed between 50 and 100 inclusive.
 */
export function getOrderCountForDay(random: () => number): number {
  return Math.floor(random() * 51) + 50
}

// ─── Commodity Helpers ─────────────────────────────────────────────────────

/**
 * Map COMMODITY_SEEDS into the simplified CommoditySeedInput format.
 * Filters out add-on items (those with hideOnMode).
 */
export function getCommoditiesForGeneration(): CommoditySeedInput[] {
  return COMMODITY_SEEDS.filter(seed => !seed.hideOnMode).map(seed => ({
    id: seed.id,
    typeId: seed.typeId,
    name: seed.name,
    price: seed.price,
    includesSoup: seed.includesSoup,
  }))
}

/**
 * Return the IDs of active employees from EMPLOYEE_SEEDS.
 */
export function getActiveEmployeeIds(): string[] {
  return EMPLOYEE_SEEDS.filter(emp => emp.status === 'active').map(
    emp => emp.id,
  )
}

// ─── Order Tags ───────────────────────────────────────────────────────────

const ORDER_TAGS = ['攤位', '外送', '電話自取'] as const

// ─── Internal Helpers ──────────────────────────────────────────────────────

/**
 * Pick a commodity from the array using weighted type selection.
 * Weights: 60% bento, 20% single, 10% drink, 10% dumpling.
 */
function pickCommodity(
  commodities: CommoditySeedInput[],
  random: () => number,
): CommoditySeedInput {
  const roll = random()
  let targetType: string

  if (roll < 0.6) {
    targetType = 'bento'
  } else if (roll < 0.8) {
    targetType = 'single'
  } else if (roll < 0.9) {
    targetType = 'drink'
  } else {
    targetType = 'dumpling'
  }

  const candidates = commodities.filter(c => c.typeId === targetType)

  // Fallback to any commodity if no candidates for the target type
  const pool = candidates.length > 0 ? candidates : commodities
  if (pool.length === 0) {
    throw new Error('pickCommodity: commodity pool is empty')
  }
  const idx = Math.floor(random() * pool.length)
  return pool[idx]!
}

/**
 * Generate a random timestamp between hours on a given date,
 * with peak-hour bias for lunch (11-13) and dinner (17-19).
 */
function generateOrderTimestamp(date: string, random: () => number): number {
  const baseDay = dayjs(date)

  // Weighted hour selection: lunch peak (11-13) and dinner peak (17-19)
  const roll = random()
  let hour: number

  if (roll < 0.35) {
    // Lunch peak: 11:00 - 12:59 (35% probability)
    hour = 11 + Math.floor(random() * 2)
  } else if (roll < 0.7) {
    // Dinner peak: 17:00 - 18:59 (35% probability)
    hour = 17 + Math.floor(random() * 2)
  } else {
    // Off-peak: 10:00-11:00, 13:00-17:00, 19:00-20:00 (30% probability)
    const offPeakHours = [10, 13, 14, 15, 16, 19] as const
    hour = offPeakHours[Math.floor(random() * offPeakHours.length)]!
  }

  const minute = Math.floor(random() * 60)
  const second = Math.floor(random() * 60)

  return baseDay
    .hour(hour)
    .minute(minute)
    .second(second)
    .millisecond(0)
    .valueOf()
}

// ─── Generate Orders ───────────────────────────────────────────────────────

/**
 * Generate N orders with items and optional discounts for a single day.
 */
export function generateOrdersForDay(
  date: string,
  commodities: CommoditySeedInput[],
  orderCount: number,
  random: () => number,
): {
  orders: GeneratedOrder[]
  orderItems: GeneratedOrderItem[]
  orderDiscounts: GeneratedOrderDiscount[]
} {
  const orders: GeneratedOrder[] = []
  const orderItems: GeneratedOrderItem[] = []
  const orderDiscounts: GeneratedOrderDiscount[] = []

  // Pre-generate and sort timestamps so orders appear in chronological order.
  // For today, exclude timestamps in the future.
  const now = Date.now()
  const allTimestamps = Array.from({ length: orderCount }, () =>
    generateOrderTimestamp(date, random),
  )
    .filter(ts => ts <= now)
    .sort((a, b) => a - b)
  const actualCount = allTimestamps.length

  for (let n = 1; n <= actualCount; n++) {
    const orderId = nanoid()
    const timestamp = allTimestamps[n - 1]!

    // Generate 1-5 items for this order
    const itemCount = Math.floor(random() * 5) + 1
    const items: GeneratedOrderItem[] = []

    for (let i = 0; i < itemCount; i++) {
      const commodity = pickCommodity(commodities, random)
      const quantity = Math.floor(random() * 3) + 1

      items.push({
        id: nanoid(),
        orderId,
        commodityId: commodity.id,
        name: commodity.name,
        price: commodity.price,
        quantity,
        includesSoup: commodity.includesSoup ?? false,
        createdAt: timestamp,
      })
    }

    // Calculate totals
    const itemTotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    )
    const soups = items
      .filter(item => item.includesSoup)
      .reduce((sum, item) => sum + item.quantity, 0)

    // ~10% chance of discount
    let discountTotal = 0
    if (random() < 0.1) {
      const discountAmount = Math.floor(random() * 26) + 5 // 5-30
      const discount: GeneratedOrderDiscount = {
        id: nanoid(),
        orderId,
        label: '折扣',
        amount: discountAmount,
        createdAt: timestamp,
      }
      orderDiscounts.push(discount)
      discountTotal = discountAmount
    }

    // 5% chance of a single source tag, otherwise empty memo
    const memo: string[] =
      random() < 0.05
        ? [ORDER_TAGS[Math.floor(random() * ORDER_TAGS.length)]!]
        : []

    const order: GeneratedOrder = {
      id: orderId,
      number: n,
      memo,
      soups,
      total: Math.max(0, itemTotal - discountTotal),
      editor: '',
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    // Set originalTotal only when there is a discount
    if (discountTotal > 0) {
      orders.push({
        ...order,
        originalTotal: itemTotal,
      })
    } else {
      orders.push(order)
    }

    orderItems.push(...items)
  }

  return { orders, orderItems, orderDiscounts }
}

// ─── Generate Attendances ──────────────────────────────────────────────────

/**
 * Generate one attendance record per active employee for a given day.
 */
export function generateAttendancesForDay(
  date: string,
  activeEmployeeIds: string[],
  random: () => number,
): GeneratedAttendance[] {
  const baseDay = dayjs(date)

  return activeEmployeeIds.map(employeeId => {
    const roll = random()
    let type: GeneratedAttendance['type']

    if (roll < 0.9) {
      type = 'regular'
    } else if (roll < 0.95) {
      type = 'paid_leave'
    } else if (roll < 0.98) {
      type = 'sick_leave'
    } else {
      type = 'personal_leave'
    }

    if (type === 'regular') {
      // clockIn: 07:30 - 09:00 (90 minutes range)
      const clockInMinutes = Math.floor(random() * 91) // 0-90 minutes after 07:30
      const clockIn = baseDay
        .hour(7)
        .minute(30)
        .second(0)
        .millisecond(0)
        .add(clockInMinutes, 'minute')
        .valueOf()

      // clockOut: 16:00 - 18:00 (120 minutes range)
      const clockOutMinutes = Math.floor(random() * 121) // 0-120 minutes after 16:00
      const clockOut = baseDay
        .hour(16)
        .minute(0)
        .second(0)
        .millisecond(0)
        .add(clockOutMinutes, 'minute')
        .valueOf()

      return {
        id: nanoid(),
        employeeId,
        date,
        clockIn,
        clockOut,
        type,
      }
    }

    // Leave types have no clock times
    return {
      id: nanoid(),
      employeeId,
      date,
      type,
    }
  })
}

// ─── Generate Day Data ─────────────────────────────────────────────────────

/**
 * Generate all data for a single day.
 */
export function generateDayData(
  date: string,
  commodities: CommoditySeedInput[],
  activeEmployeeIds: string[],
  orderCount: number,
  random: () => number,
): DayGenerationResult {
  const { orders, orderItems, orderDiscounts } = generateOrdersForDay(
    date,
    commodities,
    orderCount,
    random,
  )

  const attendances = generateAttendancesForDay(date, activeEmployeeIds, random)

  const total = orders.reduce((sum, o) => sum + o.total, 0)
  const originalTotal = orders.reduce(
    (sum, o) => sum + (o.originalTotal ?? o.total),
    0,
  )

  const timestamp = dayjs(date)
    .hour(20)
    .minute(30)
    .second(0)
    .millisecond(0)
    .valueOf()

  const dailyData: GeneratedDailyData = {
    id: nanoid(),
    date,
    total,
    originalTotal,
    createdAt: timestamp,
    updatedAt: timestamp,
    editor: '',
  }

  return {
    orders,
    orderItems,
    orderDiscounts,
    attendances,
    dailyData,
  }
}
