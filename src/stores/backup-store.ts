import { create } from 'zustand'

// ─── Types ──────────────────────────────────────────────────────────────────

export type ScheduleType = 'daily' | 'weekly' | 'none'

interface BackupState {
  /** Backup schedule type (persisted to localStorage) */
  readonly scheduleType: ScheduleType
  /** ISO 8601 timestamp of last successful backup */
  readonly lastBackupTime: string | null
  /** Whether a backup operation is currently in progress */
  readonly isBackingUp: boolean
  /** Backup progress percentage, 0-100 */
  readonly backupProgress: number
  /** Error message from last failed backup attempt */
  readonly backupError: string | null
}

interface BackupActions {
  setSchedule: (type: ScheduleType) => void
  setLastBackupTime: (time: string) => void
  startBackup: () => void
  updateProgress: (progress: number) => void
  finishBackup: (error?: string) => void
}

// ─── Persistence ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'backup-schedule'

const VALID_SCHEDULE_TYPES: readonly ScheduleType[] = [
  'daily',
  'weekly',
  'none',
]

function loadPersistedSchedule(): ScheduleType {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { scheduleType?: ScheduleType }
      const scheduleType = VALID_SCHEDULE_TYPES.includes(
        parsed.scheduleType as ScheduleType,
      )
        ? (parsed.scheduleType as ScheduleType)
        : 'daily'
      return scheduleType
    }
  } catch {
    // Ignore storage/parse errors, fall back to defaults
  }
  return 'daily'
}

function persistSchedule(scheduleType: ScheduleType): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ scheduleType }))
  } catch {
    // Ignore storage errors
  }
}

// ─── Store ──────────────────────────────────────────────────────────────────

const persisted = loadPersistedSchedule()

export const useBackupStore = create<BackupState & BackupActions>(set => ({
  // Schedule preferences (persisted)
  scheduleType: persisted,

  // Runtime state (not persisted)
  lastBackupTime: null,
  isBackingUp: false,
  backupProgress: 0,
  backupError: null,

  setSchedule: type => {
    persistSchedule(type)
    set({ scheduleType: type })
  },

  setLastBackupTime: time => {
    set({ lastBackupTime: time })
  },

  startBackup: () => {
    set({ isBackingUp: true, backupProgress: 0, backupError: null })
  },

  updateProgress: progress => {
    set({ backupProgress: progress })
  },

  finishBackup: error => {
    if (error) {
      set({ isBackingUp: false, backupError: error, backupProgress: 0 })
    } else {
      set({
        isBackingUp: false,
        backupProgress: 100,
        backupError: null,
      })
    }
  },
}))
