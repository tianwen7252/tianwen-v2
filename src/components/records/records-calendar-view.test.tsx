import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Employee, Attendance } from '@/lib/schemas'
import type { CalendarDay } from '@/lib/records-utils'
import { RecordsCalendarView } from './records-calendar-view'

// ─── Test Fixtures ──────────────────────────────────────────────────────────

const employees: readonly Employee[] = [
  {
    id: 'emp-001',
    name: 'Alex',
    avatar: 'images/aminals/doberman.png',
    status: 'active',
    shiftType: 'regular',
    employeeNo: 'E001',
    isAdmin: false,
    hireDate: '2024-01-15',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'emp-002',
    name: 'Mia',
    avatar: 'images/aminals/puppy.png',
    status: 'active',
    shiftType: 'regular',
    employeeNo: 'E002',
    isAdmin: false,
    hireDate: '2024-03-01',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

const regularAttendance: Attendance = {
  id: 'att-001',
  employeeId: 'emp-001',
  date: '2026-03-16',
  clockIn: new Date('2026-03-16T08:00:00').getTime(),
  clockOut: new Date('2026-03-16T17:00:00').getTime(),
  type: 'regular',
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

const vacationAttendance: Attendance = {
  id: 'att-002',
  employeeId: 'emp-002',
  date: '2026-03-16',
  clockIn: new Date('2026-03-16T08:00:00').getTime(),
  type: 'paid_leave',
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

function makeCalendarDay(overrides: Partial<CalendarDay> = {}): CalendarDay {
  return {
    date: '2026-03-16',
    displayDate: '03/16 (一)',
    dayOfWeek: 1,
    isWeekend: false,
    isToday: false,
    isCurrentMonth: true,
    cells: employees.map(emp => ({
      employee: emp,
      attendances: [],
    })),
    ...overrides,
  }
}

/** Build a minimal 6x7 grid with all empty days for March 2026. */
function buildEmptyGrid(): readonly (readonly CalendarDay[])[] {
  const rows: CalendarDay[][] = []
  for (let week = 0; week < 6; week++) {
    const weekDays: CalendarDay[] = []
    for (let d = 0; d < 7; d++) {
      const dayNum = week * 7 + d
      const isCurrentMonth = dayNum >= 0 && dayNum < 31
      weekDays.push(
        makeCalendarDay({
          date: `2026-03-${String(dayNum + 1).padStart(2, '0')}`,
          displayDate: `03/${String(dayNum + 1).padStart(2, '0')}`,
          dayOfWeek: d,
          isWeekend: d === 0 || d === 6,
          isToday: false,
          isCurrentMonth,
          cells: isCurrentMonth
            ? employees.map(emp => ({
                employee: emp,
                attendances: [],
              }))
            : [],
        }),
      )
    }
    rows.push(weekDays)
  }
  return rows
}

/** Build a grid where one specific day has attendance data. */
function buildGridWithAttendance(): readonly (readonly CalendarDay[])[] {
  const grid = buildEmptyGrid().map(week =>
    week.map(day => {
      if (day.date === '2026-03-16') {
        return {
          ...day,
          cells: [
            {
              employee: employees[0]!,
              attendances: [regularAttendance],
            },
            {
              employee: employees[1]!,
              attendances: [vacationAttendance],
            },
          ],
        }
      }
      return day
    }),
  )
  return grid
}

/** Build a grid with a "today" cell. */
function buildGridWithToday(): readonly (readonly CalendarDay[])[] {
  return buildEmptyGrid().map(week =>
    week.map(day => {
      if (day.date === '2026-03-21') {
        return { ...day, isToday: true }
      }
      return day
    }),
  )
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('RecordsCalendarView', () => {
  const defaultProps = {
    calendarGrid: buildEmptyGrid(),
    onEditRecord: vi.fn(),
    onAddRecord: vi.fn(),
    onCellClick: vi.fn(),
  }

  it('should render weekday headers', () => {
    render(<RecordsCalendarView {...defaultProps} />)
    expect(screen.getByText('週日')).toBeTruthy()
    expect(screen.getByText('週一')).toBeTruthy()
    expect(screen.getByText('週二')).toBeTruthy()
    expect(screen.getByText('週三')).toBeTruthy()
    expect(screen.getByText('週四')).toBeTruthy()
    expect(screen.getByText('週五')).toBeTruthy()
    expect(screen.getByText('週六')).toBeTruthy()
  })

  it('should render 6 rows of 7 days each', () => {
    const { container } = render(<RecordsCalendarView {...defaultProps} />)
    // 7 header cells + 42 day cells = 49 grid items
    const dayCells = container.querySelectorAll(
      '[data-testid^="calendar-cell-"]',
    )
    expect(dayCells.length).toBe(42)
  })

  it('should show today badge on today cell', () => {
    const gridWithToday = buildGridWithToday()
    render(
      <RecordsCalendarView {...defaultProps} calendarGrid={gridWithToday} />,
    )
    expect(screen.getByText('今日')).toBeTruthy()
  })

  it('should apply today highlight ring', () => {
    const gridWithToday = buildGridWithToday()
    render(
      <RecordsCalendarView {...defaultProps} calendarGrid={gridWithToday} />,
    )
    const todayCell = screen.getByTestId('calendar-cell-2026-03-21')
    expect(todayCell.className).toContain('border-blue-grey')
  })

  it('should apply reduced opacity class to outside-month cells', () => {
    render(<RecordsCalendarView {...defaultProps} />)
    // Last row likely has outside-month days (April dates)
    const outsideCells = screen
      .getAllByTestId(/^calendar-cell-/)
      .filter(el => el.className.includes('opacity-40'))
    expect(outsideCells.length).toBeGreaterThan(0)
  })

  it('should show employee name and avatar in attendance cells', () => {
    const gridWithAtt = buildGridWithAttendance()
    render(<RecordsCalendarView {...defaultProps} calendarGrid={gridWithAtt} />)
    // Employee names should appear next to their attendance
    expect(screen.getByText('Alex')).toBeTruthy()
    expect(screen.getByText('Mia')).toBeTruthy()
    // Avatars should render as img elements
    const avatars = screen.getAllByAltText('avatar')
    expect(avatars.length).toBe(2)
  })

  it('should show total hours for employee attendance', () => {
    const gridWithAtt = buildGridWithAttendance()
    render(<RecordsCalendarView {...defaultProps} calendarGrid={gridWithAtt} />)
    // 08:00 - 17:00 = 9h
    expect(screen.getByText('9h')).toBeTruthy()
  })

  it('should show vacation label on vacation attendance cards', () => {
    const gridWithAtt = buildGridWithAttendance()
    render(<RecordsCalendarView {...defaultProps} calendarGrid={gridWithAtt} />)
    expect(screen.getByText('休假')).toBeTruthy()
  })

  it('should show "休" for weekend cells without attendance', () => {
    render(<RecordsCalendarView {...defaultProps} />)
    // Multiple weekend cells in current month should show "休"
    const restLabels = screen.getAllByText('休')
    expect(restLabels.length).toBeGreaterThan(0)
  })

  it('should call onCellClick when a day cell is clicked', async () => {
    const user = userEvent.setup()
    const onCellClick = vi.fn()
    render(<RecordsCalendarView {...defaultProps} onCellClick={onCellClick} />)

    const cell = screen.getByTestId('calendar-cell-2026-03-16')
    await user.click(cell)
    expect(onCellClick).toHaveBeenCalledWith('2026-03-16')
  })

  it('should call onEditRecord when an employee attendance row is clicked', async () => {
    const user = userEvent.setup()
    const onEditRecord = vi.fn()
    const gridWithAtt = buildGridWithAttendance()
    render(
      <RecordsCalendarView
        {...defaultProps}
        calendarGrid={gridWithAtt}
        onEditRecord={onEditRecord}
      />,
    )

    await user.click(screen.getByText('9h'))
    expect(onEditRecord).toHaveBeenCalledWith(
      employees[0],
      '2026-03-16',
      regularAttendance,
    )
  })

  it('should apply weekend background class to weekend cells', () => {
    render(<RecordsCalendarView {...defaultProps} />)
    // Sunday (day 0) cells should have weekend class
    const sundayCells = screen
      .getAllByTestId(/^calendar-cell-/)
      .filter(el => el.className.includes('bg-lemon-chiffon/20'))
    expect(sundayCells.length).toBeGreaterThan(0)
  })

  // Font size compliance tests — project rule: no text-sm or smaller
  it('should not use text-sm or text-[10px] on any rendered element', () => {
    const gridWithAtt = buildGridWithAttendance()
    const { container } = render(
      <RecordsCalendarView {...defaultProps} calendarGrid={gridWithAtt} />,
    )
    const allElements = container.querySelectorAll('*')
    const forbidden = [
      'text-sm',
      'text-xs',
      'text-[10px]',
      'text-[11px]',
      'text-[12px]',
      'text-[13px]',
    ]
    allElements.forEach(el => {
      const cls = el.className ?? ''
      forbidden.forEach(f => {
        expect(
          cls,
          `Element has forbidden font class "${f}": ${cls}`,
        ).not.toContain(f)
      })
    })
  })
})
