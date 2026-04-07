/**
 * Pure utility functions for backup schedule overdue checks.
 * All time calculations use Taiwan time (UTC+8).
 *
 * Schedule rules:
 * - daily: backup once per day. If missed today, skip (no retroactive backup).
 * - weekly: backup every Monday. If Monday is missed, backup immediately.
 */

import type { ScheduleType } from '@/stores/backup-store'

// Taiwan is UTC+8
const TAIWAN_OFFSET_MS = 8 * 60 * 60 * 1000

/**
 * Get the start of "today" in Taiwan time (UTC+8) as UTC milliseconds.
 */
function getTaiwanDayStart(utcMs: number): number {
  const taiwanDate = new Date(utcMs + TAIWAN_OFFSET_MS)
  return (
    Date.UTC(
      taiwanDate.getUTCFullYear(),
      taiwanDate.getUTCMonth(),
      taiwanDate.getUTCDate(),
    ) - TAIWAN_OFFSET_MS
  )
}

/**
 * Get the start of this week's Monday in Taiwan time as UTC milliseconds.
 * If today is Monday, returns today's start.
 */
function getTaiwanWeekStart(utcMs: number): number {
  const taiwanDate = new Date(utcMs + TAIWAN_OFFSET_MS)
  const dayOfWeek = taiwanDate.getUTCDay() // 0=Sun, 1=Mon, ...
  // Days since Monday (Monday=0, Tue=1, ..., Sun=6)
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  return (
    Date.UTC(
      taiwanDate.getUTCFullYear(),
      taiwanDate.getUTCMonth(),
      taiwanDate.getUTCDate() - daysSinceMonday,
    ) - TAIWAN_OFFSET_MS
  )
}

/**
 * Check if a backup is overdue based on the schedule type.
 *
 * - 'none': never overdue
 * - 'daily': overdue if no backup today (Taiwan time). If today passes
 *   without a backup, it is NOT retroactively overdue tomorrow.
 * - 'weekly': overdue if no backup since this week's Monday (Taiwan time).
 *   If Monday is missed, backup immediately on the next app open.
 */
export function isBackupOverdue(
  scheduleType: ScheduleType,
  lastBackupTime: string | null,
): boolean {
  if (scheduleType === 'none') {
    return false
  }

  if (!lastBackupTime) {
    return true
  }

  const lastTime = new Date(lastBackupTime).getTime()
  if (Number.isNaN(lastTime)) {
    return true
  }

  const now = Date.now()

  if (scheduleType === 'daily') {
    // Overdue if last backup was before today (Taiwan time)
    const todayStart = getTaiwanDayStart(now)
    return lastTime < todayStart
  }

  // weekly: overdue if last backup was before this week's Monday
  const weekStart = getTaiwanWeekStart(now)
  return lastTime < weekStart
}
