/**
 * Unit tests for clock-in pure helper functions.
 * These functions have no React dependencies and can be tested in isolation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import dayjs from 'dayjs'
import {
  BADGE_COLORS,
  formatTime,
  deriveCardAction,
  deriveStatus,
  deriveBorderColor,
  deriveCardBgClass,
} from './clock-in-utils'
import type { Attendance } from '@/lib/schemas'

// ─── Test Helpers ────────────────────────────────────────────────────────────

/** Create a minimal attendance record for testing. */
function makeAttendance(overrides: Partial<Attendance> = {}): Attendance {
  return {
    id: 'att-test-1',
    employeeId: 'emp-001',
    date: '2026-03-22',
    type: 'regular',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
}

// ─── formatTime ──────────────────────────────────────────────────────────────

describe('formatTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-22T10:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return formatted HH:mm when a timestamp is provided', () => {
    const ts = dayjs('2026-03-22T08:30:00').valueOf()
    expect(formatTime(ts)).toBe('08:30')
  })

  it('should return placeholder when timestamp is undefined', () => {
    expect(formatTime(undefined)).toBe('?? : ??')
  })

  it('should return placeholder when timestamp is 0', () => {
    expect(formatTime(0)).toBe('?? : ??')
  })

  it('should handle midnight timestamp', () => {
    const ts = dayjs('2026-03-22T00:00:00').valueOf()
    expect(formatTime(ts)).toBe('00:00')
  })

  it('should handle end-of-day timestamp', () => {
    const ts = dayjs('2026-03-22T23:59:00').valueOf()
    expect(formatTime(ts)).toBe('23:59')
  })
})

// ─── deriveCardAction ────────────────────────────────────────────────────────

describe('deriveCardAction', () => {
  it('should return clockIn when records array is empty', () => {
    expect(deriveCardAction([])).toBe('clockIn')
  })

  it('should return cancelVacation when last record is not regular type', () => {
    const records = [makeAttendance({ type: 'paid_leave' })]
    expect(deriveCardAction(records)).toBe('cancelVacation')
  })

  it('should return clockIn when last regular record has both clockIn and clockOut', () => {
    const records = [
      makeAttendance({
        clockIn: dayjs('2026-03-22T08:00:00').valueOf(),
        clockOut: dayjs('2026-03-22T17:00:00').valueOf(),
      }),
    ]
    expect(deriveCardAction(records)).toBe('clockIn')
  })

  it('should return clockOut when last regular record has only clockIn', () => {
    const records = [
      makeAttendance({
        clockIn: dayjs('2026-03-22T08:00:00').valueOf(),
      }),
    ]
    expect(deriveCardAction(records)).toBe('clockOut')
  })

  it('should handle multiple records and use the last one', () => {
    const records = [
      makeAttendance({
        id: 'att-1',
        clockIn: dayjs('2026-03-22T08:00:00').valueOf(),
        clockOut: dayjs('2026-03-22T12:00:00').valueOf(),
      }),
      makeAttendance({
        id: 'att-2',
        clockIn: dayjs('2026-03-22T13:00:00').valueOf(),
      }),
    ]
    // Last record has only clockIn -> clockOut
    expect(deriveCardAction(records)).toBe('clockOut')
  })

  it('should return clockIn after multiple completed shifts', () => {
    const records = [
      makeAttendance({
        id: 'att-1',
        clockIn: dayjs('2026-03-22T08:00:00').valueOf(),
        clockOut: dayjs('2026-03-22T12:00:00').valueOf(),
      }),
      makeAttendance({
        id: 'att-2',
        clockIn: dayjs('2026-03-22T13:00:00').valueOf(),
        clockOut: dayjs('2026-03-22T17:00:00').valueOf(),
      }),
    ]
    expect(deriveCardAction(records)).toBe('clockIn')
  })
})

// ─── deriveStatus ────────────────────────────────────────────────────────────

describe('deriveStatus', () => {
  it('should return default badge for empty records', () => {
    const result = deriveStatus([])
    expect(result.badgeColor).toBe(BADGE_COLORS.default)
    expect(result.badgeTextKey).toBe('clockIn.notClockedIn')
  })

  it('should return vacation badge for non-regular type', () => {
    const records = [makeAttendance({ type: 'paid_leave' })]
    const result = deriveStatus(records)
    expect(result.badgeColor).toBe(BADGE_COLORS.vacation)
    expect(result.badgeTextKey).toBe('clockIn.onVacation')
  })

  it('should return clockedOut badge when clockOut exists', () => {
    const records = [
      makeAttendance({
        clockIn: dayjs('2026-03-22T08:00:00').valueOf(),
        clockOut: dayjs('2026-03-22T17:00:00').valueOf(),
      }),
    ]
    const result = deriveStatus(records)
    expect(result.badgeColor).toBe(BADGE_COLORS.clockedOut)
    expect(result.badgeTextKey).toBe('clockIn.clockedOut')
  })

  it('should return clockedIn badge when only clockIn exists', () => {
    const records = [
      makeAttendance({
        clockIn: dayjs('2026-03-22T08:00:00').valueOf(),
      }),
    ]
    const result = deriveStatus(records)
    expect(result.badgeColor).toBe(BADGE_COLORS.clockedIn)
    expect(result.badgeTextKey).toBe('clockIn.clockedIn')
  })
})

// ─── deriveBorderColor ───────────────────────────────────────────────────────

describe('deriveBorderColor', () => {
  it('should return default color for empty records', () => {
    expect(deriveBorderColor([])).toBe(BADGE_COLORS.default)
  })

  it('should return vacation color for non-regular type', () => {
    const records = [makeAttendance({ type: 'paid_leave' })]
    expect(deriveBorderColor(records)).toBe(BADGE_COLORS.vacation)
  })

  it('should return clockedOut color when clockOut exists', () => {
    const records = [
      makeAttendance({
        clockIn: dayjs('2026-03-22T08:00:00').valueOf(),
        clockOut: dayjs('2026-03-22T17:00:00').valueOf(),
      }),
    ]
    expect(deriveBorderColor(records)).toBe(BADGE_COLORS.clockedOut)
  })

  it('should return clockedIn color when only clockIn exists', () => {
    const records = [
      makeAttendance({
        clockIn: dayjs('2026-03-22T08:00:00').valueOf(),
      }),
    ]
    expect(deriveBorderColor(records)).toBe(BADGE_COLORS.clockedIn)
  })
})

// ─── deriveCardBgClass ───────────────────────────────────────────────────────

describe('deriveCardBgClass', () => {
  it('should return empty string for empty records', () => {
    expect(deriveCardBgClass([])).toBe('')
  })

  it('should return vacation bg class for non-regular type', () => {
    const records = [makeAttendance({ type: 'paid_leave' })]
    expect(deriveCardBgClass(records)).toBe('bg-[#fef2f2]')
  })

  it('should return clockedIn bg class when only clockIn exists (clockOut action)', () => {
    const records = [
      makeAttendance({
        clockIn: dayjs('2026-03-22T08:00:00').valueOf(),
      }),
    ]
    expect(deriveCardBgClass(records)).toBe('bg-[#f0f5eb]')
  })

  it('should return clockedOut bg class when both clockIn and clockOut exist', () => {
    const records = [
      makeAttendance({
        clockIn: dayjs('2026-03-22T08:00:00').valueOf(),
        clockOut: dayjs('2026-03-22T17:00:00').valueOf(),
      }),
    ]
    expect(deriveCardBgClass(records)).toBe('bg-[#f5f0fa]')
  })
})
