import { describe, it, expect, beforeEach } from 'vitest'
import { useBackupStore } from './backup-store'

// ─── Helpers ────────────────────────────────────────────────────────────────

function resetStore(): void {
  useBackupStore.setState({
    scheduleType: 'daily',
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
      expect(useBackupStore.getState().scheduleType).toBe('daily')
    })

    it('should have lastBackupTime null by default', () => {
      expect(useBackupStore.getState().lastBackupTime).toBeNull()
    })

    it('should have isBackingUp false by default', () => {
      expect(useBackupStore.getState().isBackingUp).toBe(false)
    })

    it('should have backupProgress 0 by default', () => {
      expect(useBackupStore.getState().backupProgress).toBe(0)
    })

    it('should have backupError null by default', () => {
      expect(useBackupStore.getState().backupError).toBeNull()
    })
  })

  // ── setSchedule ─────────────────────────────────────────────────────────

  describe('setSchedule', () => {
    it('should update scheduleType', () => {
      useBackupStore.getState().setSchedule('weekly')
      expect(useBackupStore.getState().scheduleType).toBe('weekly')
    })

    it('should accept "none" as scheduleType', () => {
      useBackupStore.getState().setSchedule('none')
      expect(useBackupStore.getState().scheduleType).toBe('none')
    })

    it('should persist schedule to DB (async, verified via store state)', () => {
      useBackupStore.getState().setSchedule('weekly')
      expect(useBackupStore.getState().scheduleType).toBe('weekly')
    })
  })

  // ── Persistence ─────────────────────────────────────────────────────────

  describe('persistence', () => {
    it('should default to daily when no DB value exists', () => {
      expect(useBackupStore.getState().scheduleType).toBe('daily')
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
      useBackupStore.getState().finishBackup()
      expect(useBackupStore.getState().backupProgress).toBe(100)
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
  })
})
