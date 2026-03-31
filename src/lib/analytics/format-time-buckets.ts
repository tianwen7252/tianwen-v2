/**
 * Utility to pad sparse HourBucket arrays from DB into a full 0–23 slot array.
 */

import type { HourBucket } from '@/lib/repositories/statistics-repository'

/**
 * Given a sparse HourBucket[] from the DB, returns a full 24-element array
 * covering hours 0–23 in ascending order, with count=0 for missing hours.
 * Does not mutate the input.
 */
export function formatTimeBuckets(buckets: HourBucket[]): HourBucket[] {
  const countByHour = new Map<number, number>(
    buckets.map(b => [b.hour, b.count]),
  )
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: countByHour.get(hour) ?? 0,
  }))
}
