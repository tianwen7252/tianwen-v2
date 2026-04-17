/**
 * Tests for useProductChartData hook.
 * Verifies parallel data fetching for all product chart data states.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { StatisticsRepository } from '@/lib/repositories/statistics-repository'

// ─── Mock provider to prevent real DB access ──────────────────────────────────

vi.mock('@/lib/repositories/provider', () => ({
  getCommodityRepo: () => ({
    findOnMarket: () =>
      Promise.resolve([
        { id: 'c1', name: 'Bento A' },
        { id: 'c2', name: 'Bento B' },
      ]),
  }),
  getCommodityTypeRepo: () => ({
    findAll: () =>
      Promise.resolve([
        {
          id: '1',
          typeId: 'bento',
          type: 'bento',
          label: 'Bento',
          color: '#f00',
          createdAt: 0,
          updatedAt: 0,
        },
        {
          id: '2',
          typeId: 'drink',
          type: 'drink',
          label: 'Drinks',
          color: '#0f0',
          createdAt: 0,
          updatedAt: 0,
        },
      ]),
  }),
}))

import { useProductChartData } from './use-product-chart-data'

// ─── Mock repo factory ───────────────────────────────────────────────────────

function createMockRepo(
  overrides?: Partial<StatisticsRepository>,
): StatisticsRepository {
  return {
    getProductKpis: vi.fn().mockResolvedValue({
      totalRevenue: 10000,
      orderCount: 50,
      stallRevenue: 1000,
      morningRevenue: 3000,
      afternoonRevenue: 6000,
      totalQuantity: 200,
    }),
    getHourlyOrderDistribution: vi.fn().mockResolvedValue([
      { hour: 8, count: 5 },
      { hour: 12, count: 15 },
    ]),
    getTopProducts: vi
      .fn()
      .mockResolvedValue([
        { comId: 'c1', name: 'Bento A', quantity: 50, revenue: 5000 },
      ]),
    getBottomBentos: vi
      .fn()
      .mockResolvedValue([
        { comId: 'c2', name: 'Bento B', quantity: 2, revenue: 200 },
      ]),
    getDailyRevenue: vi
      .fn()
      .mockResolvedValue([{ date: '2026-03-01', revenue: 3000 }]),
    getAvgOrderValue: vi
      .fn()
      .mockResolvedValue([{ date: '2026-03-01', revenue: 200 }]),
    getProductDailyRevenue: vi
      .fn()
      .mockResolvedValue([{ date: '2026-03-01', revenue: 10 }]),
    getStaffKpis: vi.fn().mockResolvedValue({
      activeEmployeeCount: 5,
      totalAttendanceDays: 20,
      avgMonthlyHours: 160,
      leaveCount: 2,
    }),
    getEmployeeHours: vi.fn().mockResolvedValue([]),
    getDailyHeadcount: vi.fn().mockResolvedValue([]),
    getDailyAttendeeList: vi.fn().mockResolvedValue([]),
    getAmPmRevenue: vi
      .fn()
      .mockResolvedValue([
        { date: '2026-03-01', amRevenue: 1500, pmRevenue: 2500 },
      ]),
    getCategorySales: vi.fn().mockResolvedValue([
      {
        date: '2026-03-01',
        commodityId: 'c1',
        commodityName: 'Bento A',
        quantity: 10,
        revenue: 1000,
      },
    ]),
    getOrderNotesDistribution: vi
      .fn()
      .mockResolvedValue([{ note: 'extra rice', count: 5 }]),
    getDeliveryProductBreakdown: vi.fn().mockResolvedValue([
      {
        commodityId: 'c1',
        commodityName: 'Bento A',
        quantity: 8,
        revenue: 800,
      },
    ]),
    ...overrides,
  }
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const start = new Date('2026-03-01T00:00:00')
const end = new Date('2026-03-31T23:59:59')

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useProductChartData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches KPIs on mount', async () => {
    const repo = createMockRepo()
    const { result } = renderHook(() =>
      useProductChartData({
        startDate: start,
        endDate: end,
        statisticsRepo: repo,
      }),
    )

    await waitFor(() => {
      expect(result.current.kpis).not.toBeNull()
    })
    expect(result.current.kpis?.totalRevenue).toBe(10000)
  })

  it('fetches AM/PM revenue data', async () => {
    const repo = createMockRepo()
    const { result } = renderHook(() =>
      useProductChartData({
        startDate: start,
        endDate: end,
        statisticsRepo: repo,
      }),
    )

    await waitFor(() => {
      expect(result.current.amPmRevenue.length).toBeGreaterThan(0)
    })
    expect(result.current.amPmRevenue[0]?.amRevenue).toBe(1500)
  })

  it('fetches order notes distribution', async () => {
    const repo = createMockRepo()
    const { result } = renderHook(() =>
      useProductChartData({
        startDate: start,
        endDate: end,
        statisticsRepo: repo,
      }),
    )

    await waitFor(() => {
      expect(result.current.orderNotes.length).toBeGreaterThan(0)
    })
    expect(result.current.orderNotes[0]?.note).toBe('extra rice')
  })

  it('fetches delivery product breakdown', async () => {
    const repo = createMockRepo()
    const { result } = renderHook(() =>
      useProductChartData({
        startDate: start,
        endDate: end,
        statisticsRepo: repo,
      }),
    )

    await waitFor(() => {
      expect(result.current.deliveryProducts.length).toBeGreaterThan(0)
    })
    expect(result.current.deliveryProducts[0]?.commodityName).toBe('Bento A')
  })

  it('fetches category sales per commodity type', async () => {
    const repo = createMockRepo()
    const { result } = renderHook(() =>
      useProductChartData({
        startDate: start,
        endDate: end,
        statisticsRepo: repo,
      }),
    )

    // Wait for commodity types to load (they trigger category sales fetch)
    await waitFor(() => {
      expect(result.current.commodityTypes.length).toBeGreaterThan(0)
    })

    // Then wait for category sales to be populated
    await waitFor(() => {
      expect(
        Object.keys(result.current.categorySalesData).length,
      ).toBeGreaterThan(0)
    })
  })

  it('loads commodity types for category sales titles', async () => {
    const repo = createMockRepo()
    const { result } = renderHook(() =>
      useProductChartData({
        startDate: start,
        endDate: end,
        statisticsRepo: repo,
      }),
    )

    await waitFor(() => {
      expect(result.current.commodityTypes.length).toBe(2)
    })
    expect(result.current.commodityTypes[0]?.label).toBe('Bento')
  })

  it('sets error on fetch failure', async () => {
    const repo = createMockRepo({
      getProductKpis: vi.fn().mockRejectedValue(new Error('DB offline')),
    })
    const { result } = renderHook(() =>
      useProductChartData({
        startDate: start,
        endDate: end,
        statisticsRepo: repo,
      }),
    )

    await waitFor(() => {
      expect(result.current.error).toBe('DB offline')
    })
  })

  it('exposes sortBy and onSortChange for top products', async () => {
    const repo = createMockRepo()
    const { result } = renderHook(() =>
      useProductChartData({
        startDate: start,
        endDate: end,
        statisticsRepo: repo,
      }),
    )

    expect(result.current.sortBy).toBe('quantity')
    expect(typeof result.current.onSortChange).toBe('function')
  })

  it('exposes commodity selection for product trend', async () => {
    const repo = createMockRepo()
    const { result } = renderHook(() =>
      useProductChartData({
        startDate: start,
        endDate: end,
        statisticsRepo: repo,
      }),
    )

    expect(typeof result.current.selectedCommodityId).toBe('string')
    expect(typeof result.current.onSelectCommodityChange).toBe('function')
  })
})
