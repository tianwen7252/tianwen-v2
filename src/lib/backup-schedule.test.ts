/**
 * Tests for backup schedule time calculation utilities.
 * Pure functions tested without React hook complexity.
 */

import { describe, it, expect } from 'vitest'
import {
  calculateNextDailyBackup,
  calculateNextWeeklyBackup,
  isBackupOverdue,
} from './backup-schedule'

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Create a Date in Taiwan time (UTC+8) and return its UTC milliseconds.
 * month is 1-indexed for clarity.
 */
function taiwanDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
): number {
  // Taiwan is UTC+8, so we subtract 8 hours to get UTC
  const utcHour = hour - 8
  return Date.UTC(year, month - 1, day, utcHour, minute)
}

// ── calculateNextDailyBackup ───────────────────────────────────────────────

describe('calculateNextDailyBackup', () => {
  it('returns later today if schedule hour has not passed yet', () => {
    // Now: 2025-06-15 10:00 Taiwan time => schedule at 22:00 today
    const now = taiwanDate(2025, 6, 15, 10, 0)
    const result = calculateNextDailyBackup(22, now)
    const expected = taiwanDate(2025, 6, 15, 22, 0)
    expect(result).toBe(expected)
  })

  it('returns tomorrow if schedule hour has already passed', () => {
    // Now: 2025-06-15 23:00 Taiwan time => schedule at 22:00 tomorrow
    const now = taiwanDate(2025, 6, 15, 23, 0)
    const result = calculateNextDailyBackup(22, now)
    const expected = taiwanDate(2025, 6, 16, 22, 0)
    expect(result).toBe(expected)
  })

  it('returns tomorrow if schedule hour is exactly now', () => {
    // Now: 2025-06-15 22:00 Taiwan time => schedule at 22:00 tomorrow
    const now = taiwanDate(2025, 6, 15, 22, 0)
    const result = calculateNextDailyBackup(22, now)
    const expected = taiwanDate(2025, 6, 16, 22, 0)
    expect(result).toBe(expected)
  })

  it('handles midnight (hour=0) schedule', () => {
    // Now: 2025-06-15 01:00 Taiwan time => schedule at 00:00 tomorrow
    // (hour 0 has passed)
    const now = taiwanDate(2025, 6, 15, 1, 0)
    const result = calculateNextDailyBackup(0, now)
    const expected = taiwanDate(2025, 6, 16, 0, 0)
    expect(result).toBe(expected)
  })

  it('handles hour=0 schedule when current hour is 23', () => {
    // Now: 2025-06-15 23:00 Taiwan time => schedule at 00:00 next day
    const now = taiwanDate(2025, 6, 15, 23, 0)
    const result = calculateNextDailyBackup(0, now)
    const expected = taiwanDate(2025, 6, 16, 0, 0)
    expect(result).toBe(expected)
  })

  it('handles month boundary', () => {
    // Now: 2025-06-30 23:00 Taiwan time => schedule at 22:00 next day (July 1)
    const now = taiwanDate(2025, 6, 30, 23, 0)
    const result = calculateNextDailyBackup(22, now)
    const expected = taiwanDate(2025, 7, 1, 22, 0)
    expect(result).toBe(expected)
  })

  it('handles year boundary', () => {
    // Now: 2025-12-31 23:00 Taiwan time => schedule at 22:00 next day (Jan 1 2026)
    const now = taiwanDate(2025, 12, 31, 23, 0)
    const result = calculateNextDailyBackup(22, now)
    const expected = taiwanDate(2026, 1, 1, 22, 0)
    expect(result).toBe(expected)
  })

  it('returns a future timestamp (always > now)', () => {
    const now = Date.now()
    const result = calculateNextDailyBackup(14, now)
    expect(result).toBeGreaterThan(now)
  })
})

// ── calculateNextWeeklyBackup ──────────────────────────────────────────────

describe('calculateNextWeeklyBackup', () => {
  it('returns this Sunday if today is before Sunday', () => {
    // 2025-06-11 is Wednesday => next Sunday is 2025-06-15
    const now = taiwanDate(2025, 6, 11, 10, 0) // Wed 10:00
    const result = calculateNextWeeklyBackup(22, now)
    const expected = taiwanDate(2025, 6, 15, 22, 0) // Sun 22:00
    expect(result).toBe(expected)
  })

  it('returns next Sunday if today is Sunday but hour has passed', () => {
    // 2025-06-15 is Sunday, 23:00 => next Sunday 2025-06-22
    const now = taiwanDate(2025, 6, 15, 23, 0)
    const result = calculateNextWeeklyBackup(22, now)
    const expected = taiwanDate(2025, 6, 22, 22, 0)
    expect(result).toBe(expected)
  })

  it('returns today if it is Sunday and hour has not passed', () => {
    // 2025-06-15 is Sunday, 10:00 => today 22:00
    const now = taiwanDate(2025, 6, 15, 10, 0)
    const result = calculateNextWeeklyBackup(22, now)
    const expected = taiwanDate(2025, 6, 15, 22, 0)
    expect(result).toBe(expected)
  })

  it('returns next Sunday if today is Sunday and hour is exactly now', () => {
    // 2025-06-15 is Sunday, 22:00 => next Sunday 2025-06-22
    const now = taiwanDate(2025, 6, 15, 22, 0)
    const result = calculateNextWeeklyBackup(22, now)
    const expected = taiwanDate(2025, 6, 22, 22, 0)
    expect(result).toBe(expected)
  })

  it('handles Saturday (1 day before Sunday)', () => {
    // 2025-06-14 is Saturday => next Sunday 2025-06-15
    const now = taiwanDate(2025, 6, 14, 10, 0)
    const result = calculateNextWeeklyBackup(3, now)
    const expected = taiwanDate(2025, 6, 15, 3, 0)
    expect(result).toBe(expected)
  })

  it('handles Monday (6 days before Sunday)', () => {
    // 2025-06-09 is Monday => next Sunday 2025-06-15
    const now = taiwanDate(2025, 6, 9, 10, 0)
    const result = calculateNextWeeklyBackup(22, now)
    const expected = taiwanDate(2025, 6, 15, 22, 0)
    expect(result).toBe(expected)
  })

  it('handles month boundary for weekly schedule', () => {
    // 2025-06-28 is Saturday => next Sunday 2025-06-29
    const now = taiwanDate(2025, 6, 28, 10, 0)
    const result = calculateNextWeeklyBackup(22, now)
    const expected = taiwanDate(2025, 6, 29, 22, 0)
    expect(result).toBe(expected)
  })

  it('returns a future timestamp (always > now)', () => {
    const now = Date.now()
    const result = calculateNextWeeklyBackup(14, now)
    expect(result).toBeGreaterThan(now)
  })
})

// ── isBackupOverdue ────────────────────────────────────────────────────────

describe('isBackupOverdue', () => {
  it('returns false when scheduleType is none', () => {
    expect(isBackupOverdue('none', 22, null)).toBe(false)
  })

  it('returns true when lastBackupTime is null (never backed up) and schedule is daily', () => {
    expect(isBackupOverdue('daily', 22, null)).toBe(true)
  })

  it('returns true when lastBackupTime is null and schedule is weekly', () => {
    expect(isBackupOverdue('weekly', 22, null)).toBe(true)
  })

  it('returns false when daily backup was done recently', () => {
    // Last backup was 2 hours ago
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    expect(isBackupOverdue('daily', 22, twoHoursAgo)).toBe(false)
  })

  it('returns true when daily backup was more than 24 hours ago', () => {
    const thirtyHoursAgo = new Date(
      Date.now() - 30 * 60 * 60 * 1000,
    ).toISOString()
    expect(isBackupOverdue('daily', 22, thirtyHoursAgo)).toBe(true)
  })

  it('returns false when weekly backup was done 3 days ago', () => {
    const threeDaysAgo = new Date(
      Date.now() - 3 * 24 * 60 * 60 * 1000,
    ).toISOString()
    expect(isBackupOverdue('weekly', 22, threeDaysAgo)).toBe(false)
  })

  it('returns true when weekly backup was more than 7 days ago', () => {
    const eightDaysAgo = new Date(
      Date.now() - 8 * 24 * 60 * 60 * 1000,
    ).toISOString()
    expect(isBackupOverdue('weekly', 22, eightDaysAgo)).toBe(true)
  })

  it('returns false for invalid lastBackupTime string with schedule none', () => {
    expect(isBackupOverdue('none', 22, 'invalid-date')).toBe(false)
  })

  it('returns true for invalid lastBackupTime string with active schedule', () => {
    // Invalid date should be treated as never backed up
    expect(isBackupOverdue('daily', 22, 'invalid-date')).toBe(true)
  })
})
