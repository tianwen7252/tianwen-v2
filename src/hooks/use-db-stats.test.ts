/**
 * Tests for the useDbStats hook.
 * Verifies loading state, table stats retrieval, totalRows calculation,
 * sorted results, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockExec = vi.fn()

vi.mock('@/lib/repositories/provider', () => ({
  getDatabase: () => ({
    exec: mockExec,
  }),
}))

import { useDbStats } from './use-db-stats'

// ── Helpers ─────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('useDbStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns loading state initially', () => {
    // Make the exec never resolve so we stay in loading
    mockExec.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useDbStats(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.tables).toEqual([])
    expect(result.current.totalRows).toBe(0)
    expect(result.current.error).toBeNull()
  })

  it('returns table stats after query', async () => {
    mockExec.mockResolvedValue({ rows: [{ count: 5 }], changes: 0 })

    const { result } = renderHook(() => useDbStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.tables.length).toBeGreaterThan(0)
    // All tables should have rowCount 5 since we mock the same response
    for (const table of result.current.tables) {
      expect(table.rowCount).toBe(5)
    }
    expect(result.current.error).toBeNull()
  })

  it('returns totalRows as sum of all rowCounts', async () => {
    // Return different counts for different tables
    let callIndex = 0
    const counts = [10, 20, 5, 3, 0, 7, 2, 15, 1, 8, 4, 6]
    mockExec.mockImplementation(async () => {
      const count = counts[callIndex % counts.length] ?? 0
      callIndex++
      return { rows: [{ count }], changes: 0 }
    })

    const { result } = renderHook(() => useDbStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const expectedTotal = result.current.tables.reduce(
      (sum, t) => sum + t.rowCount,
      0,
    )
    expect(result.current.totalRows).toBe(expectedTotal)
  })

  it('returns tables sorted by tableName alphabetically', async () => {
    mockExec.mockResolvedValue({ rows: [{ count: 1 }], changes: 0 })

    const { result } = renderHook(() => useDbStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const names = result.current.tables.map(t => t.tableName)
    const sorted = [...names].sort()
    expect(names).toEqual(sorted)
  })

  it('handles query errors', async () => {
    mockExec.mockRejectedValue(new Error('DB connection failed'))

    const { result } = renderHook(() => useDbStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('DB connection failed')
    expect(result.current.tables).toEqual([])
    expect(result.current.totalRows).toBe(0)
  })

  it('queries all 12 expected tables', async () => {
    mockExec.mockResolvedValue({ rows: [{ count: 0 }], changes: 0 })

    const { result } = renderHook(() => useDbStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const expectedTables = [
      'attendances',
      'backup_logs',
      'commodities',
      'commodity_types',
      'custom_order_names',
      'daily_data',
      'employees',
      'error_logs',
      'order_discounts',
      'order_items',
      'order_types',
      'orders',
    ]
    const tableNames = result.current.tables.map(t => t.tableName)
    expect(tableNames).toEqual(expectedTables)
  })

  it('exposes a refetch function', async () => {
    mockExec.mockResolvedValue({ rows: [{ count: 0 }], changes: 0 })

    const { result } = renderHook(() => useDbStats(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(typeof result.current.refetch).toBe('function')
  })
})
