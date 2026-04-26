/**
 * React hook for async database queries.
 * Returns data (initially defaultValue), re-fetches when deps change.
 * Rejections are captured via logError and an optional onError callback
 * instead of being silently swallowed (V2-251).
 */

import { useState, useEffect } from 'react'
import { logError } from '@/lib/error-logger'

export interface UseDbQueryOptions {
  /** Source label written to logError; defaults to 'useDbQuery'. */
  readonly source?: string
  /** Invoked with the rejection reason after logging; useful for surfacing toasts. */
  readonly onError?: (error: unknown) => void
}

export function useDbQuery<T>(
  queryFn: () => Promise<T>,
  deps: readonly unknown[],
  defaultValue: T,
  options?: UseDbQueryOptions,
): T {
  const [data, setData] = useState<T>(defaultValue)

  useEffect(() => {
    let cancelled = false
    queryFn()
      .then(result => {
        if (!cancelled) setData(result)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const message = error instanceof Error ? error.message : String(error)
        const stack = error instanceof Error ? error.stack : undefined
        logError(message, options?.source ?? 'useDbQuery', stack)
        options?.onError?.(error)
      })
    return () => {
      cancelled = true
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  return data
}
