/**
 * React hook for async database queries.
 * Returns data (initially defaultValue), re-fetches when deps change.
 */

import { useState, useEffect } from 'react'

export function useDbQuery<T>(
  queryFn: () => Promise<T>,
  deps: readonly unknown[],
  defaultValue: T,
): T {
  const [data, setData] = useState<T>(defaultValue)

  useEffect(() => {
    let cancelled = false
    queryFn().then(result => {
      if (!cancelled) setData(result)
    })
    return () => {
      cancelled = true
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  return data
}
