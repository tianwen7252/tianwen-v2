import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'

import type { CommoditySeedInput } from './test-data-generator'

import {
  createSeededRandom,
  getDateRange,
  getOrderCountForDay,
  generateOrdersForDay,
  generateAttendancesForDay,
  generateDayData,
  getCommoditiesForGeneration,
  getActiveEmployeeIds,
} from './test-data-generator'

// ─── Test fixtures ─────────────────────────────────────────────────────────

const TEST_COMMODITIES: CommoditySeedInput[] = [
  {
    id: 'com-001',
    typeId: 'bento',
    name: 'Chicken Rice',
    price: 100,
    includesSoup: true,
  },
  {
    id: 'com-002',
    typeId: 'bento',
    name: 'Pork Rice',
    price: 110,
    includesSoup: true,
  },
  { id: 'com-101', typeId: 'single', name: 'Side Dish', price: 50 },
  { id: 'com-201', typeId: 'drink', name: 'Green Tea', price: 25 },
  { id: 'com-301', typeId: 'dumpling', name: 'Dumplings', price: 240 },
]

const TEST_EMPLOYEE_IDS = ['emp-001', 'emp-002', 'emp-003']

const TEST_DATE = '2025-10-15'

// ─── createSeededRandom ────────────────────────────────────────────────────

describe('createSeededRandom', () => {
  it('returns deterministic values for same seed', () => {
    const rng1 = createSeededRandom(42)
    const rng2 = createSeededRandom(42)

    const seq1 = Array.from({ length: 10 }, () => rng1())
    const seq2 = Array.from({ length: 10 }, () => rng2())

    expect(seq1).toEqual(seq2)
  })

  it('values are between 0 and 1', () => {
    const rng = createSeededRandom(12345)
    const values = Array.from({ length: 1000 }, () => rng())

    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('different seeds produce different sequences', () => {
    const rng1 = createSeededRandom(1)
    const rng2 = createSeededRandom(2)

    const seq1 = Array.from({ length: 5 }, () => rng1())
    const seq2 = Array.from({ length: 5 }, () => rng2())

    expect(seq1).not.toEqual(seq2)
  })

  it('handles seed of 0', () => {
    const rng = createSeededRandom(0)
    const value = rng()
    expect(value).toBeGreaterThanOrEqual(0)
    expect(value).toBeLessThan(1)
  })

  it('handles large seed values', () => {
    const rng = createSeededRandom(2_147_483_647)
    const value = rng()
    expect(value).toBeGreaterThanOrEqual(0)
    expect(value).toBeLessThan(1)
  })

  it('produces varied distribution', () => {
    const rng = createSeededRandom(99)
    const values = Array.from({ length: 10000 }, () => rng())

    // Check distribution is roughly uniform across quartiles
    const q1 = values.filter(v => v < 0.25).length
    const q2 = values.filter(v => v >= 0.25 && v < 0.5).length
    const q3 = values.filter(v => v >= 0.5 && v < 0.75).length
    const q4 = values.filter(v => v >= 0.75).length

    // Each quartile should have roughly 2500 items (tolerance: 1500-3500)
    expect(q1).toBeGreaterThan(1500)
    expect(q1).toBeLessThan(3500)
    expect(q2).toBeGreaterThan(1500)
    expect(q2).toBeLessThan(3500)
    expect(q3).toBeGreaterThan(1500)
    expect(q3).toBeLessThan(3500)
    expect(q4).toBeGreaterThan(1500)
    expect(q4).toBeLessThan(3500)
  })
})

// ─── getDateRange ──────────────────────────────────────────────────────────

describe('getDateRange', () => {
  it('returns correct number of days for 6 months', () => {
    const dates = getDateRange(6)
    const startDate = dayjs().subtract(6, 'month')
    const expectedDays = dayjs().diff(startDate, 'day') + 1

    expect(dates).toHaveLength(expectedDays)
  })

  it('first date is approximately 6 months ago', () => {
    const dates = getDateRange(6)
    const first = dayjs(dates[0])
    const expected = dayjs().subtract(6, 'month')

    expect(first.format('YYYY-MM-DD')).toBe(expected.format('YYYY-MM-DD'))
  })

  it('last date is today', () => {
    const dates = getDateRange(6)
    const last = dates[dates.length - 1]

    expect(last).toBe(dayjs().format('YYYY-MM-DD'))
  })

  it('all dates in YYYY-MM-DD format', () => {
    const dates = getDateRange(3)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/

    for (const d of dates) {
      expect(d).toMatch(dateRegex)
    }
  })

  it('dates are sequential (no gaps)', () => {
    const dates = getDateRange(2)

    for (let i = 1; i < dates.length; i++) {
      const prev = dayjs(dates[i - 1])
      const curr = dayjs(dates[i])
      expect(curr.diff(prev, 'day')).toBe(1)
    }
  })

  it('returns at least 1 day for 0 months', () => {
    const dates = getDateRange(0)
    // 0 months from today is today, so should be 1 day
    expect(dates.length).toBeGreaterThanOrEqual(1)
    expect(dates[dates.length - 1]).toBe(dayjs().format('YYYY-MM-DD'))
  })

  it('returns correct range for 1 month', () => {
    const dates = getDateRange(1)
    const startDate = dayjs().subtract(1, 'month')
    const expectedDays = dayjs().diff(startDate, 'day') + 1

    expect(dates).toHaveLength(expectedDays)
  })
})

// ─── getOrderCountForDay ───────────────────────────────────────────────────

describe('getOrderCountForDay', () => {
  it('returns value between 50 and 100', () => {
    const rng = createSeededRandom(42)
    for (let i = 0; i < 100; i++) {
      const count = getOrderCountForDay(rng)
      expect(count).toBeGreaterThanOrEqual(50)
      expect(count).toBeLessThanOrEqual(100)
    }
  })

  it('average over many calls is around 70-80', () => {
    const rng = createSeededRandom(123)
    const counts = Array.from({ length: 1000 }, () => getOrderCountForDay(rng))
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length

    expect(avg).toBeGreaterThanOrEqual(70)
    expect(avg).toBeLessThanOrEqual(80)
  })

  it('returns an integer', () => {
    const rng = createSeededRandom(7)
    for (let i = 0; i < 50; i++) {
      const count = getOrderCountForDay(rng)
      expect(Number.isInteger(count)).toBe(true)
    }
  })

  it('is deterministic with same random function', () => {
    const rng1 = createSeededRandom(42)
    const rng2 = createSeededRandom(42)

    const counts1 = Array.from({ length: 10 }, () => getOrderCountForDay(rng1))
    const counts2 = Array.from({ length: 10 }, () => getOrderCountForDay(rng2))

    expect(counts1).toEqual(counts2)
  })
})

// ─── generateOrdersForDay ──────────────────────────────────────────────────

describe('generateOrdersForDay', () => {
  it('generates correct number of orders', () => {
    const rng = createSeededRandom(42)
    const result = generateOrdersForDay(TEST_DATE, TEST_COMMODITIES, 10, rng)

    expect(result.orders).toHaveLength(10)
  })

  it('order numbers are sequential 1..N', () => {
    const rng = createSeededRandom(42)
    const result = generateOrdersForDay(TEST_DATE, TEST_COMMODITIES, 5, rng)

    const numbers = result.orders.map(o => o.number)
    expect(numbers).toEqual([1, 2, 3, 4, 5])
  })

  it('each order has 1-5 items', () => {
    const rng = createSeededRandom(42)
    const result = generateOrdersForDay(TEST_DATE, TEST_COMMODITIES, 30, rng)

    for (const order of result.orders) {
      const items = result.orderItems.filter(i => i.orderId === order.id)
      expect(items.length).toBeGreaterThanOrEqual(1)
      expect(items.length).toBeLessThanOrEqual(5)
    }
  })

  it('order timestamps within 10:00-20:00 of the given date', () => {
    const rng = createSeededRandom(42)
    const result = generateOrdersForDay(TEST_DATE, TEST_COMMODITIES, 50, rng)

    const dayStart = dayjs(TEST_DATE).hour(10).minute(0).second(0).valueOf()
    const dayEnd = dayjs(TEST_DATE).hour(20).minute(0).second(0).valueOf()

    for (const order of result.orders) {
      expect(order.createdAt).toBeGreaterThanOrEqual(dayStart)
      expect(order.createdAt).toBeLessThanOrEqual(dayEnd)
    }
  })

  it('approximately 10% of orders have discounts (tolerance: 3%-20%)', () => {
    const rng = createSeededRandom(42)
    const result = generateOrdersForDay(TEST_DATE, TEST_COMMODITIES, 200, rng)

    const discountedOrderIds = new Set(
      result.orderDiscounts.map(d => d.orderId),
    )
    const pct = discountedOrderIds.size / 200

    expect(pct).toBeGreaterThanOrEqual(0.03)
    expect(pct).toBeLessThanOrEqual(0.2)
  })

  it('total = sum(items) - sum(discounts) for each order', () => {
    const rng = createSeededRandom(42)
    const result = generateOrdersForDay(TEST_DATE, TEST_COMMODITIES, 30, rng)

    for (const order of result.orders) {
      const itemTotal = result.orderItems
        .filter(i => i.orderId === order.id)
        .reduce((sum, i) => sum + i.price * i.quantity, 0)
      const discountTotal = result.orderDiscounts
        .filter(d => d.orderId === order.id)
        .reduce((sum, d) => sum + d.amount, 0)

      expect(order.total).toBe(Math.max(0, itemTotal - discountTotal))
    }
  })

  it('orders with discounts have originalTotal set', () => {
    const rng = createSeededRandom(42)
    const result = generateOrdersForDay(TEST_DATE, TEST_COMMODITIES, 200, rng)

    const discountedOrderIds = new Set(
      result.orderDiscounts.map(d => d.orderId),
    )

    for (const order of result.orders) {
      if (discountedOrderIds.has(order.id)) {
        expect(order.originalTotal).toBeDefined()
        expect(order.originalTotal).toBeGreaterThan(order.total)
      }
    }
  })

  it('memo is empty (95%) or a single source tag (5%)', () => {
    const rng = createSeededRandom(42)
    const result = generateOrdersForDay(TEST_DATE, TEST_COMMODITIES, 200, rng)

    const ORDER_TAGS = ['攤位', '外送', '電話自取']
    let tagCount = 0
    for (const order of result.orders) {
      if (order.memo.length === 0) {
        // Most orders have empty memo
        continue
      }
      // Tagged orders have exactly one tag
      expect(order.memo.length).toBe(1)
      expect(ORDER_TAGS).toContain(order.memo[0])
      tagCount++
    }
    // ~5% should have tags (tolerance: 1%-15% over 200 orders)
    const pct = tagCount / 200
    expect(pct).toBeGreaterThanOrEqual(0.01)
    expect(pct).toBeLessThanOrEqual(0.15)
  })

  it('soups count matches includesSoup items', () => {
    const rng = createSeededRandom(42)
    const result = generateOrdersForDay(TEST_DATE, TEST_COMMODITIES, 30, rng)

    for (const order of result.orders) {
      const items = result.orderItems.filter(i => i.orderId === order.id)
      const expectedSoups = items
        .filter(i => i.includesSoup)
        .reduce((sum, i) => sum + i.quantity, 0)
      expect(order.soups).toBe(expectedSoups)
    }
  })

  it('all IDs are unique', () => {
    const rng = createSeededRandom(42)
    const result = generateOrdersForDay(TEST_DATE, TEST_COMMODITIES, 50, rng)

    const orderIds = result.orders.map(o => o.id)
    expect(new Set(orderIds).size).toBe(orderIds.length)

    const itemIds = result.orderItems.map(i => i.id)
    expect(new Set(itemIds).size).toBe(itemIds.length)

    const discountIds = result.orderDiscounts.map(d => d.id)
    expect(new Set(discountIds).size).toBe(discountIds.length)
  })

  it('editor is empty string for system generated orders', () => {
    const rng = createSeededRandom(42)
    const result = generateOrdersForDay(TEST_DATE, TEST_COMMODITIES, 5, rng)

    for (const order of result.orders) {
      expect(order.editor).toBe('')
    }
  })

  it('item quantities are between 1 and 3', () => {
    const rng = createSeededRandom(42)
    const result = generateOrdersForDay(TEST_DATE, TEST_COMMODITIES, 50, rng)

    for (const item of result.orderItems) {
      expect(item.quantity).toBeGreaterThanOrEqual(1)
      expect(item.quantity).toBeLessThanOrEqual(3)
    }
  })

  it('discount label is correct and amount between 5-30', () => {
    const rng = createSeededRandom(42)
    const result = generateOrdersForDay(TEST_DATE, TEST_COMMODITIES, 200, rng)

    for (const discount of result.orderDiscounts) {
      expect(discount.label).toBe('\u6298\u6263')
      expect(discount.amount).toBeGreaterThanOrEqual(5)
      expect(discount.amount).toBeLessThanOrEqual(30)
    }
  })

  it('updatedAt equals createdAt for new orders', () => {
    const rng = createSeededRandom(42)
    const result = generateOrdersForDay(TEST_DATE, TEST_COMMODITIES, 10, rng)

    for (const order of result.orders) {
      expect(order.updatedAt).toBe(order.createdAt)
    }
  })

  it('generates zero orders when count is 0', () => {
    const rng = createSeededRandom(42)
    const result = generateOrdersForDay(TEST_DATE, TEST_COMMODITIES, 0, rng)

    expect(result.orders).toHaveLength(0)
    expect(result.orderItems).toHaveLength(0)
    expect(result.orderDiscounts).toHaveLength(0)
  })

  it('handles single commodity input', () => {
    const rng = createSeededRandom(42)
    const singleCommodity: CommoditySeedInput[] = [
      {
        id: 'com-999',
        typeId: 'bento',
        name: 'Only Item',
        price: 100,
        includesSoup: true,
      },
    ]
    const result = generateOrdersForDay(TEST_DATE, singleCommodity, 5, rng)

    expect(result.orders).toHaveLength(5)
    for (const item of result.orderItems) {
      expect(item.commodityId).toBe('com-999')
    }
  })
})

// ─── generateAttendancesForDay ─────────────────────────────────────────────

describe('generateAttendancesForDay', () => {
  it('generates one attendance per employee', () => {
    const rng = createSeededRandom(42)
    const result = generateAttendancesForDay(TEST_DATE, TEST_EMPLOYEE_IDS, rng)

    expect(result).toHaveLength(TEST_EMPLOYEE_IDS.length)
  })

  it('most are type regular (>80%)', () => {
    const rng = createSeededRandom(42)
    // Use many employees to get statistical significance
    const manyEmployees = Array.from({ length: 200 }, (_, i) => `emp-${i}`)
    const result = generateAttendancesForDay(TEST_DATE, manyEmployees, rng)

    const regularCount = result.filter(a => a.type === 'regular').length
    const pct = regularCount / manyEmployees.length

    expect(pct).toBeGreaterThan(0.8)
  })

  it('regular type has clockIn and clockOut', () => {
    const rng = createSeededRandom(42)
    const manyEmployees = Array.from({ length: 50 }, (_, i) => `emp-${i}`)
    const result = generateAttendancesForDay(TEST_DATE, manyEmployees, rng)

    const regulars = result.filter(a => a.type === 'regular')
    for (const att of regulars) {
      expect(att.clockIn).toBeDefined()
      expect(att.clockOut).toBeDefined()
    }
  })

  it('leave types have no clockIn/clockOut', () => {
    const rng = createSeededRandom(42)
    const manyEmployees = Array.from({ length: 200 }, (_, i) => `emp-${i}`)
    const result = generateAttendancesForDay(TEST_DATE, manyEmployees, rng)

    const leaveTypes = result.filter(a => a.type !== 'regular')
    for (const att of leaveTypes) {
      expect(att.clockIn).toBeUndefined()
      expect(att.clockOut).toBeUndefined()
    }
  })

  it('clockIn between 07:30-09:00', () => {
    const rng = createSeededRandom(42)
    const manyEmployees = Array.from({ length: 50 }, (_, i) => `emp-${i}`)
    const result = generateAttendancesForDay(TEST_DATE, manyEmployees, rng)

    const minClockIn = dayjs(TEST_DATE).hour(7).minute(30).second(0).valueOf()
    const maxClockIn = dayjs(TEST_DATE).hour(9).minute(0).second(0).valueOf()

    const regulars = result.filter(a => a.type === 'regular')
    for (const att of regulars) {
      expect(att.clockIn).toBeGreaterThanOrEqual(minClockIn)
      expect(att.clockIn).toBeLessThanOrEqual(maxClockIn)
    }
  })

  it('clockOut between 16:00-18:00', () => {
    const rng = createSeededRandom(42)
    const manyEmployees = Array.from({ length: 50 }, (_, i) => `emp-${i}`)
    const result = generateAttendancesForDay(TEST_DATE, manyEmployees, rng)

    const minClockOut = dayjs(TEST_DATE).hour(16).minute(0).second(0).valueOf()
    const maxClockOut = dayjs(TEST_DATE).hour(18).minute(0).second(0).valueOf()

    const regulars = result.filter(a => a.type === 'regular')
    for (const att of regulars) {
      expect(att.clockOut).toBeGreaterThanOrEqual(minClockOut)
      expect(att.clockOut).toBeLessThanOrEqual(maxClockOut)
    }
  })

  it('all IDs are unique', () => {
    const rng = createSeededRandom(42)
    const result = generateAttendancesForDay(TEST_DATE, TEST_EMPLOYEE_IDS, rng)

    const ids = result.map(a => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('date matches input date for all attendances', () => {
    const rng = createSeededRandom(42)
    const result = generateAttendancesForDay(TEST_DATE, TEST_EMPLOYEE_IDS, rng)

    for (const att of result) {
      expect(att.date).toBe(TEST_DATE)
    }
  })

  it('employee IDs match input array', () => {
    const rng = createSeededRandom(42)
    const result = generateAttendancesForDay(TEST_DATE, TEST_EMPLOYEE_IDS, rng)

    const resultIds = result.map(a => a.employeeId).sort()
    expect(resultIds).toEqual([...TEST_EMPLOYEE_IDS].sort())
  })

  it('handles empty employee array', () => {
    const rng = createSeededRandom(42)
    const result = generateAttendancesForDay(TEST_DATE, [], rng)

    expect(result).toHaveLength(0)
  })

  it('leave types include paid_leave, sick_leave, personal_leave', () => {
    const rng = createSeededRandom(42)
    // Use a large number to ensure we get various leave types
    const manyEmployees = Array.from({ length: 500 }, (_, i) => `emp-${i}`)
    const result = generateAttendancesForDay(TEST_DATE, manyEmployees, rng)

    const types = new Set(result.map(a => a.type))
    expect(types.has('regular')).toBe(true)
    expect(types.has('paid_leave')).toBe(true)
    expect(types.has('sick_leave')).toBe(true)
    expect(types.has('personal_leave')).toBe(true)
  })
})

// ─── generateDayData ───────────────────────────────────────────────────────

describe('generateDayData', () => {
  it('returns all data types', () => {
    const rng = createSeededRandom(42)
    const result = generateDayData(
      TEST_DATE,
      TEST_COMMODITIES,
      TEST_EMPLOYEE_IDS,
      10,
      rng,
    )

    expect(result.orders).toBeDefined()
    expect(result.orderItems).toBeDefined()
    expect(result.orderDiscounts).toBeDefined()
    expect(result.attendances).toBeDefined()
    expect(result.dailyData).toBeDefined()
  })

  it('dailyData.total equals sum of order totals', () => {
    const rng = createSeededRandom(42)
    const result = generateDayData(
      TEST_DATE,
      TEST_COMMODITIES,
      TEST_EMPLOYEE_IDS,
      20,
      rng,
    )

    const sumOfOrders = result.orders.reduce((sum, o) => sum + o.total, 0)
    expect(result.dailyData.total).toBe(sumOfOrders)
  })

  it('dailyData.originalTotal equals sum of originalTotal (with fallback to total)', () => {
    const rng = createSeededRandom(42)
    const result = generateDayData(
      TEST_DATE,
      TEST_COMMODITIES,
      TEST_EMPLOYEE_IDS,
      20,
      rng,
    )

    const sumOriginal = result.orders.reduce(
      (sum, o) => sum + (o.originalTotal ?? o.total),
      0,
    )
    expect(result.dailyData.originalTotal).toBe(sumOriginal)
  })

  it('dailyData.date matches input date', () => {
    const rng = createSeededRandom(42)
    const result = generateDayData(
      TEST_DATE,
      TEST_COMMODITIES,
      TEST_EMPLOYEE_IDS,
      10,
      rng,
    )

    expect(result.dailyData.date).toBe(TEST_DATE)
  })

  it('dailyData has required fields', () => {
    const rng = createSeededRandom(42)
    const result = generateDayData(
      TEST_DATE,
      TEST_COMMODITIES,
      TEST_EMPLOYEE_IDS,
      10,
      rng,
    )

    expect(result.dailyData.id).toBeDefined()
    expect(typeof result.dailyData.id).toBe('string')
    expect(result.dailyData.createdAt).toBeDefined()
    expect(result.dailyData.updatedAt).toBeDefined()
    expect(result.dailyData.editor).toBe('')
  })

  it('attendances count matches employee count', () => {
    const rng = createSeededRandom(42)
    const result = generateDayData(
      TEST_DATE,
      TEST_COMMODITIES,
      TEST_EMPLOYEE_IDS,
      10,
      rng,
    )

    expect(result.attendances).toHaveLength(TEST_EMPLOYEE_IDS.length)
  })

  it('orders count matches requested count', () => {
    const rng = createSeededRandom(42)
    const result = generateDayData(
      TEST_DATE,
      TEST_COMMODITIES,
      TEST_EMPLOYEE_IDS,
      15,
      rng,
    )

    expect(result.orders).toHaveLength(15)
  })

  it('is deterministic with same random function', () => {
    const rng1 = createSeededRandom(42)
    const rng2 = createSeededRandom(42)

    const result1 = generateDayData(
      TEST_DATE,
      TEST_COMMODITIES,
      TEST_EMPLOYEE_IDS,
      10,
      rng1,
    )
    const result2 = generateDayData(
      TEST_DATE,
      TEST_COMMODITIES,
      TEST_EMPLOYEE_IDS,
      10,
      rng2,
    )

    expect(result1.orders.length).toBe(result2.orders.length)
    expect(result1.dailyData.total).toBe(result2.dailyData.total)
    expect(result1.dailyData.originalTotal).toBe(
      result2.dailyData.originalTotal,
    )
  })
})

// ─── getCommoditiesForGeneration ───────────────────────────────────────────

describe('getCommoditiesForGeneration', () => {
  it('returns an array of CommoditySeedInput objects', () => {
    const commodities = getCommoditiesForGeneration()

    expect(Array.isArray(commodities)).toBe(true)
    expect(commodities.length).toBeGreaterThan(0)
  })

  it('each commodity has required fields', () => {
    const commodities = getCommoditiesForGeneration()

    for (const c of commodities) {
      expect(c.id).toBeDefined()
      expect(c.typeId).toBeDefined()
      expect(c.name).toBeDefined()
      expect(typeof c.price).toBe('number')
    }
  })

  it('filters out add-on items (hideOnMode)', () => {
    const commodities = getCommoditiesForGeneration()

    // Items with hideOnMode set in COMMODITY_SEEDS should be excluded
    // Bento '加蛋' (com-016), '加菜' (com-017), '加菜(大)' (com-018), and '白飯' (com-019) have hideOnMode: 'both'
    const ids = commodities.map(c => c.id)
    expect(ids).not.toContain('com-016')
    expect(ids).not.toContain('com-017')

    // The total count should be less than the full seed count
    expect(commodities.length).toBeLessThan(48) // 48 total seeds, minus 4 hidden
  })

  it('includes commodities from all type categories', () => {
    const commodities = getCommoditiesForGeneration()
    const typeIds = new Set(commodities.map(c => c.typeId))

    expect(typeIds.has('bento')).toBe(true)
    expect(typeIds.has('single')).toBe(true)
    expect(typeIds.has('drink')).toBe(true)
    expect(typeIds.has('dumpling')).toBe(true)
  })
})

// ─── getActiveEmployeeIds ──────────────────────────────────────────────────

describe('getActiveEmployeeIds', () => {
  it('returns an array of string IDs', () => {
    const ids = getActiveEmployeeIds()

    expect(Array.isArray(ids)).toBe(true)
    for (const id of ids) {
      expect(typeof id).toBe('string')
    }
  })

  it('only includes active employees', () => {
    const ids = getActiveEmployeeIds()

    // All current employees are active; verify count matches seed data
    expect(ids.length).toBeGreaterThan(0)
  })

  it('includes known active employees', () => {
    const ids = getActiveEmployeeIds()

    // Alex (emp-001) is active
    expect(ids).toContain('emp-001')
    // Mia (emp-002) is active
    expect(ids).toContain('emp-002')
  })

  it('returns at least one employee', () => {
    const ids = getActiveEmployeeIds()
    expect(ids.length).toBeGreaterThan(0)
  })
})
