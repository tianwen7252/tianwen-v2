/**
 * Format an order date into a display-friendly result.
 * Returns a formatted date string (YYYY/M/D) and a label (today, yesterday, or weekday).
 */

import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FormatOrderDateResult {
  /** Formatted date string, e.g. "2026/3/24" (no zero-padding) */
  readonly formatted: string
  /** Relative label: "今天", "昨天", or weekday in Chinese */
  readonly label: string
}

// ─── Constants ──────────────────────────────────────────────────────────────

/** Weekday labels in Chinese, indexed by dayjs .day() (0=Sunday, 6=Saturday) */
const WEEKDAY_LABELS: readonly string[] = [
  '週日',
  '週一',
  '週二',
  '週三',
  '週四',
  '週五',
  '週六',
] as const

// ─── Main Function ──────────────────────────────────────────────────────────

/**
 * Format an order date for display.
 *
 * @param date - The date to format
 * @param today - Reference "today" date (defaults to dayjs() for testability)
 * @returns Formatted date string and relative label
 */
export function formatOrderDate(
  date: Dayjs,
  today?: Dayjs,
): FormatOrderDateResult {
  const referenceToday = today ?? dayjs()

  const formatted = `${date.year()}/${date.month() + 1}/${date.date()}`

  const isToday = date.isSame(referenceToday, 'day')
  const isYesterday = date.isSame(referenceToday.subtract(1, 'day'), 'day')

  let label: string
  if (isToday) {
    label = '今天'
  } else if (isYesterday) {
    label = '昨天'
  } else {
    label = WEEKDAY_LABELS[date.day()]!
  }

  return { formatted, label }
}
