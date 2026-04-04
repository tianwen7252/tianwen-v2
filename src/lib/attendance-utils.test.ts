import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import type { Attendance } from '@/lib/schemas'
import {
  buildTimestamp,
  calcTotalHours,
  formatTotalHours,
} from './attendance-utils'

// ─── Helper: create an Attendance record for testing ─────────────────────────

const makeAttendance = (overrides: Partial<Attendance> = {}): Attendance => ({
  id: 'att-1',
  employeeId: 'emp-1',
  date: '2025-06-15',
  type: 'regular',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
})

// ─── buildTimestamp ──────────────────────────────────────────────────────────

describe('buildTimestamp', () => {
  it('returns undefined when timeValue is null', () => {
    expect(buildTimestamp('2025-06-15', null)).toBeUndefined()
  })

  it('returns undefined when timeValue is undefined', () => {
    expect(buildTimestamp('2025-06-15', undefined)).toBeUndefined()
  })

  it('returns correct timestamp for a valid date and time', () => {
    const time = dayjs('2025-06-15T09:30:45')
    const result = buildTimestamp('2025-06-15', time)

    const expected = dayjs('2025-06-15').hour(9).minute(30).second(45).valueOf()

    expect(result).toBe(expected)
  })

  it('combines date string with time from a different date object', () => {
    // Time comes from a different day — only h/m/s should be used
    const time = dayjs('2025-01-01T14:15:00')
    const result = buildTimestamp('2025-06-15', time)

    const expected = dayjs('2025-06-15').hour(14).minute(15).second(0).valueOf()

    expect(result).toBe(expected)
  })

  it('handles midnight (00:00:00)', () => {
    const time = dayjs('2025-06-15T00:00:00')
    const result = buildTimestamp('2025-06-15', time)

    const expected = dayjs('2025-06-15').hour(0).minute(0).second(0).valueOf()

    expect(result).toBe(expected)
  })

  it('handles end of day (23:59:59)', () => {
    const time = dayjs('2025-06-15T23:59:59')
    const result = buildTimestamp('2025-06-15', time)

    const expected = dayjs('2025-06-15')
      .hour(23)
      .minute(59)
      .second(59)
      .valueOf()

    expect(result).toBe(expected)
  })
})

// ─── calcTotalHours ─────────────────────────────────────────────────────────

describe('calcTotalHours', () => {
  it('returns 0 for an empty array', () => {
    expect(calcTotalHours([])).toBe(0)
  })

  it('calculates hours for a single regular shift', () => {
    const clockIn = dayjs('2025-06-15T09:00:00').valueOf()
    const clockOut = dayjs('2025-06-15T17:00:00').valueOf()

    const shifts: readonly Attendance[] = [
      makeAttendance({ clockIn, clockOut }),
    ]

    expect(calcTotalHours(shifts)).toBe(8)
  })

  it('calculates hours for multiple regular shifts', () => {
    const shift1 = makeAttendance({
      id: 'att-1',
      clockIn: dayjs('2025-06-15T09:00:00').valueOf(),
      clockOut: dayjs('2025-06-15T13:00:00').valueOf(), // 4h
    })
    const shift2 = makeAttendance({
      id: 'att-2',
      clockIn: dayjs('2025-06-15T14:00:00').valueOf(),
      clockOut: dayjs('2025-06-15T18:00:00').valueOf(), // 4h
    })

    expect(calcTotalHours([shift1, shift2])).toBe(8)
  })

  it('skips paid_leave attendance type', () => {
    const shift = makeAttendance({
      type: 'paid_leave',
      clockIn: dayjs('2025-06-15T09:00:00').valueOf(),
      clockOut: dayjs('2025-06-15T17:00:00').valueOf(),
    })

    expect(calcTotalHours([shift])).toBe(0)
  })

  it('skips sick_leave attendance type', () => {
    const shift = makeAttendance({
      type: 'sick_leave',
      clockIn: dayjs('2025-06-15T09:00:00').valueOf(),
      clockOut: dayjs('2025-06-15T17:00:00').valueOf(),
    })

    expect(calcTotalHours([shift])).toBe(0)
  })

  it('skips personal_leave attendance type', () => {
    const shift = makeAttendance({
      type: 'personal_leave',
      clockIn: dayjs('2025-06-15T09:00:00').valueOf(),
      clockOut: dayjs('2025-06-15T17:00:00').valueOf(),
    })

    expect(calcTotalHours([shift])).toBe(0)
  })

  it('skips absent attendance type', () => {
    const shift = makeAttendance({
      type: 'absent',
      clockIn: dayjs('2025-06-15T09:00:00').valueOf(),
      clockOut: dayjs('2025-06-15T17:00:00').valueOf(),
    })

    expect(calcTotalHours([shift])).toBe(0)
  })

  it('skips shifts with missing clockIn', () => {
    const shift = makeAttendance({
      clockOut: dayjs('2025-06-15T17:00:00').valueOf(),
      // clockIn intentionally omitted
    })

    expect(calcTotalHours([shift])).toBe(0)
  })

  it('skips shifts with missing clockOut', () => {
    const shift = makeAttendance({
      clockIn: dayjs('2025-06-15T09:00:00').valueOf(),
      // clockOut intentionally omitted
    })

    expect(calcTotalHours([shift])).toBe(0)
  })

  it('handles mixed regular and non-regular shifts', () => {
    const regular = makeAttendance({
      id: 'att-1',
      type: 'regular',
      clockIn: dayjs('2025-06-15T09:00:00').valueOf(),
      clockOut: dayjs('2025-06-15T17:00:00').valueOf(), // 8h
    })
    const leave = makeAttendance({
      id: 'att-2',
      type: 'paid_leave',
      clockIn: dayjs('2025-06-16T09:00:00').valueOf(),
      clockOut: dayjs('2025-06-16T17:00:00').valueOf(), // skipped
    })
    const incomplete = makeAttendance({
      id: 'att-3',
      type: 'regular',
      clockIn: dayjs('2025-06-17T09:00:00').valueOf(),
      // no clockOut — skipped
    })
    const regular2 = makeAttendance({
      id: 'att-4',
      type: 'regular',
      clockIn: dayjs('2025-06-18T10:00:00').valueOf(),
      clockOut: dayjs('2025-06-18T14:30:00').valueOf(), // 4.5h
    })

    expect(calcTotalHours([regular, leave, incomplete, regular2])).toBe(12.5)
  })

  it('returns fractional hours correctly', () => {
    const clockIn = dayjs('2025-06-15T09:00:00').valueOf()
    const clockOut = dayjs('2025-06-15T09:30:00').valueOf() // 0.5h

    const shifts: readonly Attendance[] = [
      makeAttendance({ clockIn, clockOut }),
    ]

    expect(calcTotalHours(shifts)).toBe(0.5)
  })
})

// ─── formatTotalHours ───────────────────────────────────────────────────────

describe('formatTotalHours', () => {
  it('returns "0h" for 0', () => {
    expect(formatTotalHours(0)).toBe('0h')
  })

  it('returns "0h" for negative values', () => {
    expect(formatTotalHours(-1)).toBe('0h')
    expect(formatTotalHours(-0.5)).toBe('0h')
  })

  it('returns minutes format for values less than 1 hour', () => {
    expect(formatTotalHours(0.5)).toBe('30m')
  })

  it('returns minimum "1m" for very small positive values', () => {
    expect(formatTotalHours(0.001)).toBe('1m')
  })

  it('returns "15m" for quarter hour', () => {
    expect(formatTotalHours(0.25)).toBe('15m')
  })

  it('returns "45m" for three-quarter hour', () => {
    expect(formatTotalHours(0.75)).toBe('45m')
  })

  it('returns hours format for exactly 1 hour', () => {
    expect(formatTotalHours(1)).toBe('1h')
  })

  it('returns hours format for whole hours', () => {
    expect(formatTotalHours(8)).toBe('8h')
  })

  it('returns hours format with 1 decimal for fractional hours', () => {
    expect(formatTotalHours(4.5)).toBe('4.5h')
  })

  it('rounds to 1 decimal place', () => {
    // 8.333... should round to 8.3
    expect(formatTotalHours(8.333)).toBe('8.3h')
    // 8.666... should round to 8.7
    expect(formatTotalHours(8.666)).toBe('8.7h')
  })

  it('drops .0 for values that round to whole numbers', () => {
    // Math.round(8.04 * 10) / 10 = 8.0 -> "8h"
    expect(formatTotalHours(8.04)).toBe('8h')
  })
})
