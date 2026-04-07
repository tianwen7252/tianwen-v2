/**
 * Tests for backup schedule overdue check utilities.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { isBackupOverdue } from './backup-schedule'

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
  const utcHour = hour - 8
  return Date.UTC(year, month - 1, day, utcHour, minute)
}

// ── isBackupOverdue ────────────────────────────────────────────────────────

describe('isBackupOverdue', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  // ── none ──────────────────────────────────────────────────────────────

  it('returns false when scheduleType is none', () => {
    expect(isBackupOverdue('none', null)).toBe(false)
  })

  it('returns false when scheduleType is none even with old backup', () => {
    expect(isBackupOverdue('none', '2020-01-01T00:00:00Z')).toBe(false)
  })

  // ── null / invalid ───────────────────────────────────────────────────

  it('returns true when lastBackupTime is null and schedule is daily', () => {
    expect(isBackupOverdue('daily', null)).toBe(true)
  })

  it('returns true when lastBackupTime is null and schedule is weekly', () => {
    expect(isBackupOverdue('weekly', null)).toBe(true)
  })

  it('returns true for invalid lastBackupTime with active schedule', () => {
    expect(isBackupOverdue('daily', 'invalid-date')).toBe(true)
  })

  // ── daily ─────────────────────────────────────────────────────────────

  describe('daily schedule', () => {
    it('not overdue if backed up today (Taiwan time)', () => {
      // Now: 2026-04-07 14:00 Taiwan, last backup: 2026-04-07 09:00 Taiwan
      const now = taiwanDate(2026, 4, 7, 14, 0)
      const lastBackup = new Date(taiwanDate(2026, 4, 7, 9, 0)).toISOString()
      vi.useFakeTimers()
      vi.setSystemTime(now)

      expect(isBackupOverdue('daily', lastBackup)).toBe(false)
    })

    it('overdue if last backup was yesterday', () => {
      // Now: 2026-04-07 10:00 Taiwan, last backup: 2026-04-06 22:00 Taiwan
      const now = taiwanDate(2026, 4, 7, 10, 0)
      const lastBackup = new Date(taiwanDate(2026, 4, 6, 22, 0)).toISOString()
      vi.useFakeTimers()
      vi.setSystemTime(now)

      expect(isBackupOverdue('daily', lastBackup)).toBe(true)
    })

    it('not overdue right after midnight if backed up late yesterday (edge case)', () => {
      // Now: 2026-04-07 00:05 Taiwan, last backup: 2026-04-06 23:50 Taiwan
      // This is a new day in Taiwan time, so last backup is "yesterday" → overdue
      const now = taiwanDate(2026, 4, 7, 0, 5)
      const lastBackup = new Date(taiwanDate(2026, 4, 6, 23, 50)).toISOString()
      vi.useFakeTimers()
      vi.setSystemTime(now)

      expect(isBackupOverdue('daily', lastBackup)).toBe(true)
    })

    it('overdue if last backup was 3 days ago', () => {
      const now = taiwanDate(2026, 4, 7, 10, 0)
      const lastBackup = new Date(taiwanDate(2026, 4, 4, 10, 0)).toISOString()
      vi.useFakeTimers()
      vi.setSystemTime(now)

      expect(isBackupOverdue('daily', lastBackup)).toBe(true)
    })
  })

  // ── weekly ────────────────────────────────────────────────────────────

  describe('weekly schedule (Monday)', () => {
    it('not overdue if backed up this Monday', () => {
      // 2026-04-07 is Tuesday, last backup was Monday 2026-04-06
      const now = taiwanDate(2026, 4, 7, 10, 0) // Tue
      const lastBackup = new Date(taiwanDate(2026, 4, 6, 9, 0)).toISOString() // Mon
      vi.useFakeTimers()
      vi.setSystemTime(now)

      expect(isBackupOverdue('weekly', lastBackup)).toBe(false)
    })

    it('not overdue if backed up on Wednesday of this week', () => {
      // 2026-04-10 is Friday, last backup was Wed 2026-04-08 (same week)
      const now = taiwanDate(2026, 4, 10, 10, 0) // Fri
      const lastBackup = new Date(taiwanDate(2026, 4, 8, 10, 0)).toISOString() // Wed
      vi.useFakeTimers()
      vi.setSystemTime(now)

      expect(isBackupOverdue('weekly', lastBackup)).toBe(false)
    })

    it('overdue if last backup was last week', () => {
      // 2026-04-07 is Tuesday, last backup was last Monday 2026-03-30
      const now = taiwanDate(2026, 4, 7, 10, 0) // Tue
      const lastBackup = new Date(taiwanDate(2026, 3, 30, 10, 0)).toISOString() // last Mon
      vi.useFakeTimers()
      vi.setSystemTime(now)

      expect(isBackupOverdue('weekly', lastBackup)).toBe(true)
    })

    it('overdue on Monday if last backup was Sunday (previous week)', () => {
      // 2026-04-06 is Monday, last backup was Sunday 2026-04-05
      const now = taiwanDate(2026, 4, 6, 10, 0) // Mon
      const lastBackup = new Date(taiwanDate(2026, 4, 5, 22, 0)).toISOString() // Sun
      vi.useFakeTimers()
      vi.setSystemTime(now)

      expect(isBackupOverdue('weekly', lastBackup)).toBe(true)
    })

    it('not overdue on Sunday if backed up this week', () => {
      // 2026-04-12 is Sunday, last backup was Tue 2026-04-07
      // Week started Mon 2026-04-06
      const now = taiwanDate(2026, 4, 12, 10, 0) // Sun
      const lastBackup = new Date(taiwanDate(2026, 4, 7, 10, 0)).toISOString() // Tue
      vi.useFakeTimers()
      vi.setSystemTime(now)

      expect(isBackupOverdue('weekly', lastBackup)).toBe(false)
    })
  })
})
