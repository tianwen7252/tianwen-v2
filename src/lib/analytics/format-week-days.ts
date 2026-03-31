/**
 * Utility to pad sparse DailyRevenue arrays from DB into a full date-range array.
 */

import type { DailyRevenue } from '@/lib/repositories/statistics-repository'

/**
 * Given a sparse DailyRevenue[] from the DB, returns a full array covering
 * every day from startDate to endDate (inclusive) in ascending order.
 * Missing days get revenue=0. Dates outside the range are excluded.
 * Does not mutate the input.
 */
export function formatWeekDays(
  data: DailyRevenue[],
  startDate: Date,
  endDate: Date,
): DailyRevenue[] {
  const revenueByDate = new Map<string, number>(
    data.map(d => [d.date, d.revenue]),
  )

  const result: DailyRevenue[] = []
  const current = new Date(startDate)
  current.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)

  while (current <= end) {
    const dateStr = formatDate(current)
    result.push({ date: dateStr, revenue: revenueByDate.get(dateStr) ?? 0 })
    current.setDate(current.getDate() + 1)
  }

  return result
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
