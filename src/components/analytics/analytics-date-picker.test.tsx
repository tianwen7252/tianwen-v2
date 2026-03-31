/**
 * Tests for AnalyticsDatePicker component.
 * Verifies quick preset buttons call onChange with correct date ranges,
 * month navigation works, and active preset detection with correct aria-pressed state.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { AnalyticsDatePicker, getActivePreset } from './analytics-date-picker'

// ─── Fixed reference dates ────────────────────────────────────────────────────

const START_DATE = new Date('2026-03-01T00:00:00.000')
const END_DATE = new Date('2026-03-31T23:59:59.999')

// ─── Default props ────────────────────────────────────────────────────────────

function makeProps(
  overrides: Partial<{
    startDate: Date
    endDate: Date
    onChange: (start: Date, end: Date) => void
  }> = {},
) {
  return {
    startDate: START_DATE,
    endDate: END_DATE,
    onChange: vi.fn(),
    ...overrides,
  }
}

describe('AnalyticsDatePicker', () => {
  // ── Preset: 今日 ────────────────────────────────────────────────────────────

  it('calls onChange with today start (00:00) and end (23:59) when 今日 is clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<AnalyticsDatePicker {...makeProps({ onChange })} />)

    await user.click(screen.getByRole('button', { name: '今日' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    const [start, end] = onChange.mock.calls[0] as [Date, Date]
    const today = dayjs().format('YYYY-MM-DD')
    expect(dayjs(start).format('YYYY-MM-DD HH:mm:ss')).toBe(`${today} 00:00:00`)
    expect(dayjs(end).format('YYYY-MM-DD HH:mm:ss')).toBe(`${today} 23:59:59`)
  })

  // ── Preset: 本週 ────────────────────────────────────────────────────────────

  it('calls onChange when 本週 is clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<AnalyticsDatePicker {...makeProps({ onChange })} />)

    await user.click(screen.getByRole('button', { name: '本週' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    const [start] = onChange.mock.calls[0] as [Date, Date]
    expect(dayjs(start).isSame(dayjs().startOf('week'), 'day')).toBe(true)
  })

  // ── Preset: 本月 ────────────────────────────────────────────────────────────

  it('calls onChange with current month start/end when 本月 is clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<AnalyticsDatePicker {...makeProps({ onChange })} />)

    await user.click(screen.getByRole('button', { name: '本月' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    const [start, end] = onChange.mock.calls[0] as [Date, Date]
    const thisMonth = dayjs().format('YYYY-MM')
    expect(dayjs(start).format('YYYY-MM-DD')).toBe(
      dayjs().startOf('month').format('YYYY-MM-DD'),
    )
    expect(dayjs(end).format('YYYY-MM')).toBe(thisMonth)
  })

  // ── Preset: 上月 ────────────────────────────────────────────────────────────

  it('calls onChange with last month start/end when 上月 is clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<AnalyticsDatePicker {...makeProps({ onChange })} />)

    await user.click(screen.getByRole('button', { name: '上月' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    const [start, end] = onChange.mock.calls[0] as [Date, Date]
    const lastMonth = dayjs().subtract(1, 'month')
    expect(dayjs(start).format('YYYY-MM-DD')).toBe(
      lastMonth.startOf('month').format('YYYY-MM-DD'),
    )
    expect(dayjs(end).format('YYYY-MM-DD')).toBe(
      lastMonth.endOf('month').format('YYYY-MM-DD'),
    )
  })

  // ── All four preset buttons are always visible ─────────────────────────────

  it('renders all four preset buttons', () => {
    render(<AnalyticsDatePicker {...makeProps()} />)
    expect(screen.getByRole('button', { name: '今日' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '本週' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '本月' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '上月' })).toBeTruthy()
  })

  // ── Prev day navigation ─────────────────────────────────────────────────────

  it('calls onChange with previous day when 前一天 is clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<AnalyticsDatePicker {...makeProps({ onChange })} />)

    await user.click(screen.getByRole('button', { name: '前一天' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    const [start, end] = onChange.mock.calls[0] as [Date, Date]
    expect(dayjs(start).format('YYYY-MM-DD')).toBe('2026-02-28')
    expect(dayjs(end).format('YYYY-MM-DD')).toBe('2026-02-28')
  })

  // ── Next day navigation ────────────────────────────────────────────────────

  it('calls onChange with next day when 後一天 is clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<AnalyticsDatePicker {...makeProps({ onChange })} />)

    await user.click(screen.getByRole('button', { name: '後一天' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    const [start, end] = onChange.mock.calls[0] as [Date, Date]
    expect(dayjs(start).format('YYYY-MM-DD')).toBe('2026-03-02')
    expect(dayjs(end).format('YYYY-MM-DD')).toBe('2026-03-02')
  })

  // ── getActivePreset utility ─────────────────────────────────────────────────

  describe('getActivePreset', () => {
    it('returns "analytics.today" key when start/end match today boundaries', () => {
      const start = dayjs().startOf('day').toDate()
      const end = dayjs().endOf('day').toDate()
      expect(getActivePreset(start, end)).toBe('analytics.today')
    })

    it('returns "analytics.thisWeek" key when start/end match this week boundaries', () => {
      const start = dayjs().startOf('week').toDate()
      const end = dayjs().endOf('week').toDate()
      expect(getActivePreset(start, end)).toBe('analytics.thisWeek')
    })

    it('returns "analytics.thisMonth" key when start/end match this month boundaries', () => {
      const start = dayjs().startOf('month').toDate()
      const end = dayjs().endOf('month').toDate()
      expect(getActivePreset(start, end)).toBe('analytics.thisMonth')
    })

    it('returns "analytics.lastMonth" key when start/end match last month boundaries', () => {
      const last = dayjs().subtract(1, 'month')
      const start = last.startOf('month').toDate()
      const end = last.endOf('month').toDate()
      expect(getActivePreset(start, end)).toBe('analytics.lastMonth')
    })

    it('returns null when dates do not match any preset', () => {
      const twoDay = new Date('2020-01-05T00:00:00.000')
      const twoDayEnd = new Date('2020-01-06T23:59:59.999')
      expect(getActivePreset(twoDay, twoDayEnd)).toBeNull()
    })
  })

  // ── Active preset button aria-pressed state ─────────────────────────────────

  it('marks the matching preset button with aria-pressed="true"', () => {
    const start = dayjs().startOf('day').toDate()
    const end = dayjs().endOf('day').toDate()
    render(
      <AnalyticsDatePicker
        {...makeProps({ startDate: start, endDate: end })}
      />,
    )

    const todayBtn = screen.getByRole('button', { name: '今日' })
    expect(todayBtn.getAttribute('aria-pressed')).toBe('true')
  })

  it('marks non-matching preset buttons with aria-pressed="false"', () => {
    const start = dayjs().startOf('day').toDate()
    const end = dayjs().endOf('day').toDate()
    render(
      <AnalyticsDatePicker
        {...makeProps({ startDate: start, endDate: end })}
      />,
    )

    const thisWeekBtn = screen.getByRole('button', { name: '本週' })
    const thisMonthBtn = screen.getByRole('button', { name: '本月' })
    const lastMonthBtn = screen.getByRole('button', { name: '上月' })
    expect(thisWeekBtn.getAttribute('aria-pressed')).toBe('false')
    expect(thisMonthBtn.getAttribute('aria-pressed')).toBe('false')
    expect(lastMonthBtn.getAttribute('aria-pressed')).toBe('false')
  })

  it('applies active styling class to the active preset button', () => {
    const start = dayjs().startOf('day').toDate()
    const end = dayjs().endOf('day').toDate()
    render(
      <AnalyticsDatePicker
        {...makeProps({ startDate: start, endDate: end })}
      />,
    )

    const todayBtn = screen.getByRole('button', { name: '今日' })
    expect(todayBtn.className).toContain('bg-primary')
  })

  it('does not apply active styling to inactive preset buttons', () => {
    const start = dayjs().startOf('day').toDate()
    const end = dayjs().endOf('day').toDate()
    render(
      <AnalyticsDatePicker
        {...makeProps({ startDate: start, endDate: end })}
      />,
    )

    const thisWeekBtn = screen.getByRole('button', { name: '本週' })
    expect(thisWeekBtn.className).not.toContain('bg-primary')
  })

  it('shows no active preset when date range does not match any preset', () => {
    const start = new Date('2020-01-05T00:00:00.000')
    const end = new Date('2020-01-06T23:59:59.999')
    render(
      <AnalyticsDatePicker
        {...makeProps({ startDate: start, endDate: end })}
      />,
    )

    for (const name of ['今日', '本週', '本月', '上月']) {
      const btn = screen.getByRole('button', { name })
      expect(btn.getAttribute('aria-pressed')).toBe('false')
      expect(btn.className).not.toContain('bg-primary')
    }
  })
})
