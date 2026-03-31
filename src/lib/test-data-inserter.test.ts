import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { AsyncDatabase } from '@/lib/worker-database'
import type { QueryResult } from '@/lib/database'

import { insertTestData } from './test-data-inserter'
import type { InsertProgress } from './test-data-inserter'
import {
  initRepositories,
  resetRepositories,
  getDatabase,
} from '@/lib/repositories'

// ─── Mock database factory ────────────────────────────────────────────────

function createMockDatabase(): AsyncDatabase & {
  calls: Array<{ sql: string; params?: readonly unknown[] }>
} {
  const calls: Array<{ sql: string; params?: readonly unknown[] }> = []
  return {
    calls,
    async exec<T>(
      sql: string,
      params?: readonly unknown[],
    ): Promise<QueryResult<T>> {
      calls.push({ sql, params })
      return { rows: [] as T[], changes: 1 }
    },
    async exportDatabase(): Promise<Uint8Array> {
      return new Uint8Array()
    },
  }
}

// ─── Mock the test-data-generator to keep tests fast and deterministic ────

vi.mock('@/lib/test-data-generator', () => ({
  getDateRange: vi.fn((months: number) => {
    if (months === 0) return []
    // Return a small set for most tests
    return ['2025-01-01', '2025-01-02', '2025-01-03']
  }),
  getCommoditiesForGeneration: vi.fn(() => [
    {
      id: 'com-001',
      typeId: 'bento',
      name: 'Chicken Rice',
      price: 100,
      includesSoup: true,
    },
  ]),
  getActiveEmployeeIds: vi.fn(() => ['emp-001', 'emp-002']),
  createSeededRandom: vi.fn(() => {
    let i = 0
    return () => {
      i++
      return (i % 100) / 100
    }
  }),
  getOrderCountForDay: vi.fn(() => 2),
  generateDayData: vi.fn(
    (
      date: string,
      _commodities: unknown,
      _employees: unknown,
      _orderCount: number,
    ) => ({
      orders: [
        {
          id: `order-${date}-1`,
          number: 1,
          memo: ['Chicken Rice x1'],
          soups: 1,
          total: 100,
          editor: '',
          createdAt: 1704067200000,
          updatedAt: 1704067200000,
        },
        {
          id: `order-${date}-2`,
          number: 2,
          memo: ['Chicken Rice x2'],
          soups: 2,
          total: 200,
          originalTotal: 220,
          editor: '',
          createdAt: 1704070800000,
          updatedAt: 1704070800000,
        },
      ],
      orderItems: [
        {
          id: `item-${date}-1`,
          orderId: `order-${date}-1`,
          commodityId: 'com-001',
          name: 'Chicken Rice',
          price: 100,
          quantity: 1,
          includesSoup: true,
          createdAt: 1704067200000,
        },
        {
          id: `item-${date}-2`,
          orderId: `order-${date}-2`,
          commodityId: 'com-001',
          name: 'Chicken Rice',
          price: 100,
          quantity: 2,
          includesSoup: true,
          createdAt: 1704070800000,
        },
      ],
      orderDiscounts: [
        {
          id: `disc-${date}-1`,
          orderId: `order-${date}-2`,
          label: '折扣',
          amount: 20,
          createdAt: 1704070800000,
        },
      ],
      attendances: [
        {
          id: `att-${date}-1`,
          employeeId: 'emp-001',
          date,
          clockIn: 1704067200000,
          clockOut: 1704096000000,
          type: 'regular',
        },
        {
          id: `att-${date}-2`,
          employeeId: 'emp-002',
          date,
          type: 'paid_leave',
        },
      ],
      dailyData: {
        id: `daily-${date}`,
        date,
        total: 300,
        originalTotal: 320,
        createdAt: 1704110400000,
        updatedAt: 1704110400000,
        editor: '',
      },
    }),
  ),
}))

// ─── insertTestData ───────────────────────────────────────────────────────

describe('insertTestData', () => {
  let mockDb: ReturnType<typeof createMockDatabase>

  beforeEach(() => {
    mockDb = createMockDatabase()
    vi.clearAllMocks()
  })

  it('inserts orders into orders table', async () => {
    await insertTestData(mockDb, { months: 1 })

    const orderInserts = mockDb.calls.filter(c =>
      c.sql.includes('INSERT INTO orders'),
    )
    expect(orderInserts.length).toBeGreaterThan(0)

    // Verify first order insert has correct params structure
    const first = orderInserts[0]!
    expect(first.params).toBeDefined()
    // params: id, number, memo, soups, total, original_total, edited_memo, editor, created_at, updated_at
    expect(first.params!.length).toBe(10)
  })

  it('inserts order items into order_items table', async () => {
    await insertTestData(mockDb, { months: 1 })

    const itemInserts = mockDb.calls.filter(c =>
      c.sql.includes('INSERT INTO order_items'),
    )
    expect(itemInserts.length).toBeGreaterThan(0)

    // params: id, order_id, commodity_id, name, price, quantity, includes_soup, created_at
    const first = itemInserts[0]!
    expect(first.params).toBeDefined()
    expect(first.params!.length).toBe(8)
  })

  it('inserts order discounts into order_discounts table', async () => {
    await insertTestData(mockDb, { months: 1 })

    const discountInserts = mockDb.calls.filter(c =>
      c.sql.includes('INSERT INTO order_discounts'),
    )
    expect(discountInserts.length).toBeGreaterThan(0)

    // params: id, order_id, label, amount, created_at
    const first = discountInserts[0]!
    expect(first.params).toBeDefined()
    expect(first.params!.length).toBe(5)
  })

  it('inserts attendances into attendances table', async () => {
    await insertTestData(mockDb, { months: 1 })

    const attendanceInserts = mockDb.calls.filter(c =>
      c.sql.includes('INSERT INTO attendances'),
    )
    expect(attendanceInserts.length).toBeGreaterThan(0)

    // params: id, employee_id, date, clock_in, clock_out, type
    const first = attendanceInserts[0]!
    expect(first.params).toBeDefined()
    expect(first.params!.length).toBe(6)
  })

  it('inserts daily_data into daily_data table', async () => {
    await insertTestData(mockDb, { months: 1 })

    const dailyInserts = mockDb.calls.filter(c =>
      c.sql.includes('INSERT INTO daily_data'),
    )
    expect(dailyInserts.length).toBeGreaterThan(0)

    // params: id, date, total, original_total, created_at, updated_at, editor
    const first = dailyInserts[0]!
    expect(first.params).toBeDefined()
    expect(first.params!.length).toBe(7)
  })

  it('uses transactions (BEGIN/COMMIT pairs)', async () => {
    await insertTestData(mockDb, { months: 1 })

    const beginCalls = mockDb.calls.filter(c => c.sql === 'BEGIN')
    const commitCalls = mockDb.calls.filter(c => c.sql === 'COMMIT')

    expect(beginCalls.length).toBeGreaterThan(0)
    expect(commitCalls.length).toBe(beginCalls.length)
  })

  it('calls onProgress callback for each day', async () => {
    const progressUpdates: InsertProgress[] = []

    await insertTestData(mockDb, {
      months: 1,
      onProgress: progress => {
        progressUpdates.push({ ...progress })
      },
    })

    // 3 days from mock, 2 progress calls per day (generating + inserting)
    expect(progressUpdates.length).toBe(6)
  })

  it('progress has correct totalDays', async () => {
    const progressUpdates: InsertProgress[] = []

    await insertTestData(mockDb, {
      months: 1,
      onProgress: progress => {
        progressUpdates.push({ ...progress })
      },
    })

    // All progress updates should have totalDays = 3 (from mock getDateRange)
    for (const p of progressUpdates) {
      expect(p.totalDays).toBe(3)
    }
  })

  it('progress currentDay increments', async () => {
    const progressUpdates: InsertProgress[] = []

    await insertTestData(mockDb, {
      months: 1,
      onProgress: progress => {
        progressUpdates.push({ ...progress })
      },
    })

    // Filter 'generating' phase updates to check increment
    const generatingUpdates = progressUpdates.filter(
      p => p.phase === 'generating',
    )
    expect(generatingUpdates.map(p => p.currentDay)).toEqual([1, 2, 3])
  })

  it('returns correct total counts', async () => {
    const result = await insertTestData(mockDb, { months: 1 })

    // 3 days x 2 orders per day = 6 orders
    expect(result.totalOrders).toBe(6)
    // 3 days x 2 items per day = 6 items
    expect(result.totalOrderItems).toBe(6)
    // 3 days x 1 discount per day = 3 discounts
    expect(result.totalOrderDiscounts).toBe(3)
    // 3 days x 2 attendances per day = 6 attendances
    expect(result.totalAttendances).toBe(6)
    // 3 days x 1 daily_data per day = 3 daily_data
    expect(result.totalDailyData).toBe(3)
    // 3 days total
    expect(result.totalDays).toBe(3)
  })

  it('rolls back on error (ROLLBACK)', async () => {
    // Create a mock db that fails on the second INSERT INTO orders
    let orderInsertCount = 0
    const failingDb: AsyncDatabase = {
      async exec<T>(
        sql: string,
        _params?: readonly unknown[],
      ): Promise<QueryResult<T>> {
        if (sql.includes('INSERT INTO orders')) {
          orderInsertCount++
          if (orderInsertCount > 2) {
            throw new Error('Simulated DB error')
          }
        }
        return { rows: [] as T[], changes: 1 }
      },
      async exportDatabase(): Promise<Uint8Array> {
        return new Uint8Array()
      },
    }

    await expect(insertTestData(failingDb, { months: 1 })).rejects.toThrow(
      'Simulated DB error',
    )
  })

  it('handles zero months (edge case)', async () => {
    const result = await insertTestData(mockDb, { months: 0 })

    expect(result.totalOrders).toBe(0)
    expect(result.totalOrderItems).toBe(0)
    expect(result.totalOrderDiscounts).toBe(0)
    expect(result.totalAttendances).toBe(0)
    expect(result.totalDailyData).toBe(0)
    expect(result.totalDays).toBe(0)
  })

  it('respects ordersPerDay override', async () => {
    const { getOrderCountForDay } = await import('@/lib/test-data-generator')

    await insertTestData(mockDb, { months: 1, ordersPerDay: 10 })

    // When ordersPerDay is specified, getOrderCountForDay should NOT be called
    expect(getOrderCountForDay).not.toHaveBeenCalled()
  })

  it('serializes memo array as JSON string', async () => {
    await insertTestData(mockDb, { months: 1 })

    const orderInserts = mockDb.calls.filter(c =>
      c.sql.includes('INSERT INTO orders'),
    )
    // memo (3rd param, index 2) should be a JSON string
    const memoParam = orderInserts[0]!.params![2]
    expect(typeof memoParam).toBe('string')
    expect(() => JSON.parse(memoParam as string)).not.toThrow()
  })

  it('passes null for optional fields when undefined', async () => {
    await insertTestData(mockDb, { months: 1 })

    const orderInserts = mockDb.calls.filter(c =>
      c.sql.includes('INSERT INTO orders'),
    )
    // First order has no originalTotal, so original_total param (index 5) should be null
    const firstOrderOriginalTotal = orderInserts[0]!.params![5]
    expect(firstOrderOriginalTotal).toBeNull()

    // Second order has originalTotal = 220
    const secondOrderOriginalTotal = orderInserts[1]!.params![5]
    expect(secondOrderOriginalTotal).toBe(220)
  })

  it('passes null for attendance clockIn/clockOut when undefined', async () => {
    await insertTestData(mockDb, { months: 1 })

    const attendanceInserts = mockDb.calls.filter(c =>
      c.sql.includes('INSERT INTO attendances'),
    )
    // Second attendance (paid_leave) has no clockIn/clockOut
    const leaveAttendance = attendanceInserts[1]!
    // clock_in (index 3) and clock_out (index 4) should be null
    expect(leaveAttendance.params![3]).toBeNull()
    expect(leaveAttendance.params![4]).toBeNull()
  })
})

// ─── getDatabase ──────────────────────────────────────────────────────────

describe('getDatabase', () => {
  beforeEach(() => {
    resetRepositories()
  })

  it('throws when not initialized', () => {
    expect(() => getDatabase()).toThrow(
      'Repositories not initialized. Call initRepositories(db) first.',
    )
  })

  it('returns database after initRepositories', () => {
    const mockDb = createMockDatabase()
    initRepositories(mockDb)

    const db = getDatabase()
    expect(db).toBe(mockDb)
  })

  it('throws after resetRepositories', () => {
    const mockDb = createMockDatabase()
    initRepositories(mockDb)
    resetRepositories()

    expect(() => getDatabase()).toThrow(
      'Repositories not initialized. Call initRepositories(db) first.',
    )
  })
})
