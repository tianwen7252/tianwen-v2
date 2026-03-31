/**
 * Hook to query row counts for each database table.
 * Uses TanStack Query for caching and automatic refetching.
 */

import { useQuery } from '@tanstack/react-query'
import { getDatabase } from '@/lib/repositories/provider'

// ── Types ───────────────────────────────────────────────────────────────────

interface TableStats {
  readonly tableName: string
  readonly rowCount: number
}

interface DbStats {
  readonly tables: readonly TableStats[]
  readonly totalRows: number
  readonly isLoading: boolean
  readonly error: Error | null
  readonly refetch: () => void
}

// ── Constants ───────────────────────────────────────────────────────────────

/** All application tables to query (from schema.ts) */
const DB_TABLES = [
  'commodity_types',
  'commodities',
  'orders',
  'order_types',
  'daily_data',
  'employees',
  'attendances',
  'order_items',
  'order_discounts',
  'custom_order_names',
  'error_logs',
  'backup_logs',
] as const

const STALE_TIME_MS = 30_000

// ── Query function ──────────────────────────────────────────────────────────

async function fetchTableStats(): Promise<readonly TableStats[]> {
  const db = getDatabase()

  const results = await Promise.all(
    DB_TABLES.map(async tableName => {
      const result = await db.exec<{ count: number }>(
        `SELECT COUNT(*) AS count FROM ${tableName}`,
      )
      const count = result.rows[0]?.count ?? 0
      return { tableName, rowCount: Number(count) }
    }),
  )

  // Return sorted by tableName alphabetically
  return [...results].sort((a, b) => a.tableName.localeCompare(b.tableName))
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useDbStats(): DbStats {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['db-stats'],
    queryFn: fetchTableStats,
    staleTime: STALE_TIME_MS,
  })

  const tables = data ?? []
  const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0)

  return {
    tables,
    totalRows,
    isLoading,
    error: error instanceof Error ? error : null,
    refetch: () => {
      refetch()
    },
  }
}
