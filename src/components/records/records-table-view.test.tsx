import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Employee, Attendance } from '@/lib/schemas'
import type { DayRow, EmployeeAttendanceCell } from '@/lib/records-utils'
import { RecordsTableView } from './records-table-view'

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
    isDefaultOrderStaff: false,
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
    isDefaultOrderStaff: false,
    hireDate: '2024-03-01',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

const regularAttendance: Attendance = {
  id: 'att-001',
  employeeId: 'emp-001',
  date: '2026-03-20',
  clockIn: new Date('2026-03-20T08:00:00').getTime(),
  clockOut: new Date('2026-03-20T17:00:00').getTime(),
  type: 'regular',
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

const vacationAttendance: Attendance = {
  id: 'att-002',
  employeeId: 'emp-002',
  date: '2026-03-20',
  clockIn: new Date('2026-03-20T08:00:00').getTime(),
  type: 'paid_leave',
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

function makeDayRow(overrides: Partial<DayRow> = {}): DayRow {
  return {
    date: '2026-03-20',
    displayDate: '03/20 (五)',
    dayOfWeek: 5,
    isWeekend: false,
    isToday: false,
    cells: employees.map(emp => ({
      employee: emp,
      attendances: [],
    })),
    ...overrides,
  }
}

function makeWeekendRow(overrides: Partial<DayRow> = {}): DayRow {
  return makeDayRow({
    date: '2026-03-22',
    displayDate: '03/22 (日)',
    dayOfWeek: 0,
    isWeekend: true,
    ...overrides,
  })
}

function makeTodayRow(overrides: Partial<DayRow> = {}): DayRow {
  return makeDayRow({
    date: '2026-03-21',
    displayDate: '03/21 (六)',
    dayOfWeek: 6,
    isWeekend: true,
    isToday: true,
    ...overrides,
  })
}

function makeCellsWithAttendance(
  emps: readonly Employee[],
  attMap: Record<string, Attendance[]>,
): readonly EmployeeAttendanceCell[] {
  return emps.map(emp => ({
    employee: emp,
    attendances: attMap[emp.id] ?? [],
  }))
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('RecordsTableView', () => {
  const defaultProps = {
    dayRows: [makeDayRow()],
    employees,
    onEditRecord: vi.fn(),
    onAddRecord: vi.fn(),
  }

  it('should render date column with display dates', () => {
    render(<RecordsTableView {...defaultProps} />)
    expect(screen.getByText('03/20 (五)')).toBeTruthy()
  })

  it('should render employee headers with avatars', () => {
    render(<RecordsTableView {...defaultProps} />)
    expect(screen.getByText('Alex')).toBeTruthy()
    expect(screen.getByText('Mia')).toBeTruthy()
    // Avatars rendered as images
    const avatars = screen.getAllByAltText('avatar')
    expect(avatars.length).toBeGreaterThanOrEqual(2)
  })

  it('should show "未打卡" for empty cells', () => {
    render(<RecordsTableView {...defaultProps} />)
    // Both employees have no attendance, so two "未打卡" texts
    const noRecords = screen.getAllByText('未打卡')
    expect(noRecords.length).toBe(2)
  })

  it('should show time range for attendance records', () => {
    const cells = makeCellsWithAttendance(employees, {
      'emp-001': [regularAttendance],
    })
    const dayRows = [makeDayRow({ cells })]
    render(<RecordsTableView {...defaultProps} dayRows={dayRows} />)
    expect(screen.getByText('08:00 - 17:00')).toBeTruthy()
  })

  it('should show vacation label for non-regular attendance', () => {
    const cells = makeCellsWithAttendance(employees, {
      'emp-002': [vacationAttendance],
    })
    const dayRows = [makeDayRow({ cells })]
    render(<RecordsTableView {...defaultProps} dayRows={dayRows} />)
    expect(screen.getByText('休假')).toBeTruthy()
  })

  it('should show "休" for weekend rows without attendance', () => {
    const dayRows = [makeWeekendRow()]
    render(<RecordsTableView {...defaultProps} dayRows={dayRows} />)
    expect(screen.getByText('休')).toBeTruthy()
  })

  it('should show normal cells for weekend rows with attendance', () => {
    const cells = makeCellsWithAttendance(employees, {
      'emp-001': [{ ...regularAttendance, date: '2026-03-22' }],
    })
    const dayRows = [makeWeekendRow({ cells })]
    render(<RecordsTableView {...defaultProps} dayRows={dayRows} />)
    expect(screen.getByText('08:00 - 17:00')).toBeTruthy()
    // Should NOT show "休" since there is attendance
    expect(screen.queryByText('休')).toBeNull()
  })

  it('should highlight today row', () => {
    const dayRows = [makeTodayRow()]
    render(
      <RecordsTableView
        {...defaultProps}
        dayRows={dayRows}
        todayDate="2026-03-21"
      />,
    )
    const todayRow = screen.getByTestId('row-2026-03-21')
    expect(todayRow.getAttribute('data-today')).toBe('true')
  })

  it('should call onEditRecord when attendance card is clicked', async () => {
    const user = userEvent.setup()
    const onEditRecord = vi.fn()
    const cells = makeCellsWithAttendance(employees, {
      'emp-001': [regularAttendance],
    })
    const dayRows = [makeDayRow({ cells })]
    render(
      <RecordsTableView
        {...defaultProps}
        dayRows={dayRows}
        onEditRecord={onEditRecord}
      />,
    )

    await user.click(screen.getByText('08:00 - 17:00'))
    expect(onEditRecord).toHaveBeenCalledWith(
      employees[0],
      '2026-03-20',
      regularAttendance,
    )
  })

  it('should call onAddRecord when empty cell is clicked', async () => {
    const user = userEvent.setup()
    const onAddRecord = vi.fn()
    render(<RecordsTableView {...defaultProps} onAddRecord={onAddRecord} />)

    // Click on the first "未打卡" cell
    const noCells = screen.getAllByText('未打卡')
    await user.click(noCells[0]!)
    expect(onAddRecord).toHaveBeenCalledWith(employees[0], '2026-03-20')
  })

  it('should show total hours for cells with complete attendance', () => {
    const cells = makeCellsWithAttendance(employees, {
      'emp-001': [regularAttendance],
    })
    const dayRows = [makeDayRow({ cells })]
    render(<RecordsTableView {...defaultProps} dayRows={dayRows} />)
    // 08:00 - 17:00 = 9 hours
    expect(screen.getByText(/總工時:.*9h/)).toBeTruthy()
  })

  it('should render multiple day rows', () => {
    const dayRows = [
      makeDayRow(),
      makeDayRow({
        date: '2026-03-19',
        displayDate: '03/19 (四)',
        dayOfWeek: 4,
      }),
    ]
    render(<RecordsTableView {...defaultProps} dayRows={dayRows} />)
    expect(screen.getByText('03/20 (五)')).toBeTruthy()
    expect(screen.getByText('03/19 (四)')).toBeTruthy()
  })

  it('should render empty state when dayRows is empty', () => {
    render(<RecordsTableView {...defaultProps} dayRows={[]} />)
    // Table should still render headers but no body rows
    expect(screen.getByText('Alex')).toBeTruthy()
    expect(screen.queryByText('未打卡')).toBeNull()
  })

  // Font size compliance tests — project rule: no text-sm or smaller
  it('should not use text-sm or text-[10px] on any rendered element', () => {
    const cells = makeCellsWithAttendance(employees, {
      'emp-001': [regularAttendance],
      'emp-002': [vacationAttendance],
    })
    const { container } = render(
      <RecordsTableView {...defaultProps} dayRows={[makeDayRow({ cells })]} />,
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

  it('should not use font-semibold on any rendered element', () => {
    const cells = makeCellsWithAttendance(employees, {
      'emp-001': [regularAttendance],
    })
    const { container } = render(
      <RecordsTableView {...defaultProps} dayRows={[makeDayRow({ cells })]} />,
    )
    const allElements = container.querySelectorAll('*')
    allElements.forEach(el => {
      const cls = el.className ?? ''
      expect(
        cls,
        `Element has forbidden class "font-semibold": ${cls}`,
      ).not.toContain('font-semibold')
    })
  })
})
