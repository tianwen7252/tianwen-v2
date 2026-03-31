import { describe, it, expect } from 'vitest'
import { isBackupConfigured } from './backup-config'

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('backup-config', () => {
  describe('isBackupConfigured', () => {
    it('should return true (backup API is always available as same-origin)', () => {
      expect(isBackupConfigured()).toBe(true)
    })
  })
})
