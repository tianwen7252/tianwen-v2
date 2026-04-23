/**
 * useCloudBackups — shared React Query hook for cloud backup list.
 * Fetches from R2 via BackupService and provides computed aggregates.
 */

import { useQuery } from '@tanstack/react-query'
import { createBackupService, type BackupMetadata } from '@/lib/backup'

// ── Types ──────────────────────────────────────────────────────────────────

interface CloudBackups {
  readonly backups: readonly BackupMetadata[]
  readonly totalSize: number
  readonly backupCount: number
  readonly latestBackup: BackupMetadata | null
  /** True only on the initial load when no cached data exists. */
  readonly isLoading: boolean
  /**
   * True whenever the query is in flight, including background refetches
   * triggered by invalidation (e.g. after a manual backup completes).
   */
  readonly isFetching: boolean
  readonly error: Error | null
  readonly refetch: () => void
}

// ── Constants ──────────────────────────────────────────────────────────────

const STALE_TIME_MS = 60_000

// ── Hook ───────────────────────────────────────────────────────────────────

export function useCloudBackups(): CloudBackups {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['cloud-backups'],
    queryFn: () => createBackupService().listBackups(),
    staleTime: STALE_TIME_MS,
  })

  const backups = data ?? []
  const totalSize = backups.reduce((sum, b) => sum + b.size, 0)
  const backupCount = backups.length

  // Find latest by createdAt
  const latestBackup =
    backupCount > 0
      ? backups.reduce((latest, b) =>
          new Date(b.createdAt) > new Date(latest.createdAt) ? b : latest,
        )
      : null

  return {
    backups,
    totalSize,
    backupCount,
    latestBackup,
    isLoading,
    isFetching,
    error: error instanceof Error ? error : null,
    refetch: () => {
      refetch()
    },
  }
}
