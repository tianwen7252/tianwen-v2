import { create } from 'zustand'

// ─── Types ──────────────────────────────────────────────────────────────────

export type ScheduleType = 'daily' | 'weekly' | 'none'

interface BackupState {
  /** Backup schedule type (persisted to localStorage + SQLite DB) */
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
const DB_SETTING_KEY = 'backup_schedule_type'

const VALID_SCHEDULE_TYPES: readonly ScheduleType[] = [
  'daily',
  'weekly',
  'none',
]

function isValidScheduleType(value: unknown): value is ScheduleType {
  return VALID_SCHEDULE_TYPES.includes(value as ScheduleType)
}

function loadPersistedSchedule(): ScheduleType {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { scheduleType?: ScheduleType }
      if (isValidScheduleType(parsed.scheduleType)) {
        return parsed.scheduleType
      }
    }
  } catch {
    // Ignore storage/parse errors, fall back to defaults
  }
  return 'daily'
}

function persistSchedule(scheduleType: ScheduleType): void {
  // Write to localStorage (sync, immediate)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ scheduleType }))
  } catch {
    // Ignore storage errors
  }

  // Write to SQLite DB (async, best-effort)
  persistScheduleToDb(scheduleType)
}

async function persistScheduleToDb(scheduleType: ScheduleType): Promise<void> {
  try {
    const { getSettingsRepo } = await import('@/lib/repositories/provider')
    await getSettingsRepo().set(DB_SETTING_KEY, scheduleType)
  } catch {
    // DB not initialized yet or write failed — localStorage is the fallback
  }
}

/**
 * Hydrate the store from SQLite DB after initialization.
 * Called once after DB is ready. DB value takes precedence over localStorage.
 */
export async function hydrateBackupScheduleFromDb(): Promise<void> {
  try {
    const { getSettingsRepo } = await import('@/lib/repositories/provider')
    const dbValue = await getSettingsRepo().get(DB_SETTING_KEY)
    if (dbValue && isValidScheduleType(dbValue)) {
      useBackupStore.setState({ scheduleType: dbValue })
      // Sync localStorage with DB value
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ scheduleType: dbValue }))
      } catch {
        // Ignore
      }
    } else {
      // DB has no value yet — seed it from current store (localStorage value)
      const current = useBackupStore.getState().scheduleType
      await getSettingsRepo().set(DB_SETTING_KEY, current)
    }
  } catch {
    // DB not ready — use localStorage value (already loaded in store init)
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
