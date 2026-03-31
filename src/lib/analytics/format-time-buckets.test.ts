/**
 * Tests for formatTimeBuckets utility.
 * Ensures all 0-23 hour slots are filled regardless of DB output.
 */

import { describe, it, expect } from 'vitest'
import type { HourBucket } from '@/lib/repositories/statistics-repository'
import { formatTimeBuckets } from './format-time-buckets'

describe('formatTimeBuckets', () => {
  it('returns 24 buckets for all hours 0–23', () => {
    const result = formatTimeBuckets([])
    expect(result).toHaveLength(24)
    expect(result.map(b => b.hour)).toEqual(
      Array.from({ length: 24 }, (_, i) => i),
    )
  })

  it('fills missing hours with count 0', () => {
    const result = formatTimeBuckets([])
    result.forEach(b => expect(b.count).toBe(0))
  })

  it('preserves existing bucket counts', () => {
    const input: HourBucket[] = [
      { hour: 0, count: 5 },
      { hour: 12, count: 10 },
      { hour: 23, count: 3 },
    ]
    const result = formatTimeBuckets(input)
    expect(result[0]!.count).toBe(5)
    expect(result[12]!.count).toBe(10)
    expect(result[23]!.count).toBe(3)
  })

  it('sets count to 0 for hours not in input', () => {
    const input: HourBucket[] = [{ hour: 9, count: 7 }]
    const result = formatTimeBuckets(input)
    expect(result[0]!.count).toBe(0)
    expect(result[9]!.count).toBe(7)
    expect(result[22]!.count).toBe(0)
  })

  it('handles all 24 hours present in input', () => {
    const input: HourBucket[] = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: i + 1,
    }))
    const result = formatTimeBuckets(input)
    expect(result).toHaveLength(24)
    result.forEach((b, i) => {
      expect(b.hour).toBe(i)
      expect(b.count).toBe(i + 1)
    })
  })

  it('returns buckets in ascending order by hour', () => {
    const input: HourBucket[] = [
      { hour: 23, count: 1 },
      { hour: 0, count: 2 },
      { hour: 11, count: 3 },
    ]
    const result = formatTimeBuckets(input)
    for (let i = 0; i < 24; i++) {
      expect(result[i]!.hour).toBe(i)
    }
  })

  it('does not mutate the input array', () => {
    const input: HourBucket[] = [{ hour: 5, count: 99 }]
    const original = [...input]
    formatTimeBuckets(input)
    expect(input).toEqual(original)
  })

  it('handles sparse input with only one bucket', () => {
    const input: HourBucket[] = [{ hour: 14, count: 42 }]
    const result = formatTimeBuckets(input)
    expect(result).toHaveLength(24)
    expect(result[14]!.count).toBe(42)
    expect(result[13]!.count).toBe(0)
    expect(result[15]!.count).toBe(0)
  })
})
