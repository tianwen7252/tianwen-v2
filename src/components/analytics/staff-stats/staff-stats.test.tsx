/**
 * Tests for the StaffStats section component.
 * Verifies data fetching, sub-component rendering, error state, and cleanup.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import type {
  StatisticsRepository,
  StaffKpis,
  EmployeeHours,
} from '@/lib/repositories/statistics-repository'

// Mock recharts to avoid JSDOM SVG rendering issues (used by StaffHoursChart and DailyHeadcountChart)
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ dataKey }: { dataKey: string }) => (
    <div data-testid={`bar-${dataKey}`} />
  ),
  LineChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: ({ dataKey }: { dataKey: string }) => (
    <div data-testid={`line-${dataKey}`} />
  ),
  AreaChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: ({ dataKey }: { dataKey: string }) => (
    <div data-testid={`area-${dataKey}`} />
  ),
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LabelList: () => null,
  Cell: () => null,
}))

vi.mock('@/stores/app-store', () => ({
  useAppStore: () => ({ fontSize: 14 }),
}))

import { StaffStats } from './staff-stats'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SAMPLE_KPIS: StaffKpis = {
  activeEmployeeCount: 10,
  totalAttendanceDays: 200,
  avgMonthlyHours: 8.0,
  leaveCount: 5,
}

const SAMPLE_EMPLOYEE_HOURS: EmployeeHours[] = [
  {
    employeeId: 'emp-001',
    employeeName: '陳小明',
    regular: 20,
    paidLeave: 1,
    sickLeave: 0,
    personalLeave: 0,
    absent: 0,
  },
  {
    employeeId: 'emp-002',
    employeeName: '王大華',
    regular: 18,
    paidLeave: 0,
    sickLeave: 2,
    personalLeave: 0,
    absent: 0,
  },
]

function buildMockRepo(
  overrides?: Partial<StatisticsRepository>,
): StatisticsRepository {
  return {
    getProductKpis: vi.fn().mockResolvedValue({
      totalRevenue: 0,
      orderCount: 0,
      stallRevenue: 0,
      morningRevenue: 0,
      afternoonRevenue: 0,
      totalQuantity: 0,
    }),
    getHourlyOrderDistribution: vi.fn().mockResolvedValue([]),
    getTopProducts: vi.fn().mockResolvedValue([]),
    getBottomBentos: vi.fn().mockResolvedValue([]),
    getDailyRevenue: vi.fn().mockResolvedValue([]),
    getAvgOrderValue: vi.fn().mockResolvedValue([]),
    getProductDailyRevenue: vi.fn().mockResolvedValue([]),
    getStaffKpis: vi.fn().mockResolvedValue(SAMPLE_KPIS),
    getEmployeeHours: vi.fn().mockResolvedValue(SAMPLE_EMPLOYEE_HOURS),
    getDailyHeadcount: vi.fn().mockResolvedValue([]),
    getDailyAttendeeList: vi.fn().mockResolvedValue([]),
    getAmPmRevenue: vi.fn().mockResolvedValue([]),
    getCategorySales: vi.fn().mockResolvedValue([]),
    getOrderNotesDistribution: vi.fn().mockResolvedValue([]),
    getDeliveryProductBreakdown: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}

const START_DATE = new Date('2026-03-01')
const END_DATE = new Date('2026-03-31')

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('StaffStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('section structure', () => {
    it('renders aria-label "員工統計" section', async () => {
      const repo = buildMockRepo()
      render(
        <StaffStats
          startDate={START_DATE}
          endDate={END_DATE}
          statisticsRepo={repo}
        />,
      )
      expect(screen.getByRole('region', { name: '員工統計' })).toBeTruthy()
    })
  })

  describe('data fetching', () => {
    it('calls getStaffKpis with correct date range', async () => {
      const repo = buildMockRepo()
      render(
        <StaffStats
          startDate={START_DATE}
          endDate={END_DATE}
          statisticsRepo={repo}
        />,
      )

      await waitFor(() => {
        expect(repo.getStaffKpis).toHaveBeenCalledWith({
          startDate: START_DATE.getTime(),
          endDate: END_DATE.getTime(),
        })
      })
    })

    it('calls getEmployeeHours with correct date range', async () => {
      const repo = buildMockRepo()
      render(
        <StaffStats
          startDate={START_DATE}
          endDate={END_DATE}
          statisticsRepo={repo}
        />,
      )

      await waitFor(() => {
        expect(repo.getEmployeeHours).toHaveBeenCalledWith({
          startDate: START_DATE.getTime(),
          endDate: END_DATE.getTime(),
        })
      })
    })

    it('calls both getStaffKpis and getEmployeeHours (Promise.all)', async () => {
      const repo = buildMockRepo()
      render(
        <StaffStats
          startDate={START_DATE}
          endDate={END_DATE}
          statisticsRepo={repo}
        />,
      )

      await waitFor(() => {
        expect(repo.getStaffKpis).toHaveBeenCalledTimes(1)
        expect(repo.getEmployeeHours).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('sub-component rendering after load', () => {
    it('renders StaffKpiGrid after data loads (shows 在職員工數 title)', async () => {
      const repo = buildMockRepo()
      render(
        <StaffStats
          startDate={START_DATE}
          endDate={END_DATE}
          statisticsRepo={repo}
        />,
      )

      await waitFor(() => {
        expect(screen.getByText('在職員工數')).toBeTruthy()
      })
    })

    it('renders StaffHoursChart after data loads (shows card title)', async () => {
      const repo = buildMockRepo()
      render(
        <StaffStats
          startDate={START_DATE}
          endDate={END_DATE}
          statisticsRepo={repo}
        />,
      )

      await waitFor(() => {
        expect(screen.getByText('員工工時排行')).toBeTruthy()
        expect(screen.getByTestId('bar-chart')).toBeTruthy()
      })
    })

    it('renders KPI values via data-testid after load', async () => {
      const repo = buildMockRepo()
      render(
        <StaffStats
          startDate={START_DATE}
          endDate={END_DATE}
          statisticsRepo={repo}
        />,
      )

      await waitFor(() => {
        expect(screen.getByTestId('kpi-activeEmployeeCount')).toBeTruthy()
        expect(screen.getByTestId('kpi-totalAttendanceDays')).toBeTruthy()
        expect(screen.getByTestId('kpi-avgMonthlyHours')).toBeTruthy()
        expect(screen.getByTestId('kpi-leaveCount')).toBeTruthy()
      })
    })
  })

  describe('error state', () => {
    it('shows error message when getStaffKpis rejects', async () => {
      const repo = buildMockRepo({
        getStaffKpis: vi.fn().mockRejectedValue(new Error('KPI 載入失敗')),
      })
      render(
        <StaffStats
          startDate={START_DATE}
          endDate={END_DATE}
          statisticsRepo={repo}
        />,
      )

      await waitFor(() => {
        expect(screen.getByText('KPI 載入失敗')).toBeTruthy()
      })
    })

    it('shows error message when getEmployeeHours rejects', async () => {
      const repo = buildMockRepo({
        getEmployeeHours: vi.fn().mockRejectedValue(new Error('工時載入失敗')),
      })
      render(
        <StaffStats
          startDate={START_DATE}
          endDate={END_DATE}
          statisticsRepo={repo}
        />,
      )

      await waitFor(() => {
        expect(screen.getByText('工時載入失敗')).toBeTruthy()
      })
    })

    it('shows fallback message for non-Error rejections', async () => {
      const repo = buildMockRepo({
        getStaffKpis: vi.fn().mockRejectedValue('string error'),
      })
      render(
        <StaffStats
          startDate={START_DATE}
          endDate={END_DATE}
          statisticsRepo={repo}
        />,
      )

      await waitFor(() => {
        expect(screen.getByText('載入失敗')).toBeTruthy()
      })
    })
  })

  describe('refetch on date range change', () => {
    it('refetches when startDate changes', async () => {
      const repo = buildMockRepo()
      const { rerender } = render(
        <StaffStats
          startDate={START_DATE}
          endDate={END_DATE}
          statisticsRepo={repo}
        />,
      )

      await waitFor(() => {
        expect(repo.getStaffKpis).toHaveBeenCalledTimes(1)
      })

      const newStart = new Date('2026-02-01')
      const newEnd = new Date('2026-02-28')
      rerender(
        <StaffStats
          startDate={newStart}
          endDate={newEnd}
          statisticsRepo={repo}
        />,
      )

      await waitFor(() => {
        expect(repo.getStaffKpis).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('daily headcount chart (V2-66)', () => {
    it('calls getDailyHeadcount with correct date range', async () => {
      const repo = buildMockRepo()
      render(
        <StaffStats
          startDate={START_DATE}
          endDate={END_DATE}
          statisticsRepo={repo}
        />,
      )

      await waitFor(() => {
        expect(repo.getDailyHeadcount).toHaveBeenCalledWith({
          startDate: START_DATE.getTime(),
          endDate: END_DATE.getTime(),
        })
      })
    })

    it('renders DailyHeadcountChart after data loads (shows card title)', async () => {
      const repo = buildMockRepo()
      render(
        <StaffStats
          startDate={START_DATE}
          endDate={END_DATE}
          statisticsRepo={repo}
        />,
      )

      await waitFor(() => {
        expect(screen.getByText('每日出勤率')).toBeTruthy()
      })
    })

    it('renders AttendanceCalendar after data loads (shows card title)', async () => {
      const repo = buildMockRepo()
      render(
        <StaffStats
          startDate={START_DATE}
          endDate={END_DATE}
          statisticsRepo={repo}
        />,
      )

      await waitFor(() => {
        expect(screen.getByText('月曆出勤全覽')).toBeTruthy()
      })
    })

    it('getDailyHeadcount is called once per render', async () => {
      const repo = buildMockRepo()
      render(
        <StaffStats
          startDate={START_DATE}
          endDate={END_DATE}
          statisticsRepo={repo}
        />,
      )

      await waitFor(() => {
        expect(repo.getDailyHeadcount).toHaveBeenCalledTimes(1)
      })
    })
  })
})
