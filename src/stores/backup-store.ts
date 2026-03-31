import { create } from 'zustand'

// ─── Types ──────────────────────────────────────────────────────────────────

export type ScheduleType = 'daily' | 'weekly' | 'none'

interface BackupState {
  /** Backup schedule type (persisted to localStorage) */
  readonly scheduleType: ScheduleType
  /** Hour of day for scheduled backup, 0-23 (persisted to localStorage) */
  readonly scheduleHour: number
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
  setSchedule: (type: ScheduleType, hour?: number) => void
  setLastBackupTime: (time: string) => void
  startBackup: () => void
  updateProgress: (progress: number) => void
  finishBackup: (error?: string) => void
}

// ─── Persistence ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'backup-schedule'

interface PersistedSchedule {
  readonly scheduleType: ScheduleType
  readonly scheduleHour: number
}

const VALID_SCHEDULE_TYPES: readonly ScheduleType[] = [
  'daily',
  'weekly',
  'none',
]
const DEFAULT_SCHEDULE_HOUR = 22

function isValidScheduleHour(value: unknown): value is number {
  return typeof value === 'number' && value >= 0 && value <= 23
}

function loadPersistedSchedule(): PersistedSchedule {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedSchedule
      const scheduleType = VALID_SCHEDULE_TYPES.includes(parsed.scheduleType)
        ? parsed.scheduleType
        : 'daily'
      const scheduleHour = isValidScheduleHour(parsed.scheduleHour)
        ? parsed.scheduleHour
        : DEFAULT_SCHEDULE_HOUR
      return { scheduleType, scheduleHour }
    }
  } catch {
    // Ignore storage/parse errors, fall back to defaults
  }
  return { scheduleType: 'daily', scheduleHour: DEFAULT_SCHEDULE_HOUR }
}

function persistSchedule(schedule: PersistedSchedule): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule))
  } catch {
    // Ignore storage errors
  }
}

// ─── Store ──────────────────────────────────────────────────────────────────

const persisted = loadPersistedSchedule()

export const useBackupStore = create<BackupState & BackupActions>(
  (set, get) => ({
    // Schedule preferences (persisted)
    scheduleType: persisted.scheduleType,
    scheduleHour: persisted.scheduleHour,

    // Runtime state (not persisted)
    lastBackupTime: null,
    isBackingUp: false,
    backupProgress: 0,
    backupError: null,

    setSchedule: (type, hour) => {
      const currentHour = get().scheduleHour
      const newHour = isValidScheduleHour(hour) ? hour : currentHour
      persistSchedule({ scheduleType: type, scheduleHour: newHour })
      set({ scheduleType: type, scheduleHour: newHour })
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
  }),
)
