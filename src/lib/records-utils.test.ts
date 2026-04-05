import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import type { Employee, Attendance } from '@/lib/schemas'
import {
  WEEKDAY_LABELS,
  WEEKDAY_SHORT,
  dayRowHasAttendance,
  buildAttendanceMap,
  formatClockTime,
  getCellDisplayType,
  filterEmployeesByName,
  getYearOptions,
  getMonthOptions,
  buildDayRows,
  buildCalendarGrid,
} from './records-utils'
import type { DayRow } from './records-utils'

// ─── Test Fixtures ──────────────────────────────────────────────────────────

function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 'emp-1',
    name: 'Alice',
    status: 'active',
    shiftType: 'regular',
    isAdmin: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
}

function makeAttendance(overrides: Partial<Attendance> = {}): Attendance {
  return {
    id: 'att-1',
    employeeId: 'emp-1',
    date: '2025-06-15',
    clockIn: dayjs('2025-06-15 09:00').valueOf(),
    clockOut: dayjs('2025-06-15 18:00').valueOf(),
    type: 'regular',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
}

// ─── Constants ──────────────────────────────────────────────────────────────

describe('constants', () => {
  it('should export WEEKDAY_LABELS with 7 entries in Chinese', () => {
    expect(WEEKDAY_LABELS).toEqual([
      '週日',
      '週一',
      '週二',
      '週三',
      '週四',
      '週五',
      '週六',
    ])
    expect(WEEKDAY_LABELS).toHaveLength(7)
  })

  it('should export WEEKDAY_SHORT with 7 short labels', () => {
    expect(WEEKDAY_SHORT).toEqual(['日', '一', '二', '三', '四', '五', '六'])
    expect(WEEKDAY_SHORT).toHaveLength(7)
  })
})

// ─── dayRowHasAttendance ────────────────────────────────────────────────────

describe('dayRowHasAttendance', () => {
  it('should return true when at least one cell has attendance records', () => {
    const row: DayRow = {
      date: '2025-06-15',
      displayDate: '06/15 (日)',
      dayOfWeek: 0,
      isWeekend: true,
      isToday: false,
      cells: [
        { employee: makeEmployee(), attendances: [makeAttendance()] },
        { employee: makeEmployee({ id: 'emp-2' }), attendances: [] },
      ],
    }
    expect(dayRowHasAttendance(row)).toBe(true)
  })

  it('should return false when no cells have attendance records', () => {
    const row: DayRow = {
      date: '2025-06-15',
      displayDate: '06/15 (日)',
      dayOfWeek: 0,
      isWeekend: true,
      isToday: false,
      cells: [
        { employee: makeEmployee(), attendances: [] },
        { employee: makeEmployee({ id: 'emp-2' }), attendances: [] },
      ],
    }
    expect(dayRowHasAttendance(row)).toBe(false)
  })

  it('should return false when cells array is empty', () => {
    const row: DayRow = {
      date: '2025-06-15',
      displayDate: '06/15 (日)',
      dayOfWeek: 0,
      isWeekend: true,
      isToday: false,
      cells: [],
    }
    expect(dayRowHasAttendance(row)).toBe(false)
  })
})

// ─── buildAttendanceMap ─────────────────────────────────────────────────────

describe('buildAttendanceMap', () => {
  it('should group attendances by employeeId-date key', () => {
    const attendances = [
      makeAttendance({ id: 'a1', employeeId: 'emp-1', date: '2025-06-15' }),
      makeAttendance({ id: 'a2', employeeId: 'emp-2', date: '2025-06-15' }),
      makeAttendance({ id: 'a3', employeeId: 'emp-1', date: '2025-06-16' }),
    ]
    const map = buildAttendanceMap(attendances)
    expect(map.get('emp-1-2025-06-15')).toHaveLength(1)
    expect(map.get('emp-2-2025-06-15')).toHaveLength(1)
    expect(map.get('emp-1-2025-06-16')).toHaveLength(1)
    expect(map.get('emp-2-2025-06-16')).toBeUndefined()
  })

  it('should handle multi-shift (multiple attendances for same employee-date)', () => {
    const attendances = [
      makeAttendance({
        id: 'a1',
        employeeId: 'emp-1',
        date: '2025-06-15',
        clockIn: dayjs('2025-06-15 06:00').valueOf(),
        clockOut: dayjs('2025-06-15 12:00').valueOf(),
      }),
      makeAttendance({
        id: 'a2',
        employeeId: 'emp-1',
        date: '2025-06-15',
        clockIn: dayjs('2025-06-15 14:00').valueOf(),
        clockOut: dayjs('2025-06-15 20:00').valueOf(),
      }),
    ]
    const map = buildAttendanceMap(attendances)
    const records = map.get('emp-1-2025-06-15')
    expect(records).toHaveLength(2)
    expect(records![0]!.id).toBe('a1')
    expect(records![1]!.id).toBe('a2')
  })

  it('should return an empty map when given an empty array', () => {
    const map = buildAttendanceMap([])
    expect(map.size).toBe(0)
  })

  it('should handle a single attendance correctly', () => {
    const attendances = [makeAttendance()]
    const map = buildAttendanceMap(attendances)
    expect(map.size).toBe(1)
    expect(map.get('emp-1-2025-06-15')).toHaveLength(1)
  })
})

// ─── formatClockTime ────────────────────────────────────────────────────────

describe('formatClockTime', () => {
  it('should format a valid timestamp as HH:mm', () => {
    const ts = dayjs('2025-06-15 09:05').valueOf()
    expect(formatClockTime(ts)).toBe('09:05')
  })

  it('should return "??:??" for undefined', () => {
    expect(formatClockTime(undefined)).toBe('??:??')
  })

  it('should return "??:??" for zero', () => {
    expect(formatClockTime(0)).toBe('??:??')
  })

  it('should handle midnight timestamp', () => {
    const ts = dayjs('2025-06-15 00:00').valueOf()
    expect(formatClockTime(ts)).toBe('00:00')
  })

  it('should handle end-of-day timestamp', () => {
    const ts = dayjs('2025-06-15 23:59').valueOf()
    expect(formatClockTime(ts)).toBe('23:59')
  })
})

// ─── getCellDisplayType ─────────────────────────────────────────────────────

describe('getCellDisplayType', () => {
  it('should return "noRecord" when attendance is undefined', () => {
    expect(getCellDisplayType(undefined)).toBe('noRecord')
  })

  it('should return "vacation" for paid_leave type', () => {
    const att = makeAttendance({ type: 'paid_leave' })
    expect(getCellDisplayType(att)).toBe('vacation')
  })

  it('should return "vacation" for sick_leave type', () => {
    const att = makeAttendance({ type: 'sick_leave' })
    expect(getCellDisplayType(att)).toBe('vacation')
  })

  it('should return "vacation" for personal_leave type', () => {
    const att = makeAttendance({ type: 'personal_leave' })
    expect(getCellDisplayType(att)).toBe('vacation')
  })

  it('should return "vacation" for absent type', () => {
    const att = makeAttendance({ type: 'absent' })
    expect(getCellDisplayType(att)).toBe('vacation')
  })

  it('should return "clockInOnly" when clockIn exists but clockOut is undefined', () => {
    const att = makeAttendance({
      type: 'regular',
      clockIn: dayjs('2025-06-15 09:00').valueOf(),
      clockOut: undefined,
    })
    expect(getCellDisplayType(att)).toBe('clockInOnly')
  })

  it('should return "normal" for a regular attendance with both clockIn and clockOut', () => {
    const att = makeAttendance({ type: 'regular' })
    expect(getCellDisplayType(att)).toBe('normal')
  })

  it('should return "normal" for a regular attendance with no clockIn or clockOut', () => {
    const att = makeAttendance({
      type: 'regular',
      clockIn: undefined,
      clockOut: undefined,
    })
    expect(getCellDisplayType(att)).toBe('normal')
  })
})

// ─── filterEmployeesByName ──────────────────────────────────────────────────

describe('filterEmployeesByName', () => {
  const employees: readonly Employee[] = [
    makeEmployee({ id: 'emp-1', name: 'Alice' }),
    makeEmployee({ id: 'emp-2', name: 'Bob' }),
    makeEmployee({ id: 'emp-3', name: 'ALICE Chen' }),
    makeEmployee({ id: 'emp-4', name: 'Charlie' }),
  ]

  it('should return all employees when query is empty', () => {
    expect(filterEmployeesByName(employees, '')).toEqual(employees)
  })

  it('should filter by partial match', () => {
    const result = filterEmployeesByName(employees, 'ali')
    expect(result).toHaveLength(2)
    expect(result[0]!.id).toBe('emp-1')
    expect(result[1]!.id).toBe('emp-3')
  })

  it('should be case-insensitive', () => {
    const result = filterEmployeesByName(employees, 'ALICE')
    expect(result).toHaveLength(2)
  })

  it('should return empty array when no match', () => {
    const result = filterEmployeesByName(employees, 'xyz')
    expect(result).toHaveLength(0)
  })

  it('should handle empty employee list', () => {
    const result = filterEmployeesByName([], 'test')
    expect(result).toHaveLength(0)
  })

  it('should handle Chinese characters', () => {
    const chineseEmployees = [
      makeEmployee({ id: 'emp-1', name: '小明' }),
      makeEmployee({ id: 'emp-2', name: '小華' }),
    ]
    const result = filterEmployeesByName(chineseEmployees, '小明')
    expect(result).toHaveLength(1)
    expect(result[0]!.name).toBe('小明')
  })
})

// ─── getYearOptions ─────────────────────────────────────────────────────────

describe('getYearOptions', () => {
  it('should return 5 years centered on current year', () => {
    const options = getYearOptions(2025)
    expect(options).toHaveLength(5)
    expect(options[0]).toEqual({ value: 2023, label: '2023 年' })
    expect(options[1]).toEqual({ value: 2024, label: '2024 年' })
    expect(options[2]).toEqual({ value: 2025, label: '2025 年' })
    expect(options[3]).toEqual({ value: 2026, label: '2026 年' })
    expect(options[4]).toEqual({ value: 2027, label: '2027 年' })
  })

  it('should handle edge year values', () => {
    const options = getYearOptions(2000)
    expect(options[0]!.value).toBe(1998)
    expect(options[4]!.value).toBe(2002)
  })
})

// ─── getMonthOptions ────────────────────────────────────────────────────────

describe('getMonthOptions', () => {
  it('should return all 12 months when no arguments given', () => {
    const options = getMonthOptions()
    expect(options).toHaveLength(12)
    expect(options[0]).toEqual({ value: 1, label: '1 月' })
    expect(options[11]).toEqual({ value: 12, label: '12 月' })
  })

  it('should return all 12 months when selected year differs from current year', () => {
    const options = getMonthOptions(2024, 2025, 6)
    expect(options).toHaveLength(12)
  })

  it('should filter future months when selected year equals current year', () => {
    const options = getMonthOptions(2025, 2025, 6)
    expect(options).toHaveLength(6)
    expect(options[5]).toEqual({ value: 6, label: '6 月' })
  })

  it('should return only January when current month is 1 and years match', () => {
    const options = getMonthOptions(2025, 2025, 1)
    expect(options).toHaveLength(1)
    expect(options[0]).toEqual({ value: 1, label: '1 月' })
  })

  it('should return 12 months when selectedYear is provided but currentYear is not', () => {
    const options = getMonthOptions(2025)
    expect(options).toHaveLength(12)
  })

  it('should return 12 months when selectedYear and currentYear provided but currentMonth is not', () => {
    const options = getMonthOptions(2025, 2025)
    expect(options).toHaveLength(12)
  })
})

// ─── buildDayRows ───────────────────────────────────────────────────────────

describe('buildDayRows', () => {
  const employees: readonly Employee[] = [
    makeEmployee({ id: 'emp-1', name: 'Alice' }),
  ]

  it('should generate correct number of days for the month', () => {
    // June 2025 has 30 days, todayStr is end of month so all days show
    const rows = buildDayRows(2025, 6, employees, [], '2025-06-30')
    expect(rows).toHaveLength(30)
  })

  it('should produce days in descending order (most recent first)', () => {
    const rows = buildDayRows(2025, 6, employees, [], '2025-06-30')
    expect(rows[0]!.date).toBe('2025-06-30')
    expect(rows[rows.length - 1]!.date).toBe('2025-06-01')
  })

  it('should filter out future dates', () => {
    const todayStr = '2025-06-15'
    const rows = buildDayRows(2025, 6, employees, [], todayStr)
    expect(rows).toHaveLength(15)
    expect(rows[0]!.date).toBe('2025-06-15')
  })

  it('should detect weekends correctly', () => {
    // 2025-06-15 is a Sunday, 2025-06-14 is a Saturday
    const rows = buildDayRows(2025, 6, employees, [], '2025-06-15')
    const sunday = rows.find(r => r.date === '2025-06-15')
    const saturday = rows.find(r => r.date === '2025-06-14')
    const friday = rows.find(r => r.date === '2025-06-13')
    expect(sunday!.isWeekend).toBe(true)
    expect(saturday!.isWeekend).toBe(true)
    expect(friday!.isWeekend).toBe(false)
  })

  it('should mark isToday correctly', () => {
    const todayStr = '2025-06-15'
    const rows = buildDayRows(2025, 6, employees, [], todayStr)
    const today = rows.find(r => r.date === todayStr)
    const notToday = rows.find(r => r.date === '2025-06-14')
    expect(today!.isToday).toBe(true)
    expect(notToday!.isToday).toBe(false)
  })

  it('should populate cells with matching attendance records', () => {
    const attendances = [
      makeAttendance({
        id: 'a1',
        employeeId: 'emp-1',
        date: '2025-06-15',
      }),
    ]
    const rows = buildDayRows(2025, 6, employees, attendances, '2025-06-15')
    const row = rows.find(r => r.date === '2025-06-15')
    expect(row!.cells).toHaveLength(1)
    expect(row!.cells[0]!.attendances).toHaveLength(1)
    expect(row!.cells[0]!.employee.id).toBe('emp-1')
  })

  it('should have empty attendances for cells with no matching records', () => {
    const rows = buildDayRows(2025, 6, employees, [], '2025-06-15')
    const row = rows.find(r => r.date === '2025-06-15')
    expect(row!.cells[0]!.attendances).toHaveLength(0)
  })

  it('should format displayDate correctly', () => {
    const rows = buildDayRows(2025, 6, employees, [], '2025-06-15')
    const row = rows.find(r => r.date === '2025-06-15')
    // 2025-06-15 is a Sunday
    expect(row!.displayDate).toBe('06/15 (日)')
  })

  it('should handle February in a leap year', () => {
    // 2024 is a leap year, February has 29 days
    const rows = buildDayRows(2024, 2, employees, [], '2024-02-29')
    expect(rows).toHaveLength(29)
  })

  it('should handle multiple employees', () => {
    const multiEmployees = [
      makeEmployee({ id: 'emp-1', name: 'Alice' }),
      makeEmployee({ id: 'emp-2', name: 'Bob' }),
    ]
    const attendances = [
      makeAttendance({ id: 'a1', employeeId: 'emp-1', date: '2025-06-15' }),
      makeAttendance({ id: 'a2', employeeId: 'emp-2', date: '2025-06-15' }),
    ]
    const rows = buildDayRows(
      2025,
      6,
      multiEmployees,
      attendances,
      '2025-06-15',
    )
    const row = rows.find(r => r.date === '2025-06-15')
    expect(row!.cells).toHaveLength(2)
    expect(row!.cells[0]!.attendances).toHaveLength(1)
    expect(row!.cells[1]!.attendances).toHaveLength(1)
  })
})

// ─── buildCalendarGrid ──────────────────────────────────────────────────────

describe('buildCalendarGrid', () => {
  const employees: readonly Employee[] = [
    makeEmployee({ id: 'emp-1', name: 'Alice' }),
  ]

  it('should return a 6x7 grid (6 weeks, 7 days each)', () => {
    const grid = buildCalendarGrid(2025, 6, employees, [], '2025-06-30')
    expect(grid).toHaveLength(6)
    for (const week of grid) {
      expect(week).toHaveLength(7)
    }
  })

  it('should have total of 42 days', () => {
    const grid = buildCalendarGrid(2025, 6, employees, [], '2025-06-30')
    const totalDays = grid.reduce((sum, week) => sum + week.length, 0)
    expect(totalDays).toBe(42)
  })

  it('should mark isCurrentMonth correctly', () => {
    const grid = buildCalendarGrid(2025, 6, employees, [], '2025-06-30')
    const allDays = grid.flat()
    const juneDays = allDays.filter(d => d.isCurrentMonth)
    // June has 30 days
    expect(juneDays).toHaveLength(30)
  })

  it('should include days from previous and next month to fill the grid', () => {
    const grid = buildCalendarGrid(2025, 6, employees, [], '2025-06-30')
    const allDays = grid.flat()
    const outsideMonth = allDays.filter(d => !d.isCurrentMonth)
    // 42 total - 30 June days = 12 outside days
    expect(outsideMonth).toHaveLength(12)
  })

  it('should have empty cells for days outside current month', () => {
    // July 2025 starts on Tuesday, so grid includes June 29 (Sun) and June 30 (Mon)
    const attendances = [
      makeAttendance({ id: 'a1', employeeId: 'emp-1', date: '2025-06-30' }),
    ]
    const grid = buildCalendarGrid(
      2025,
      7,
      employees,
      attendances,
      '2025-07-31',
    )
    const allDays = grid.flat()
    const june30 = allDays.find(d => d.date === '2025-06-30')
    // Outside month days should have empty cells
    expect(june30).toBeDefined()
    expect(june30!.isCurrentMonth).toBe(false)
    expect(june30!.cells).toHaveLength(0)
  })

  it('should populate cells for days within current month', () => {
    const attendances = [
      makeAttendance({ id: 'a1', employeeId: 'emp-1', date: '2025-06-15' }),
    ]
    const grid = buildCalendarGrid(
      2025,
      6,
      employees,
      attendances,
      '2025-06-30',
    )
    const allDays = grid.flat()
    const june15 = allDays.find(d => d.date === '2025-06-15')
    expect(june15!.isCurrentMonth).toBe(true)
    expect(june15!.cells).toHaveLength(1)
    expect(june15!.cells[0]!.attendances).toHaveLength(1)
  })

  it('should start the grid on the correct day of the week', () => {
    // June 2025 starts on a Sunday (day 0)
    const grid = buildCalendarGrid(2025, 6, employees, [], '2025-06-30')
    // First day of grid should be Sunday
    expect(grid[0]![0]!.dayOfWeek).toBe(0)
    // Since June 1 is Sunday, first cell should be June 1
    expect(grid[0]![0]!.date).toBe('2025-06-01')
  })

  it('should mark isToday correctly', () => {
    const todayStr = '2025-06-15'
    const grid = buildCalendarGrid(2025, 6, employees, [], todayStr)
    const allDays = grid.flat()
    const today = allDays.find(d => d.date === todayStr)
    expect(today!.isToday).toBe(true)
    const notToday = allDays.filter(d => d.date !== todayStr)
    notToday.forEach(d => expect(d.isToday).toBe(false))
  })

  it('should handle a month that starts on a non-Sunday', () => {
    // July 2025 starts on Tuesday (day 2)
    const grid = buildCalendarGrid(2025, 7, employees, [], '2025-07-31')
    const allDays = grid.flat()
    // First two cells should be June 29 (Sun) and June 30 (Mon)
    expect(allDays[0]!.date).toBe('2025-06-29')
    expect(allDays[0]!.isCurrentMonth).toBe(false)
    expect(allDays[1]!.date).toBe('2025-06-30')
    expect(allDays[1]!.isCurrentMonth).toBe(false)
    // Third cell should be July 1
    expect(allDays[2]!.date).toBe('2025-07-01')
    expect(allDays[2]!.isCurrentMonth).toBe(true)
  })
})
