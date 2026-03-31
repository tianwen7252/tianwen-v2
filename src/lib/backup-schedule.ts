/**
 * Pure utility functions for backup schedule time calculations.
 * All time calculations use Taiwan time (UTC+8).
 */

import type { ScheduleType } from '@/stores/backup-store'

// Taiwan is UTC+8
const TAIWAN_OFFSET_MS = 8 * 60 * 60 * 1000
const ONE_DAY_MS = 24 * 60 * 60 * 1000
const ONE_WEEK_MS = 7 * ONE_DAY_MS

/**
 * Get the current hour in Taiwan time (UTC+8) from a UTC timestamp.
 */
function getTaiwanDate(utcMs: number): Date {
  return new Date(utcMs + TAIWAN_OFFSET_MS)
}

/**
 * Calculate the next daily backup time in UTC milliseconds.
 * If the schedule hour has already passed today (Taiwan time), returns tomorrow.
 * If the schedule hour is exactly now, returns tomorrow.
 */
export function calculateNextDailyBackup(
  scheduleHour: number,
  nowMs: number,
): number {
  const taiwanDate = getTaiwanDate(nowMs)

  // Build today's scheduled time in Taiwan timezone
  const year = taiwanDate.getUTCFullYear()
  const month = taiwanDate.getUTCMonth()
  const day = taiwanDate.getUTCDate()

  // Scheduled time today in UTC = Taiwan scheduled time - 8 hours offset
  let scheduledUtcMs =
    Date.UTC(year, month, day, scheduleHour) - TAIWAN_OFFSET_MS

  // If the scheduled time has passed or is exactly now, move to tomorrow
  if (scheduledUtcMs <= nowMs) {
    scheduledUtcMs += ONE_DAY_MS
  }

  return scheduledUtcMs
}

/**
 * Calculate the next weekly backup time (Sunday) in UTC milliseconds.
 * If today is Sunday and the hour hasn't passed, returns today.
 * Otherwise returns the next Sunday.
 */
export function calculateNextWeeklyBackup(
  scheduleHour: number,
  nowMs: number,
): number {
  const taiwanDate = getTaiwanDate(nowMs)

  const currentDayOfWeek = taiwanDate.getUTCDay() // 0 = Sunday
  // Days until next Sunday (0 if today is Sunday)
  const daysUntilSunday = currentDayOfWeek === 0 ? 0 : 7 - currentDayOfWeek

  const year = taiwanDate.getUTCFullYear()
  const month = taiwanDate.getUTCMonth()
  const day = taiwanDate.getUTCDate()

  // Build the Sunday's scheduled time in UTC
  let scheduledUtcMs =
    Date.UTC(year, month, day + daysUntilSunday, scheduleHour) -
    TAIWAN_OFFSET_MS

  // If it's Sunday but the hour has passed or is exactly now, move to next week
  if (scheduledUtcMs <= nowMs) {
    scheduledUtcMs += ONE_WEEK_MS
  }

  return scheduledUtcMs
}

/**
 * Check if a backup is overdue based on the schedule type and last backup time.
 * - 'none': never overdue
 * - 'daily': overdue if last backup was more than 24 hours ago
 * - 'weekly': overdue if last backup was more than 7 days ago
 * - null/invalid lastBackupTime: treated as never backed up (overdue)
 */
export function isBackupOverdue(
  scheduleType: ScheduleType,
  _scheduleHour: number,
  lastBackupTime: string | null,
): boolean {
  if (scheduleType === 'none') {
    return false
  }

  if (!lastBackupTime) {
    return true
  }

  const lastTime = new Date(lastBackupTime).getTime()

  // Invalid date string
  if (Number.isNaN(lastTime)) {
    return true
  }

  const elapsed = Date.now() - lastTime
  const interval = scheduleType === 'daily' ? ONE_DAY_MS : ONE_WEEK_MS

  return elapsed > interval
}
