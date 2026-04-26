/**
 * Tests for useDbQuery — focused on error handling.
 * Verifies that rejections are captured via logError and an optional onError
 * callback, instead of silently swallowed (V2-251).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDbQuery } from './use-db-query'

vi.mock('@/lib/error-logger', () => ({
  logError: vi.fn(),
}))

import { logError } from '@/lib/error-logger'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useDbQuery', () => {
  it('returns default value before the query resolves', () => {
    const { result } = renderHook(() =>
      useDbQuery(() => new Promise<number[]>(() => {}), [], [] as number[]),
    )
    expect(result.current).toEqual([])
  })

  it('returns query result on success', async () => {
    const { result } = renderHook(() =>
      useDbQuery(() => Promise.resolve([1, 2, 3]), [], [] as number[]),
    )
    await waitFor(() => expect(result.current).toEqual([1, 2, 3]))
  })

  it('calls logError when the query rejects with an Error', async () => {
    const err = new Error('db boom')
    const { result } = renderHook(() =>
      useDbQuery(() => Promise.reject(err), [], [] as number[], {
        source: 'use-db-query.test',
      }),
    )

    await waitFor(() => {
      expect(logError).toHaveBeenCalledWith(
        'db boom',
        'use-db-query.test',
        expect.any(String),
      )
    })
    // Default value remains
    expect(result.current).toEqual([])
  })

  it('calls logError when the query rejects with a non-Error value', async () => {
    renderHook(() =>
      useDbQuery(() => Promise.reject('plain string'), [], [] as number[], {
        source: 'use-db-query.test',
      }),
    )

    await waitFor(() => {
      expect(logError).toHaveBeenCalledWith(
        'plain string',
        'use-db-query.test',
        undefined,
      )
    })
  })

  it('uses a default source when none provided', async () => {
    renderHook(() =>
      useDbQuery(
        () => Promise.reject(new Error('no source')),
        [],
        [] as number[],
      ),
    )

    await waitFor(() => {
      expect(logError).toHaveBeenCalledWith(
        'no source',
        'useDbQuery',
        expect.any(String),
      )
    })
  })

  it('invokes onError callback with the rejection reason', async () => {
    const onError = vi.fn()
    renderHook(() =>
      useDbQuery(
        () => Promise.reject(new Error('bad query')),
        [],
        [] as number[],
        { source: 'unit', onError },
      ),
    )

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1)
      const arg = onError.mock.calls[0]?.[0]
      expect(arg).toBeInstanceOf(Error)
      expect((arg as Error).message).toBe('bad query')
    })
  })

  it('does not call logError or onError when the hook is unmounted before the query rejects', async () => {
    const onError = vi.fn()
    let reject: (err: Error) => void = () => {}
    const promise = new Promise<number[]>((_, r) => {
      reject = r
    })

    const { unmount } = renderHook(() =>
      useDbQuery(() => promise, [], [] as number[], {
        source: 'unmount-test',
        onError,
      }),
    )

    unmount()
    reject(new Error('after unmount'))
    // Wait one microtask tick
    await Promise.resolve()
    await Promise.resolve()

    expect(logError).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })
})
