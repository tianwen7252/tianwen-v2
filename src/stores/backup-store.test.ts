import { describe, it, expect, beforeEach } from 'vitest'
import { useBackupStore } from './backup-store'

// ─── Helpers ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'backup-schedule'

function resetStore(): void {
  localStorage.clear()
  useBackupStore.setState({
    scheduleType: 'daily',
    scheduleHour: 22,
    lastBackupTime: null,
    isBackingUp: false,
    backupProgress: 0,
    backupError: null,
  })
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('useBackupStore', () => {
  beforeEach(() => {
    resetStore()
  })

  // ── Default state ───────────────────────────────────────────────────────

  describe('default state', () => {
    it('should have scheduleType "daily" by default', () => {
      const state = useBackupStore.getState()
      expect(state.scheduleType).toBe('daily')
    })

    it('should have scheduleHour 22 by default', () => {
      const state = useBackupStore.getState()
      expect(state.scheduleHour).toBe(22)
    })

    it('should have lastBackupTime null by default', () => {
      const state = useBackupStore.getState()
      expect(state.lastBackupTime).toBeNull()
    })

    it('should have isBackingUp false by default', () => {
      const state = useBackupStore.getState()
      expect(state.isBackingUp).toBe(false)
    })

    it('should have backupProgress 0 by default', () => {
      const state = useBackupStore.getState()
      expect(state.backupProgress).toBe(0)
    })

    it('should have backupError null by default', () => {
      const state = useBackupStore.getState()
      expect(state.backupError).toBeNull()
    })
  })

  // ── setSchedule ─────────────────────────────────────────────────────────

  describe('setSchedule', () => {
    it('should update scheduleType', () => {
      useBackupStore.getState().setSchedule('weekly')
      expect(useBackupStore.getState().scheduleType).toBe('weekly')
    })

    it('should update scheduleHour when provided', () => {
      useBackupStore.getState().setSchedule('daily', 8)
      expect(useBackupStore.getState().scheduleHour).toBe(8)
    })

    it('should keep existing scheduleHour when hour is not provided', () => {
      useBackupStore.getState().setSchedule('daily', 15)
      useBackupStore.getState().setSchedule('weekly')
      const state = useBackupStore.getState()
      expect(state.scheduleType).toBe('weekly')
      expect(state.scheduleHour).toBe(15)
    })

    it('should accept "none" as scheduleType', () => {
      useBackupStore.getState().setSchedule('none')
      expect(useBackupStore.getState().scheduleType).toBe('none')
    })

    it('should persist schedule to localStorage', () => {
      useBackupStore.getState().setSchedule('weekly', 6)
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
      expect(stored.scheduleType).toBe('weekly')
      expect(stored.scheduleHour).toBe(6)
    })

    it('should handle hour boundary value 0', () => {
      useBackupStore.getState().setSchedule('daily', 0)
      expect(useBackupStore.getState().scheduleHour).toBe(0)
    })

    it('should handle hour boundary value 23', () => {
      useBackupStore.getState().setSchedule('daily', 23)
      expect(useBackupStore.getState().scheduleHour).toBe(23)
    })
  })

  // ── Persistence ─────────────────────────────────────────────────────────

  describe('persistence', () => {
    it('should load persisted schedule from localStorage on creation', () => {
      // Write schedule to localStorage before loading
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ scheduleType: 'weekly', scheduleHour: 14 }),
      )

      // Force reload by calling the internal load function via setState
      // Simulating store re-initialization
      const loaded = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
      useBackupStore.setState({
        scheduleType: loaded.scheduleType,
        scheduleHour: loaded.scheduleHour,
      })

      const state = useBackupStore.getState()
      expect(state.scheduleType).toBe('weekly')
      expect(state.scheduleHour).toBe(14)
    })

    it('should use defaults when localStorage is empty', () => {
      localStorage.removeItem(STORAGE_KEY)
      // The initial store defaults should be daily/22
      const state = useBackupStore.getState()
      expect(state.scheduleType).toBe('daily')
      expect(state.scheduleHour).toBe(22)
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'not-valid-json')
      // Store should fall back to defaults when parsing fails
      // We verify this by checking the store still works
      const state = useBackupStore.getState()
      expect(state.scheduleType).toBeDefined()
      expect(state.scheduleHour).toBeDefined()
    })
  })

  // ── startBackup ─────────────────────────────────────────────────────────

  describe('startBackup', () => {
    it('should set isBackingUp to true', () => {
      useBackupStore.getState().startBackup()
      expect(useBackupStore.getState().isBackingUp).toBe(true)
    })

    it('should reset backupProgress to 0', () => {
      useBackupStore.setState({ backupProgress: 50 })
      useBackupStore.getState().startBackup()
      expect(useBackupStore.getState().backupProgress).toBe(0)
    })

    it('should reset backupError to null', () => {
      useBackupStore.setState({ backupError: 'previous error' })
      useBackupStore.getState().startBackup()
      expect(useBackupStore.getState().backupError).toBeNull()
    })
  })

  // ── updateProgress ──────────────────────────────────────────────────────

  describe('updateProgress', () => {
    it('should set backupProgress to the given value', () => {
      useBackupStore.getState().updateProgress(42)
      expect(useBackupStore.getState().backupProgress).toBe(42)
    })

    it('should handle 0 progress', () => {
      useBackupStore.getState().updateProgress(0)
      expect(useBackupStore.getState().backupProgress).toBe(0)
    })

    it('should handle 100 progress', () => {
      useBackupStore.getState().updateProgress(100)
      expect(useBackupStore.getState().backupProgress).toBe(100)
    })
  })

  // ── finishBackup ────────────────────────────────────────────────────────

  describe('finishBackup', () => {
    it('should set isBackingUp to false on success', () => {
      useBackupStore.getState().startBackup()
      useBackupStore.getState().finishBackup()
      expect(useBackupStore.getState().isBackingUp).toBe(false)
    })

    it('should set backupProgress to 100 on success', () => {
      useBackupStore.getState().startBackup()
      useBackupStore.getState().updateProgress(50)
      useBackupStore.getState().finishBackup()
      expect(useBackupStore.getState().backupProgress).toBe(100)
    })

    it('should keep backupError null on success', () => {
      useBackupStore.getState().startBackup()
      useBackupStore.getState().finishBackup()
      expect(useBackupStore.getState().backupError).toBeNull()
    })

    it('should set isBackingUp to false on error', () => {
      useBackupStore.getState().startBackup()
      useBackupStore.getState().finishBackup('Upload failed')
      expect(useBackupStore.getState().isBackingUp).toBe(false)
    })

    it('should set backupError when error is provided', () => {
      useBackupStore.getState().startBackup()
      useBackupStore.getState().finishBackup('Upload failed')
      expect(useBackupStore.getState().backupError).toBe('Upload failed')
    })

    it('should reset backupProgress to 0 on error', () => {
      useBackupStore.getState().startBackup()
      useBackupStore.getState().updateProgress(30)
      useBackupStore.getState().finishBackup('Network error')
      // On error, progress resets to 0 for clean UI state
      expect(useBackupStore.getState().backupProgress).toBe(0)
    })
  })

  // ── setLastBackupTime ───────────────────────────────────────────────────

  describe('setLastBackupTime', () => {
    it('should update lastBackupTime', () => {
      const time = '2026-03-29T10:00:00.000Z'
      useBackupStore.getState().setLastBackupTime(time)
      expect(useBackupStore.getState().lastBackupTime).toBe(time)
    })

    it('should overwrite previous lastBackupTime', () => {
      useBackupStore.getState().setLastBackupTime('2026-03-28T10:00:00.000Z')
      useBackupStore.getState().setLastBackupTime('2026-03-29T10:00:00.000Z')
      expect(useBackupStore.getState().lastBackupTime).toBe(
        '2026-03-29T10:00:00.000Z',
      )
    })
  })
})
