/**
 * Pure helper functions for the ClockIn feature.
 * No React dependencies — only data transformation logic.
 */

import dayjs from 'dayjs'
import type { ClockInAction } from '@/components/clock-in-modal'
import type { Attendance } from '@/lib/schemas'

// ─── Constants ───────────────────────────────────────────────────────────────

export const BADGE_COLORS = {
  default: '#dbe3d2',
  clockedIn: '#7f956a',
  clockedOut: '#cab3f3',
  vacation: '#f88181',
} as const

// ─── Pure Helper Functions ───────────────────────────────────────────────────

/** Format a timestamp to HH:mm, or return placeholder when absent. */
export function formatTime(ts?: number): string {
  return ts ? dayjs(ts).format('HH:mm') : '?? : ??'
}

/** Derive the correct action from an employee's attendance records. */
export function deriveCardAction(
  records: readonly Attendance[],
): ClockInAction {
  if (records.length === 0) return 'clockIn'
  const lastRecord = records[records.length - 1]!
  if (lastRecord.type !== 'regular') return 'cancelVacation'
  // Completed shift (both clockIn and clockOut) -> start new shift
  if (lastRecord.clockIn !== undefined && lastRecord.clockOut !== undefined)
    return 'clockIn'
  // Only clockIn exists -> clock out
  return 'clockOut'
}

/** Determine status badge configuration from attendance records. */
export function deriveStatus(records: readonly Attendance[]): {
  badgeColor: string
  badgeTextKey: string
} {
  if (records.length === 0) {
    return {
      badgeColor: BADGE_COLORS.default,
      badgeTextKey: 'clockIn.notClockedIn',
    }
  }
  const lastRecord = records[records.length - 1]!
  if (lastRecord.type !== 'regular') {
    return {
      badgeColor: BADGE_COLORS.vacation,
      badgeTextKey: 'clockIn.onVacation',
    }
  }
  if (lastRecord.clockOut) {
    return {
      badgeColor: BADGE_COLORS.clockedOut,
      badgeTextKey: 'clockIn.clockedOut',
    }
  }
  return {
    badgeColor: BADGE_COLORS.clockedIn,
    badgeTextKey: 'clockIn.clockedIn',
  }
}

/** Determine avatar border color from attendance state. */
export function deriveBorderColor(records: readonly Attendance[]): string {
  if (records.length === 0) return BADGE_COLORS.default
  const lastRecord = records[records.length - 1]!
  if (lastRecord.type !== 'regular') return BADGE_COLORS.vacation
  if (lastRecord.clockOut) return BADGE_COLORS.clockedOut
  return BADGE_COLORS.clockedIn
}

/** Determine card background class from attendance state. */
export function deriveCardBgClass(records: readonly Attendance[]): string {
  if (records.length === 0) return ''
  const lastRecord = records[records.length - 1]!
  const isVacation = lastRecord.type !== 'regular'
  if (isVacation) return 'bg-[#fef2f2]'
  const action = deriveCardAction(records)
  if (action === 'clockOut') return 'bg-[#f0f5eb]'
  // Clocked out (completed shift, action === 'clockIn')
  return 'bg-[#f5f0fa]'
}
