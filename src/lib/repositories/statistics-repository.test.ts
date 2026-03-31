/**
 * Tests for StatisticsRepository.
 * Uses a mock AsyncDatabase since SQLite WASM cannot run in Node/Vitest.
 * Focuses on correct SQL call patterns and return value mapping.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AsyncDatabase } from '@/lib/worker-database'
import { createStatisticsRepository } from './statistics-repository'
import type { DateRange } from './statistics-repository'

// ─── Mock DB factory ─────────────────────────────────────────────────────────

function createMockDb(): AsyncDatabase {
  return {
    exec: vi.fn(async () => ({ rows: [], changes: 0 })),
    exportDatabase: vi.fn(async () => new Uint8Array()),
  }
}

// ─── Test fixtures ────────────────────────────────────────────────────────────

const range: DateRange = {
  startDate: new Date('2026-03-01').getTime(),
  endDate: new Date('2026-03-31T23:59:59.999').getTime(),
}

// ─── getProductKpis ──────────────────────────────────────────────────────────

describe('StatisticsRepository.getProductKpis()', () => {
  let db: AsyncDatabase

  beforeEach(() => {
    db = createMockDb()
  })

  it('returns zero values when DB returns no rows', async () => {
    const repo = createStatisticsRepository(db)
    const result = await repo.getProductKpis(range)
    expect(result).toEqual({
      totalRevenue: 0,
      orderCount: 0,
      morningRevenue: 0,
      afternoonRevenue: 0,
      totalQuantity: 0,
      bentoQuantity: 0,
    })
  })

  it('maps DB row to ProductKpis correctly', async () => {
    vi.mocked(db.exec).mockResolvedValueOnce({
      rows: [
        {
          total_revenue: 15000,
          order_count: 25,
          morning_revenue: 8000,
          afternoon_revenue: 7000,
          total_quantity: 80,
          bento_quantity: 50,
        },
      ],
      changes: 0,
    })

    const repo = createStatisticsRepository(db)
    const result = await repo.getProductKpis(range)
    expect(result).toEqual({
      totalRevenue: 15000,
      orderCount: 25,
      morningRevenue: 8000,
      afternoonRevenue: 7000,
      totalQuantity: 80,
      bentoQuantity: 50,
    })
  })

  it('calls db.exec with startDate and endDate params', async () => {
    const repo = createStatisticsRepository(db)
    await repo.getProductKpis(range)
    const [, params] = vi.mocked(db.exec).mock.calls[0]!
    expect(params).toContain(range.startDate)
    expect(params).toContain(range.endDate)
  })
})

// ─── getHourlyOrderDistribution ──────────────────────────────────────────────

describe('StatisticsRepository.getHourlyOrderDistribution()', () => {
  let db: AsyncDatabase

  beforeEach(() => {
    db = createMockDb()
  })

  it('returns exactly 24 buckets even when DB returns empty', async () => {
    const repo = createStatisticsRepository(db)
    const result = await repo.getHourlyOrderDistribution(range)
    expect(result).toHaveLength(24)
  })

  it('buckets are ordered 0–23', async () => {
    const repo = createStatisticsRepository(db)
    const result = await repo.getHourlyOrderDistribution(range)
    result.forEach((b, i) => expect(b.hour).toBe(i))
  })

  it('fills missing hours with count 0', async () => {
    vi.mocked(db.exec).mockResolvedValueOnce({
      rows: [
        { hour: 9, count: 15 },
        { hour: 14, count: 30 },
      ],
      changes: 0,
    })
    const repo = createStatisticsRepository(db)
    const result = await repo.getHourlyOrderDistribution(range)
    expect(result[0]!.count).toBe(0)
    expect(result[9]!.count).toBe(15)
    expect(result[14]!.count).toBe(30)
    expect(result[23]!.count).toBe(0)
  })

  it('passes date range params to db.exec', async () => {
    const repo = createStatisticsRepository(db)
    await repo.getHourlyOrderDistribution(range)
    const [, params] = vi.mocked(db.exec).mock.calls[0]!
    expect(params).toContain(range.startDate)
    expect(params).toContain(range.endDate)
  })
})

// ─── getTopProducts ───────────────────────────────────────────────────────────

describe('StatisticsRepository.getTopProducts()', () => {
  let db: AsyncDatabase

  beforeEach(() => {
    db = createMockDb()
  })

  it('returns empty array when DB returns no rows', async () => {
    const repo = createStatisticsRepository(db)
    const result = await repo.getTopProducts(range, 5, 'quantity')
    expect(result).toEqual([])
  })

  it('maps DB rows to ProductRanking correctly', async () => {
    vi.mocked(db.exec).mockResolvedValueOnce({
      rows: [
        {
          commodity_id: 'com-1',
          name: '招牌便當',
          quantity: 30,
          revenue: 4500,
        },
        {
          commodity_id: 'com-2',
          name: '排骨便當',
          quantity: 25,
          revenue: 3750,
        },
      ],
      changes: 0,
    })
    const repo = createStatisticsRepository(db)
    const result = await repo.getTopProducts(range, 5, 'quantity')
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      comId: 'com-1',
      name: '招牌便當',
      quantity: 30,
      revenue: 4500,
    })
    expect(result[1]).toEqual({
      comId: 'com-2',
      name: '排骨便當',
      quantity: 25,
      revenue: 3750,
    })
  })

  it('passes the limit param to db.exec', async () => {
    const repo = createStatisticsRepository(db)
    await repo.getTopProducts(range, 10, 'revenue')
    const [, params] = vi.mocked(db.exec).mock.calls[0]!
    expect(params).toContain(10)
  })
})

// ─── getBottomBentos ──────────────────────────────────────────────────────────

describe('StatisticsRepository.getBottomBentos()', () => {
  let db: AsyncDatabase

  beforeEach(() => {
    db = createMockDb()
  })

  it('returns empty array when no rows', async () => {
    const repo = createStatisticsRepository(db)
    const result = await repo.getBottomBentos(range, 5)
    expect(result).toEqual([])
  })

  it('maps rows correctly', async () => {
    vi.mocked(db.exec).mockResolvedValueOnce({
      rows: [
        { commodity_id: 'com-5', name: '素食便當', quantity: 1, revenue: 150 },
      ],
      changes: 0,
    })
    const repo = createStatisticsRepository(db)
    const result = await repo.getBottomBentos(range, 5)
    expect(result[0]).toEqual({
      comId: 'com-5',
      name: '素食便當',
      quantity: 1,
      revenue: 150,
    })
  })
})

// ─── getDailyRevenue ──────────────────────────────────────────────────────────

describe('StatisticsRepository.getDailyRevenue()', () => {
  let db: AsyncDatabase

  beforeEach(() => {
    db = createMockDb()
  })

  it('returns empty array when no rows', async () => {
    const repo = createStatisticsRepository(db)
    const result = await repo.getDailyRevenue(range)
    expect(result).toEqual([])
  })

  it('maps DB rows to DailyRevenue correctly', async () => {
    vi.mocked(db.exec).mockResolvedValueOnce({
      rows: [
        { date: '2026-03-01', revenue: 3500 },
        { date: '2026-03-02', revenue: 4200 },
      ],
      changes: 0,
    })
    const repo = createStatisticsRepository(db)
    const result = await repo.getDailyRevenue(range)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ date: '2026-03-01', revenue: 3500 })
    expect(result[1]).toEqual({ date: '2026-03-02', revenue: 4200 })
  })
})

// ─── getAvgOrderValue ─────────────────────────────────────────────────────────

describe('StatisticsRepository.getAvgOrderValue()', () => {
  let db: AsyncDatabase

  beforeEach(() => {
    db = createMockDb()
  })

  it('returns empty array when no rows', async () => {
    const repo = createStatisticsRepository(db)
    const result = await repo.getAvgOrderValue(range)
    expect(result).toEqual([])
  })

  it('maps DB rows to DailyRevenue (revenue = avg per day)', async () => {
    vi.mocked(db.exec).mockResolvedValueOnce({
      rows: [{ date: '2026-03-01', revenue: 140 }],
      changes: 0,
    })
    const repo = createStatisticsRepository(db)
    const result = await repo.getAvgOrderValue(range)
    expect(result[0]).toEqual({ date: '2026-03-01', revenue: 140 })
  })
})

// ─── getStaffKpis ─────────────────────────────────────────────────────────────

describe('StatisticsRepository.getStaffKpis()', () => {
  let db: AsyncDatabase

  beforeEach(() => {
    db = createMockDb()
  })

  it('returns zero values when DB returns empty', async () => {
    const repo = createStatisticsRepository(db)
    const result = await repo.getStaffKpis(range)
    expect(result).toEqual({
      activeEmployeeCount: 0,
      totalAttendanceDays: 0,
      avgMonthlyHours: 0,
      leaveCount: 0,
    })
  })

  it('maps DB rows to StaffKpis correctly', async () => {
    vi.mocked(db.exec)
      // First call: employee count
      .mockResolvedValueOnce({ rows: [{ count: 8 }], changes: 0 })
      // Second call: attendance days
      .mockResolvedValueOnce({ rows: [{ count: 22 }], changes: 0 })
      // Third call: avg hours
      .mockResolvedValueOnce({ rows: [{ avg_hours: 7.5 }], changes: 0 })
      // Fourth call: leave count
      .mockResolvedValueOnce({ rows: [{ count: 3 }], changes: 0 })

    const repo = createStatisticsRepository(db)
    const result = await repo.getStaffKpis(range)
    expect(result.activeEmployeeCount).toBe(8)
    expect(result.totalAttendanceDays).toBe(22)
    expect(result.avgMonthlyHours).toBe(7.5)
    expect(result.leaveCount).toBe(3)
  })
})

// ─── getEmployeeHours ─────────────────────────────────────────────────────────

describe('StatisticsRepository.getEmployeeHours()', () => {
  let db: AsyncDatabase

  beforeEach(() => {
    db = createMockDb()
  })

  it('returns empty array when no rows', async () => {
    const repo = createStatisticsRepository(db)
    const result = await repo.getEmployeeHours(range)
    expect(result).toEqual([])
  })

  it('maps DB rows to EmployeeHours correctly', async () => {
    vi.mocked(db.exec).mockResolvedValueOnce({
      rows: [
        {
          employee_id: 'emp-001',
          employee_name: 'Alice',
          regular: 160,
          paid_leave: 8,
          sick_leave: 0,
          personal_leave: 4,
          absent: 0,
        },
      ],
      changes: 0,
    })
    const repo = createStatisticsRepository(db)
    const result = await repo.getEmployeeHours(range)
    expect(result[0]).toEqual({
      employeeId: 'emp-001',
      employeeName: 'Alice',
      regular: 160,
      paidLeave: 8,
      sickLeave: 0,
      personalLeave: 4,
      absent: 0,
    })
  })
})

// ─── getDailyHeadcount ────────────────────────────────────────────────────────

describe('StatisticsRepository.getDailyHeadcount()', () => {
  let db: AsyncDatabase

  beforeEach(() => {
    db = createMockDb()
  })

  it('returns empty array when no rows', async () => {
    const repo = createStatisticsRepository(db)
    const result = await repo.getDailyHeadcount(range)
    expect(result).toEqual([])
  })

  it('maps DB rows to DailyHeadcount correctly', async () => {
    vi.mocked(db.exec).mockResolvedValueOnce({
      rows: [
        { date: '2026-03-01', count: 5 },
        { date: '2026-03-02', count: 4 },
      ],
      changes: 0,
    })
    const repo = createStatisticsRepository(db)
    const result = await repo.getDailyHeadcount(range)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ date: '2026-03-01', count: 5 })
    expect(result[1]).toEqual({ date: '2026-03-02', count: 4 })
  })
})

// ─── getDailyAttendeeList ─────────────────────────────────────────────────────

describe('StatisticsRepository.getDailyAttendeeList()', () => {
  let db: AsyncDatabase

  beforeEach(() => {
    db = createMockDb()
  })

  it('returns empty array when no rows', async () => {
    const repo = createStatisticsRepository(db)
    const result = await repo.getDailyAttendeeList('2026-03-01')
    expect(result).toEqual([])
  })

  it('returns employee names for the given date', async () => {
    vi.mocked(db.exec).mockResolvedValueOnce({
      rows: [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }],
      changes: 0,
    })
    const repo = createStatisticsRepository(db)
    const result = await repo.getDailyAttendeeList('2026-03-01')
    expect(result).toEqual(['Alice', 'Bob', 'Charlie'])
  })

  it('passes the date string to db.exec', async () => {
    const repo = createStatisticsRepository(db)
    await repo.getDailyAttendeeList('2026-03-15')
    const [, params] = vi.mocked(db.exec).mock.calls[0]!
    expect(params).toContain('2026-03-15')
  })
})

// ─── getProductDailyRevenue ───────────────────────────────────────────────────

describe('StatisticsRepository.getProductDailyRevenue()', () => {
  let db: AsyncDatabase

  beforeEach(() => {
    db = createMockDb()
  })

  it('returns empty array when DB returns no rows', async () => {
    const repo = createStatisticsRepository(db)
    const result = await repo.getProductDailyRevenue(range, 'com-001')
    expect(result).toEqual([])
  })

  it('maps DB rows to DailyRevenue with quantity as revenue field', async () => {
    vi.mocked(db.exec).mockResolvedValueOnce({
      rows: [
        { date: '2026-03-01', revenue: 10 },
        { date: '2026-03-02', revenue: 15 },
      ],
      changes: 0,
    })
    const repo = createStatisticsRepository(db)
    const result = await repo.getProductDailyRevenue(range, 'com-001')
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ date: '2026-03-01', revenue: 10 })
    expect(result[1]).toEqual({ date: '2026-03-02', revenue: 15 })
  })

  it('passes startDate, endDate, and commodityId to db.exec', async () => {
    const repo = createStatisticsRepository(db)
    await repo.getProductDailyRevenue(range, 'com-abc')
    const [, params] = vi.mocked(db.exec).mock.calls[0]!
    expect(params).toContain(range.startDate)
    expect(params).toContain(range.endDate)
    expect(params).toContain('com-abc')
  })

  it('returns results ordered by date ascending', async () => {
    vi.mocked(db.exec).mockResolvedValueOnce({
      rows: [
        { date: '2026-03-01', revenue: 5 },
        { date: '2026-03-05', revenue: 12 },
        { date: '2026-03-10', revenue: 8 },
      ],
      changes: 0,
    })
    const repo = createStatisticsRepository(db)
    const result = await repo.getProductDailyRevenue(range, 'com-001')
    expect(result[0]!.date).toBe('2026-03-01')
    expect(result[2]!.date).toBe('2026-03-10')
  })

  it('handles different commodityId values independently', async () => {
    const repo = createStatisticsRepository(db)
    await repo.getProductDailyRevenue(range, 'com-999')
    const [, params] = vi.mocked(db.exec).mock.calls[0]!
    expect(params).toContain('com-999')
  })
})

// ─── getAmPmRevenue ─────────────────────────────────────────────────────────

describe('StatisticsRepository.getAmPmRevenue()', () => {
  let db: AsyncDatabase

  beforeEach(() => {
    db = createMockDb()
  })

  it('returns empty array when DB returns no rows', async () => {
    const repo = createStatisticsRepository(db)
    const result = await repo.getAmPmRevenue(range)
    expect(result).toEqual([])
  })

  it('maps DB rows to AmPmRevenueRow correctly', async () => {
    vi.mocked(db.exec).mockResolvedValueOnce({
      rows: [
        { date: '2026-03-01', am_revenue: 5000, pm_revenue: 8000 },
        { date: '2026-03-02', am_revenue: 4500, pm_revenue: 7500 },
      ],
      changes: 0,
    })
    const repo = createStatisticsRepository(db)
    const result = await repo.getAmPmRevenue(range)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      date: '2026-03-01',
      amRevenue: 5000,
      pmRevenue: 8000,
    })
    expect(result[1]).toEqual({
      date: '2026-03-02',
      amRevenue: 4500,
      pmRevenue: 7500,
    })
  })

  it('passes startDate and endDate params to db.exec', async () => {
    const repo = createStatisticsRepository(db)
    await repo.getAmPmRevenue(range)
    const [, params] = vi.mocked(db.exec).mock.calls[0]!
    expect(params).toContain(range.startDate)
    expect(params).toContain(range.endDate)
  })

  it('SQL contains GROUP BY and CASE WHEN for AM/PM split', async () => {
    const repo = createStatisticsRepository(db)
    await repo.getAmPmRevenue(range)
    const [sql] = vi.mocked(db.exec).mock.calls[0]!
    expect(sql).toContain('GROUP BY')
    expect(sql).toContain('CASE WHEN')
    expect(sql).toContain('< 12')
    expect(sql).toContain('>= 12')
  })

  it('defaults to zero when am_revenue or pm_revenue is null', async () => {
    vi.mocked(db.exec).mockResolvedValueOnce({
      rows: [{ date: '2026-03-01', am_revenue: null, pm_revenue: null }],
      changes: 0,
    })
    const repo = createStatisticsRepository(db)
    const result = await repo.getAmPmRevenue(range)
    expect(result[0]).toEqual({
      date: '2026-03-01',
      amRevenue: 0,
      pmRevenue: 0,
    })
  })
})

// ─── getCategorySales ────────────────────────────────────────────────────────

describe('StatisticsRepository.getCategorySales()', () => {
  let db: AsyncDatabase

  beforeEach(() => {
    db = createMockDb()
  })

  it('returns empty array when DB returns no rows', async () => {
    const repo = createStatisticsRepository(db)
    const result = await repo.getCategorySales(range, 'type-001')
    expect(result).toEqual([])
  })

  it('maps DB rows to CategorySalesRow correctly', async () => {
    vi.mocked(db.exec).mockResolvedValueOnce({
      rows: [
        {
          date: '2026-03-01',
          commodity_id: 'com-1',
          commodity_name: '招牌便當',
          quantity: 10,
          revenue: 1500,
        },
        {
          date: '2026-03-01',
          commodity_id: 'com-2',
          commodity_name: '排骨便當',
          quantity: 8,
          revenue: 1200,
        },
      ],
      changes: 0,
    })
    const repo = createStatisticsRepository(db)
    const result = await repo.getCategorySales(range, 'type-001')
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      date: '2026-03-01',
      commodityId: 'com-1',
      commodityName: '招牌便當',
      quantity: 10,
      revenue: 1500,
    })
    expect(result[1]).toEqual({
      date: '2026-03-01',
      commodityId: 'com-2',
      commodityName: '排骨便當',
      quantity: 8,
      revenue: 1200,
    })
  })

  it('passes startDate, endDate, and typeId params to db.exec', async () => {
    const repo = createStatisticsRepository(db)
    await repo.getCategorySales(range, 'type-abc')
    const [, params] = vi.mocked(db.exec).mock.calls[0]!
    expect(params).toContain(range.startDate)
    expect(params).toContain(range.endDate)
    expect(params).toContain('type-abc')
  })

  it('defaults to zero when quantity or revenue is null', async () => {
    vi.mocked(db.exec).mockResolvedValueOnce({
      rows: [
        {
          date: '2026-03-01',
          commodity_id: 'com-1',
          commodity_name: 'Test',
          quantity: null,
          revenue: null,
        },
      ],
      changes: 0,
    })
    const repo = createStatisticsRepository(db)
    const result = await repo.getCategorySales(range, 'type-001')
    expect(result[0]).toEqual({
      date: '2026-03-01',
      commodityId: 'com-1',
      commodityName: 'Test',
      quantity: 0,
      revenue: 0,
    })
  })
})

// ─── getOrderNotesDistribution ──────────────────────────────────────────────

describe('StatisticsRepository.getOrderNotesDistribution()', () => {
  let db: AsyncDatabase

  beforeEach(() => {
    db = createMockDb()
  })

  it('returns empty array when DB returns no rows', async () => {
    const repo = createStatisticsRepository(db)
    const result = await repo.getOrderNotesDistribution(range)
    expect(result).toEqual([])
  })

  it('maps DB rows to OrderNoteCount correctly', async () => {
    vi.mocked(db.exec).mockResolvedValueOnce({
      rows: [
        { note: '攤位', count: 15 },
        { note: '外送', count: 8 },
      ],
      changes: 0,
    })
    const repo = createStatisticsRepository(db)
    const result = await repo.getOrderNotesDistribution(range)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ note: '攤位', count: 15 })
    expect(result[1]).toEqual({ note: '外送', count: 8 })
  })

  it('passes startDate and endDate params to db.exec', async () => {
    const repo = createStatisticsRepository(db)
    await repo.getOrderNotesDistribution(range)
    const [, params] = vi.mocked(db.exec).mock.calls[0]!
    expect(params).toContain(range.startDate)
    expect(params).toContain(range.endDate)
  })

  it('SQL contains json_each for memo parsing', async () => {
    const repo = createStatisticsRepository(db)
    await repo.getOrderNotesDistribution(range)
    const [sql] = vi.mocked(db.exec).mock.calls[0]!
    expect(sql).toContain('json_each')
  })

  it('defaults to zero when count is null', async () => {
    vi.mocked(db.exec).mockResolvedValueOnce({
      rows: [{ note: '攤位', count: null }],
      changes: 0,
    })
    const repo = createStatisticsRepository(db)
    const result = await repo.getOrderNotesDistribution(range)
    expect(result[0]).toEqual({ note: '攤位', count: 0 })
  })
})

// ─── getDeliveryProductBreakdown ──────────────────────────────────────────────

describe('StatisticsRepository.getDeliveryProductBreakdown()', () => {
  let db: AsyncDatabase

  beforeEach(() => {
    db = createMockDb()
  })

  it('returns empty array when DB returns no rows', async () => {
    const repo = createStatisticsRepository(db)
    const result = await repo.getDeliveryProductBreakdown(range)
    expect(result).toEqual([])
  })

  it('maps DB rows to DeliveryProductRow correctly', async () => {
    vi.mocked(db.exec).mockResolvedValueOnce({
      rows: [
        {
          commodity_id: 'com-1',
          commodity_name: '招牌便當',
          quantity: 20,
          revenue: 3000,
        },
        {
          commodity_id: 'com-2',
          commodity_name: '排骨便當',
          quantity: 15,
          revenue: 2250,
        },
      ],
      changes: 0,
    })
    const repo = createStatisticsRepository(db)
    const result = await repo.getDeliveryProductBreakdown(range)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      commodityId: 'com-1',
      commodityName: '招牌便當',
      quantity: 20,
      revenue: 3000,
    })
    expect(result[1]).toEqual({
      commodityId: 'com-2',
      commodityName: '排骨便當',
      quantity: 15,
      revenue: 2250,
    })
  })

  it('passes startDate, endDate, and default memoTag "外送" to db.exec', async () => {
    const repo = createStatisticsRepository(db)
    await repo.getDeliveryProductBreakdown(range)
    const [, params] = vi.mocked(db.exec).mock.calls[0]!
    expect(params).toContain(range.startDate)
    expect(params).toContain(range.endDate)
    expect(params).toContain('外送')
  })

  it('SQL contains json_each and EXISTS for memo filtering', async () => {
    const repo = createStatisticsRepository(db)
    await repo.getDeliveryProductBreakdown(range)
    const [sql] = vi.mocked(db.exec).mock.calls[0]!
    expect(sql).toContain('json_each')
    expect(sql).toContain('EXISTS')
  })

  it('uses custom memoTag when provided', async () => {
    const repo = createStatisticsRepository(db)
    await repo.getDeliveryProductBreakdown(range, '攤位')
    const [, params] = vi.mocked(db.exec).mock.calls[0]!
    expect(params).toContain('攤位')
    expect(params).not.toContain('外送')
  })

  it('defaults to zero when quantity or revenue is null', async () => {
    vi.mocked(db.exec).mockResolvedValueOnce({
      rows: [
        {
          commodity_id: 'com-1',
          commodity_name: 'Test',
          quantity: null,
          revenue: null,
        },
      ],
      changes: 0,
    })
    const repo = createStatisticsRepository(db)
    const result = await repo.getDeliveryProductBreakdown(range)
    expect(result[0]).toEqual({
      commodityId: 'com-1',
      commodityName: 'Test',
      quantity: 0,
      revenue: 0,
    })
  })
})
