/**
 * useAutoBackup — React hook for automatic backup scheduling.
 * Manages setTimeout-based scheduling with Page Visibility API support,
 * overdue backup detection, and cloud backup execution.
 */

import { useEffect, useRef } from 'react'
import { useBackupStore } from '@/stores/backup-store'
import { isBackupConfigured } from '@/lib/backup-config'
import { performBackup } from '@/lib/perform-backup'
import {
  calculateNextDailyBackup,
  calculateNextWeeklyBackup,
  isBackupOverdue,
} from '@/lib/backup-schedule'

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
  const scheduleHour = useBackupStore(s => s.scheduleHour)
  const lastBackupTime = useBackupStore(s => s.lastBackupTime)
  const startBackup = useBackupStore(s => s.startBackup)
  const finishBackup = useBackupStore(s => s.finishBackup)
  const setLastBackupTime = useBackupStore(s => s.setLastBackupTime)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (!enabled || scheduleType === 'none') {
      return
    }

    // Check for overdue backup on mount
    const overdue = isBackupOverdue(scheduleType, scheduleHour, lastBackupTime)

    if (overdue) {
      // Queue overdue backup with minimal delay
      timerRef.current = setTimeout(() => {
        void executeBackup(startBackup, finishBackup, setLastBackupTime)
      }, 50)
      return
    }

    // Calculate next scheduled backup time
    const now = Date.now()
    const nextBackupTime =
      scheduleType === 'daily'
        ? calculateNextDailyBackup(scheduleHour, now)
        : calculateNextWeeklyBackup(scheduleHour, now)

    const delay = nextBackupTime - now

    timerRef.current = setTimeout(() => {
      void executeBackup(startBackup, finishBackup, setLastBackupTime)
    }, delay)

    // Cleanup on unmount or dependency change
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [
    enabled,
    scheduleType,
    scheduleHour,
    lastBackupTime,
    startBackup,
    finishBackup,
    setLastBackupTime,
  ])

  // Page Visibility API: recalculate when tab becomes visible
  useEffect(() => {
    if (!enabled || scheduleType === 'none') {
      return
    }

    function handleVisibilityChange(): void {
      if (document.visibilityState === 'visible') {
        const state = useBackupStore.getState()
        const overdue = isBackupOverdue(
          state.scheduleType,
          state.scheduleHour,
          state.lastBackupTime,
        )

        if (overdue && isBackupConfigured()) {
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
