/**
 * Tests for formatWeekDays utility.
 * Ensures all days in a date range have a slot even if missing from DB output.
 */

import { describe, it, expect } from 'vitest'
import type { DailyRevenue } from '@/lib/repositories/statistics-repository'
import { formatWeekDays } from './format-week-days'

describe('formatWeekDays', () => {
  it('fills all days in a 7-day range when input is empty', () => {
    const start = new Date('2026-03-01')
    const end = new Date('2026-03-07')
    const result = formatWeekDays([], start, end)
    expect(result).toHaveLength(7)
  })

  it('returns dates in ascending order', () => {
    const start = new Date('2026-03-01')
    const end = new Date('2026-03-03')
    const result = formatWeekDays([], start, end)
    expect(result[0]!.date).toBe('2026-03-01')
    expect(result[1]!.date).toBe('2026-03-02')
    expect(result[2]!.date).toBe('2026-03-03')
  })

  it('sets revenue to 0 for days not in input', () => {
    const start = new Date('2026-03-01')
    const end = new Date('2026-03-03')
    const result = formatWeekDays([], start, end)
    result.forEach(r => expect(r.revenue).toBe(0))
  })

  it('preserves existing revenue for days in input', () => {
    const input: DailyRevenue[] = [{ date: '2026-03-02', revenue: 1500 }]
    const start = new Date('2026-03-01')
    const end = new Date('2026-03-03')
    const result = formatWeekDays(input, start, end)
    expect(result.find(r => r.date === '2026-03-01')!.revenue).toBe(0)
    expect(result.find(r => r.date === '2026-03-02')!.revenue).toBe(1500)
    expect(result.find(r => r.date === '2026-03-03')!.revenue).toBe(0)
  })

  it('handles a single-day range', () => {
    const day = new Date('2026-03-15')
    const result = formatWeekDays([], day, day)
    expect(result).toHaveLength(1)
    expect(result[0]!.date).toBe('2026-03-15')
    expect(result[0]!.revenue).toBe(0)
  })

  it('handles a single-day range with a matching input', () => {
    const input: DailyRevenue[] = [{ date: '2026-03-15', revenue: 9999 }]
    const day = new Date('2026-03-15')
    const result = formatWeekDays(input, day, day)
    expect(result).toHaveLength(1)
    expect(result[0]!.revenue).toBe(9999)
  })

  it('handles a full month range', () => {
    const start = new Date('2026-03-01')
    const end = new Date('2026-03-31')
    const result = formatWeekDays([], start, end)
    expect(result).toHaveLength(31)
  })

  it('does not mutate the input array', () => {
    const input: DailyRevenue[] = [{ date: '2026-03-01', revenue: 100 }]
    const original = [...input]
    formatWeekDays(input, new Date('2026-03-01'), new Date('2026-03-03'))
    expect(input).toEqual(original)
  })

  it('ignores input dates outside the range', () => {
    const input: DailyRevenue[] = [
      { date: '2026-02-28', revenue: 500 }, // before range
      { date: '2026-03-10', revenue: 800 }, // inside range
      { date: '2026-03-11', revenue: 200 }, // inside range
    ]
    const start = new Date('2026-03-10')
    const end = new Date('2026-03-11')
    const result = formatWeekDays(input, start, end)
    expect(result).toHaveLength(2)
    expect(result.find(r => r.date === '2026-03-10')!.revenue).toBe(800)
    expect(result.find(r => r.date === '2026-03-11')!.revenue).toBe(200)
    // Out-of-range date should not appear
    expect(result.find(r => r.date === '2026-02-28')).toBeUndefined()
  })
})
