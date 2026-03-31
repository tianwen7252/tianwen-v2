/**
 * Tests for formatOrderDate utility.
 * Verifies date formatting and label generation (today, yesterday, weekday).
 */

import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import { formatOrderDate } from './format-order-date'

describe('formatOrderDate', () => {
  // Use a fixed "today" for deterministic tests
  const today = dayjs('2026-03-24')

  // ─── formatted output ───────────────────────────────────────────────────────

  describe('formatted output', () => {
    it('formats date as YYYY/M/D without zero-padding', () => {
      const date = dayjs('2026-03-24')
      const result = formatOrderDate(date, today)

      expect(result.formatted).toBe('2026/3/24')
    })

    it('does not zero-pad single-digit month', () => {
      const date = dayjs('2026-01-05')
      const result = formatOrderDate(date, today)

      expect(result.formatted).toBe('2026/1/5')
    })

    it('does not zero-pad single-digit day', () => {
      const date = dayjs('2026-03-03')
      const result = formatOrderDate(date, today)

      expect(result.formatted).toBe('2026/3/3')
    })

    it('formats double-digit month and day correctly', () => {
      const date = dayjs('2026-12-25')
      const result = formatOrderDate(date, today)

      expect(result.formatted).toBe('2026/12/25')
    })
  })

  // ─── label: today ───────────────────────────────────────────────────────────

  describe('label: today', () => {
    it('returns "今天" when date is today', () => {
      const date = dayjs('2026-03-24')
      const result = formatOrderDate(date, today)

      expect(result.label).toBe('今天')
    })

    it('returns "今天" when date is same day but different time', () => {
      const date = dayjs('2026-03-24T23:59:59')
      const result = formatOrderDate(date, today)

      expect(result.label).toBe('今天')
    })
  })

  // ─── label: yesterday ───────────────────────────────────────────────────────

  describe('label: yesterday', () => {
    it('returns "昨天" when date is yesterday', () => {
      const date = dayjs('2026-03-23')
      const result = formatOrderDate(date, today)

      expect(result.label).toBe('昨天')
    })

    it('returns "昨天" when date is yesterday with different time', () => {
      const date = dayjs('2026-03-23T15:30:00')
      const result = formatOrderDate(date, today)

      expect(result.label).toBe('昨天')
    })
  })

  // ─── label: weekday ─────────────────────────────────────────────────────────

  describe('label: weekday', () => {
    it('returns "週日" for Sunday', () => {
      // 2026-03-22 is Sunday
      const date = dayjs('2026-03-22')
      const result = formatOrderDate(date, today)

      expect(result.label).toBe('週日')
    })

    it('returns "週一" for Monday', () => {
      // 2026-03-16 is Monday
      const date = dayjs('2026-03-16')
      const result = formatOrderDate(date, today)

      expect(result.label).toBe('週一')
    })

    it('returns "週二" for Tuesday', () => {
      // 2026-03-17 is Tuesday
      const date = dayjs('2026-03-17')
      const result = formatOrderDate(date, today)

      expect(result.label).toBe('週二')
    })

    it('returns "週三" for Wednesday', () => {
      // 2026-03-18 is Wednesday
      const date = dayjs('2026-03-18')
      const result = formatOrderDate(date, today)

      expect(result.label).toBe('週三')
    })

    it('returns "週四" for Thursday', () => {
      // 2026-03-19 is Thursday
      const date = dayjs('2026-03-19')
      const result = formatOrderDate(date, today)

      expect(result.label).toBe('週四')
    })

    it('returns "週五" for Friday', () => {
      // 2026-03-20 is Friday
      const date = dayjs('2026-03-20')
      const result = formatOrderDate(date, today)

      expect(result.label).toBe('週五')
    })

    it('returns "週六" for Saturday', () => {
      // 2026-03-21 is Saturday
      const date = dayjs('2026-03-21')
      const result = formatOrderDate(date, today)

      expect(result.label).toBe('週六')
    })
  })

  // ─── edge cases ─────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles midnight boundary — start of today is still today', () => {
      const date = dayjs('2026-03-24T00:00:00')
      const result = formatOrderDate(date, today)

      expect(result.label).toBe('今天')
    })

    it('handles midnight boundary — end of yesterday is still yesterday', () => {
      const date = dayjs('2026-03-23T23:59:59')
      const result = formatOrderDate(date, today)

      expect(result.label).toBe('昨天')
    })

    it('two days ago shows weekday, not yesterday', () => {
      // 2026-03-22 is 2 days before today (Sunday)
      const date = dayjs('2026-03-22')
      const result = formatOrderDate(date, today)

      expect(result.label).toBe('週日')
    })

    it('defaults today parameter when not provided', () => {
      // When today is not provided, it should use dayjs() internally.
      // We can only verify the result has the correct shape.
      const date = dayjs()
      const result = formatOrderDate(date)

      expect(result.formatted).toBeDefined()
      expect(result.label).toBe('今天')
    })
  })
})
