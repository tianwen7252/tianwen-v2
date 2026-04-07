/**
 * Tests for backup API validation logic.
 * These pure functions mirror api/backup/[filename].ts exactly.
 */

import { describe, it, expect } from 'vitest'

// ── Re-implement pure validation functions to test ────────────────────────

const VALID_FILENAME_RE = /^backup-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.sqlite\.gz$/
const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024 // 1 GB

function isValidFilename(filename: string): boolean {
  return VALID_FILENAME_RE.test(filename)
}

function isFileTooLarge(contentLength: number): boolean {
  return contentLength > MAX_UPLOAD_BYTES
}

function r2Key(prefix: string, filename: string): string {
  return `${prefix}${filename}`
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('backup API validation', () => {
  describe('isValidFilename', () => {
    it('accepts valid backup filename with date', () => {
      expect(isValidFilename('backup-2026-04-07_13-10-00.sqlite.gz')).toBe(true)
    })

    it('accepts filename with different date', () => {
      expect(isValidFilename('backup-2025-01-01_00-00-00.sqlite.gz')).toBe(true)
    })

    it('rejects old unix timestamp format', () => {
      expect(isValidFilename('backup-1711814400000.sqlite.gz')).toBe(false)
    })

    it('rejects filename without backup- prefix', () => {
      expect(isValidFilename('2026-04-07_13-10-00.sqlite.gz')).toBe(false)
    })

    it('rejects filename with wrong extension', () => {
      expect(isValidFilename('backup-2026-04-07_13-10-00.db.gz')).toBe(false)
    })

    it('rejects filename with path traversal', () => {
      expect(isValidFilename('../backup-2026-04-07_13-10-00.sqlite.gz')).toBe(false)
    })

    it('rejects filename with slashes', () => {
      expect(isValidFilename('foo/backup-2026-04-07_13-10-00.sqlite.gz')).toBe(false)
    })

    it('rejects empty filename', () => {
      expect(isValidFilename('')).toBe(false)
    })

    it('rejects incomplete date format', () => {
      expect(isValidFilename('backup-2026-04-07.sqlite.gz')).toBe(false)
    })

    it('rejects filename with spaces', () => {
      expect(isValidFilename('backup- 2026-04-07_13-10-00.sqlite.gz')).toBe(false)
    })
  })

  describe('isFileTooLarge', () => {
    it('returns false for 0 bytes', () => {
      expect(isFileTooLarge(0)).toBe(false)
    })

    it('returns false for 500 MB', () => {
      expect(isFileTooLarge(500 * 1024 * 1024)).toBe(false)
    })

    it('returns false for exactly 1 GB', () => {
      expect(isFileTooLarge(1024 * 1024 * 1024)).toBe(false)
    })

    it('returns true for 1 GB + 1 byte', () => {
      expect(isFileTooLarge(1024 * 1024 * 1024 + 1)).toBe(true)
    })
  })

  describe('r2Key', () => {
    it('builds key with userId prefix when set', () => {
      expect(r2Key('tianwen/', 'backup-2026-04-07_13-10-00.sqlite.gz')).toBe(
        'tianwen/backup-2026-04-07_13-10-00.sqlite.gz',
      )
    })

    it('uses filename directly when no prefix', () => {
      expect(r2Key('', 'backup-2026-04-07_13-10-00.sqlite.gz')).toBe(
        'backup-2026-04-07_13-10-00.sqlite.gz',
      )
    })
  })
})
