/**
 * useAutoBackup — React hook for automatic backup scheduling.
 * Checks if a backup is overdue on mount and when the page becomes visible.
 *
 * Schedule rules:
 * - daily: backup once per day. If missed, skip (no retroactive backup).
 * - weekly: backup every Monday. If missed, backup immediately.
 */

import { useEffect } from 'react'
import { useBackupStore } from '@/stores/backup-store'
import { isBackupConfigured } from '@/lib/backup-config'
import { performBackup } from '@/lib/perform-backup'
import { isBackupOverdue } from '@/lib/backup-schedule'

// ── Types ──────────────────────────────────────────────────────────────────

interface UseAutoBackupOptions {
  readonly enabled: boolean
}

// ── Backup Execution ───────────────────────────────────────────────────────

/**
 * Execute a backup operation: update store state, run performBackup.
 * Silently skips if cloud backup is not configured.
 */
async function executeBackup(
  startBackup: () => void,
  finishBackup: (error?: string) => void,
  setLastBackupTime: (time: string) => void,
): Promise<void> {
  if (!isBackupConfigured()) {
    return
  }

  startBackup()

  try {
    await performBackup('auto')
    setLastBackupTime(new Date().toISOString())
    finishBackup()
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown backup error'
    finishBackup(message)
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useAutoBackup(options: UseAutoBackupOptions): void {
  const { enabled } = options

  const scheduleType = useBackupStore(s => s.scheduleType)
  const lastBackupTime = useBackupStore(s => s.lastBackupTime)
  const startBackup = useBackupStore(s => s.startBackup)
  const finishBackup = useBackupStore(s => s.finishBackup)
  const setLastBackupTime = useBackupStore(s => s.setLastBackupTime)

  // Check for overdue backup on mount and when dependencies change.
  // Read isBackingUp via getState() (not via selector) so the effect does
  // not re-run on every progress update while a backup is in flight.
  useEffect(() => {
    if (!enabled || scheduleType === 'none') {
      return
    }

    if (useBackupStore.getState().isBackingUp) {
      return
    }

    if (isBackupOverdue(scheduleType, lastBackupTime)) {
      void executeBackup(startBackup, finishBackup, setLastBackupTime)
    }
  }, [
    enabled,
    scheduleType,
    lastBackupTime,
    startBackup,
    finishBackup,
    setLastBackupTime,
  ])

  // Page Visibility API: re-check when tab becomes visible
  useEffect(() => {
    if (!enabled || scheduleType === 'none') {
      return
    }

    function handleVisibilityChange(): void {
      if (document.visibilityState === 'visible') {
        const state = useBackupStore.getState()
        if (state.isBackingUp) {
          return
        }
        if (
          isBackupOverdue(state.scheduleType, state.lastBackupTime) &&
          isBackupConfigured()
        ) {
          void executeBackup(
            state.startBackup,
            state.finishBackup,
            state.setLastBackupTime,
          )
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, scheduleType])
}
