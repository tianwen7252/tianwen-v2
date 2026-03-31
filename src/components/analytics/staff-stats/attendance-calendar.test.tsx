/**
 * Tests for AttendanceCalendar component.
 * Verifies calendar structure, day cells, attendance color logic, and click-to-show-attendees.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type {
  StatisticsRepository,
  DailyHeadcount,
} from '@/lib/repositories/statistics-repository'
import { AttendanceCalendar } from './attendance-calendar'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

// March 2026: 31 days, first day = Sunday (index 0)
const START_DATE = new Date('2026-03-01')
const TOTAL_EMPLOYEES = 10

const SAMPLE_DATA: DailyHeadcount[] = [
  { date: '2026-03-01', count: 10 }, // full
  { date: '2026-03-02', count: 5 }, // partial
  { date: '2026-03-03', count: 0 }, // none
]

function buildMockRepo(
  overrides?: Partial<StatisticsRepository>,
): StatisticsRepository {
  return {
    getProductKpis: vi.fn().mockResolvedValue({}),
    getHourlyOrderDistribution: vi.fn().mockResolvedValue([]),
    getTopProducts: vi.fn().mockResolvedValue([]),
    getBottomBentos: vi.fn().mockResolvedValue([]),
    getDailyRevenue: vi.fn().mockResolvedValue([]),
    getAvgOrderValue: vi.fn().mockResolvedValue([]),
    getProductDailyRevenue: vi.fn().mockResolvedValue([]),
    getStaffKpis: vi.fn().mockResolvedValue({
      activeEmployeeCount: 10,
      totalAttendanceDays: 0,
      avgMonthlyHours: 0,
      leaveCount: 0,
    }),
    getEmployeeHours: vi.fn().mockResolvedValue([]),
    getDailyHeadcount: vi.fn().mockResolvedValue([]),
    getDailyAttendeeList: vi.fn().mockResolvedValue([]),
    getAmPmRevenue: vi.fn().mockResolvedValue([]),
    getCategorySales: vi.fn().mockResolvedValue([]),
    getOrderNotesDistribution: vi.fn().mockResolvedValue([]),
    getDeliveryProductBreakdown: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AttendanceCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('accessibility', () => {
    it('renders aria-label "月曆出勤全覽" region', () => {
      render(
        <AttendanceCalendar
          data={[]}
          statisticsRepo={buildMockRepo()}
          totalEmployees={TOTAL_EMPLOYEES}
          startDate={START_DATE}
        />,
      )
      expect(screen.getByText('月曆出勤全覽')).toBeTruthy()
    })
  })

  describe('day headers', () => {
    it('renders weekday header 日', () => {
      render(
        <AttendanceCalendar
          data={[]}
          statisticsRepo={buildMockRepo()}
          totalEmployees={TOTAL_EMPLOYEES}
          startDate={START_DATE}
        />,
      )
      expect(screen.getByText('日')).toBeTruthy()
    })

    it('renders weekday header 六', () => {
      render(
        <AttendanceCalendar
          data={[]}
          statisticsRepo={buildMockRepo()}
          totalEmployees={TOTAL_EMPLOYEES}
          startDate={START_DATE}
        />,
      )
      expect(screen.getByText('六')).toBeTruthy()
    })
  })

  describe('day cells', () => {
    it('renders data-testid for the first day', () => {
      render(
        <AttendanceCalendar
          data={SAMPLE_DATA}
          statisticsRepo={buildMockRepo()}
          totalEmployees={TOTAL_EMPLOYEES}
          startDate={START_DATE}
        />,
      )
      expect(screen.getByTestId('day-2026-03-01')).toBeTruthy()
    })

    it('renders data-testid for the last day of March 2026', () => {
      render(
        <AttendanceCalendar
          data={SAMPLE_DATA}
          statisticsRepo={buildMockRepo()}
          totalEmployees={TOTAL_EMPLOYEES}
          startDate={START_DATE}
        />,
      )
      expect(screen.getByTestId('day-2026-03-31')).toBeTruthy()
    })

    it('shows headcount for days with data', () => {
      render(
        <AttendanceCalendar
          data={SAMPLE_DATA}
          statisticsRepo={buildMockRepo()}
          totalEmployees={TOTAL_EMPLOYEES}
          startDate={START_DATE}
        />,
      )
      expect(screen.getByTestId('day-2026-03-01').textContent).toContain(
        '10 人',
      )
      expect(screen.getByTestId('day-2026-03-02').textContent).toContain('5 人')
    })

    it('shows 0 人 for days not in data', () => {
      render(
        <AttendanceCalendar
          data={[]}
          statisticsRepo={buildMockRepo()}
          totalEmployees={TOTAL_EMPLOYEES}
          startDate={START_DATE}
        />,
      )
      expect(screen.getByTestId('day-2026-03-15').textContent).toContain('0 人')
    })
  })

  describe('attendance color logic', () => {
    it('marks full attendance (count >= totalEmployees) as data-attendance="full"', () => {
      render(
        <AttendanceCalendar
          data={SAMPLE_DATA}
          statisticsRepo={buildMockRepo()}
          totalEmployees={10}
          startDate={START_DATE}
        />,
      )
      const cell = screen.getByTestId('day-2026-03-01')
      expect(cell.dataset['attendance']).toBe('full')
    })

    it('marks partial attendance (0 < count < totalEmployees) as data-attendance="partial"', () => {
      render(
        <AttendanceCalendar
          data={SAMPLE_DATA}
          statisticsRepo={buildMockRepo()}
          totalEmployees={10}
          startDate={START_DATE}
        />,
      )
      const cell = screen.getByTestId('day-2026-03-02')
      expect(cell.dataset['attendance']).toBe('partial')
    })

    it('marks days with count=0 as data-attendance="none"', () => {
      render(
        <AttendanceCalendar
          data={SAMPLE_DATA}
          statisticsRepo={buildMockRepo()}
          totalEmployees={10}
          startDate={START_DATE}
        />,
      )
      const cell = screen.getByTestId('day-2026-03-03')
      expect(cell.dataset['attendance']).toBe('none')
    })

    it('marks days with no data as data-attendance="none"', () => {
      render(
        <AttendanceCalendar
          data={[]}
          statisticsRepo={buildMockRepo()}
          totalEmployees={10}
          startDate={START_DATE}
        />,
      )
      expect(screen.getByTestId('day-2026-03-15').dataset['attendance']).toBe(
        'none',
      )
    })
  })

  describe('click to show attendees', () => {
    it('calls getDailyAttendeeList when a day cell is clicked', async () => {
      const repo = buildMockRepo({
        getDailyAttendeeList: vi.fn().mockResolvedValue(['陳小明', '王大華']),
      })
      render(
        <AttendanceCalendar
          data={SAMPLE_DATA}
          statisticsRepo={repo}
          totalEmployees={TOTAL_EMPLOYEES}
          startDate={START_DATE}
        />,
      )

      fireEvent.click(screen.getByTestId('day-2026-03-01'))

      await waitFor(() => {
        expect(repo.getDailyAttendeeList).toHaveBeenCalledWith('2026-03-01')
      })
    })

    it('shows attendee names after clicking a day', async () => {
      const repo = buildMockRepo({
        getDailyAttendeeList: vi.fn().mockResolvedValue(['陳小明', '王大華']),
      })
      render(
        <AttendanceCalendar
          data={SAMPLE_DATA}
          statisticsRepo={repo}
          totalEmployees={TOTAL_EMPLOYEES}
          startDate={START_DATE}
        />,
      )

      fireEvent.click(screen.getByTestId('day-2026-03-01'))

      await waitFor(() => {
        expect(screen.getByText('陳小明')).toBeTruthy()
        expect(screen.getByText('王大華')).toBeTruthy()
      })
    })

    it('shows "無出勤記錄" when attendee list is empty', async () => {
      const repo = buildMockRepo({
        getDailyAttendeeList: vi.fn().mockResolvedValue([]),
      })
      render(
        <AttendanceCalendar
          data={SAMPLE_DATA}
          statisticsRepo={repo}
          totalEmployees={TOTAL_EMPLOYEES}
          startDate={START_DATE}
        />,
      )

      fireEvent.click(screen.getByTestId('day-2026-03-01'))

      await waitFor(() => {
        expect(screen.getByText('無出勤記錄')).toBeTruthy()
      })
    })

    it('shows error message when getDailyAttendeeList rejects', async () => {
      const repo = buildMockRepo({
        getDailyAttendeeList: vi
          .fn()
          .mockRejectedValue(new Error('出勤名單載入失敗')),
      })
      render(
        <AttendanceCalendar
          data={SAMPLE_DATA}
          statisticsRepo={repo}
          totalEmployees={TOTAL_EMPLOYEES}
          startDate={START_DATE}
        />,
      )

      fireEvent.click(screen.getByTestId('day-2026-03-01'))

      await waitFor(() => {
        expect(screen.getByText('出勤名單載入失敗')).toBeTruthy()
      })
    })

    it('shows loading status while fetching attendees', () => {
      const repo = buildMockRepo({
        getDailyAttendeeList: vi
          .fn()
          .mockImplementation(() => new Promise(() => {})),
      })
      render(
        <AttendanceCalendar
          data={SAMPLE_DATA}
          statisticsRepo={repo}
          totalEmployees={TOTAL_EMPLOYEES}
          startDate={START_DATE}
        />,
      )

      fireEvent.click(screen.getByTestId('day-2026-03-01'))

      expect(screen.getByRole('status')).toBeTruthy()
    })
  })

  describe('empty state', () => {
    it('renders without crashing with empty data', () => {
      const { container } = render(
        <AttendanceCalendar
          data={[]}
          statisticsRepo={buildMockRepo()}
          totalEmployees={TOTAL_EMPLOYEES}
          startDate={START_DATE}
        />,
      )
      expect(container).toBeTruthy()
    })

    it('still shows calendar structure with empty data', () => {
      render(
        <AttendanceCalendar
          data={[]}
          statisticsRepo={buildMockRepo()}
          totalEmployees={0}
          startDate={START_DATE}
        />,
      )
      expect(screen.getByText('月曆出勤全覽')).toBeTruthy()
    })
  })
})
