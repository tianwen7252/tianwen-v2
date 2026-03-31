/**
 * Tests for the CloudBackupStatus component.
 * Covers the three KPI cards: Cloud DB Size, Last Backup, Auto Schedule.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// ── Mocks ───────────────────────────────────────────────────────────────────

let mockIsConfigured = false

vi.mock('@/lib/backup-config', () => ({
  isBackupConfigured: () => mockIsConfigured,
}))

let mockStoreState: {
  scheduleType: 'daily' | 'weekly' | 'none'
  scheduleHour: number
  lastBackupTime: string | null
  isBackingUp: boolean
  backupProgress: number
  backupError: string | null
} = {
  scheduleType: 'daily',
  scheduleHour: 22,
  lastBackupTime: null,
  isBackingUp: false,
  backupProgress: 0,
  backupError: null,
}

vi.mock('@/stores/backup-store', () => ({
  useBackupStore: vi.fn((selector: (state: typeof mockStoreState) => unknown) =>
    selector(mockStoreState),
  ),
}))

import { CloudBackupStatus } from './cloud-backup-status'

// ── Tests ───────────────────────────────────────────────────────────────────

describe('CloudBackupStatus', () => {
  beforeEach(() => {
    mockIsConfigured = false
    mockStoreState = {
      scheduleType: 'daily',
      scheduleHour: 22,
      lastBackupTime: null,
      isBackingUp: false,
      backupProgress: 0,
      backupError: null,
    }
  })

  describe('Cloud DB Size card', () => {
    it('renders the cloud size card title', () => {
      render(<CloudBackupStatus />)
      expect(screen.getByText('雲端資料庫大小')).toBeTruthy()
    })

    it('shows dash when no cloud size data available', () => {
      render(<CloudBackupStatus />)
      expect(screen.getByText('—')).toBeTruthy()
    })
  })

  describe('Last Backup card', () => {
    it('renders the last backup card title', () => {
      render(<CloudBackupStatus />)
      expect(screen.getByText('最後備份時間')).toBeTruthy()
    })

    it('shows no record when lastBackupTime is null', () => {
      mockStoreState = { ...mockStoreState, lastBackupTime: null }
      render(<CloudBackupStatus />)
      expect(screen.getByText('尚無記錄')).toBeTruthy()
    })

    it('shows formatted time when lastBackupTime is set', () => {
      mockStoreState = {
        ...mockStoreState,
        lastBackupTime: '2026-03-29T10:30:00.000Z',
      }
      render(<CloudBackupStatus />)
      // dayjs should format this; just check the rendered text is not the no-record message
      expect(screen.queryByText('尚無記錄')).toBeNull()
    })
  })

  describe('Auto Schedule card', () => {
    it('renders the schedule card title', () => {
      render(<CloudBackupStatus />)
      expect(screen.getByText('自動備份排程')).toBeTruthy()
    })

    it('shows daily schedule with hour', () => {
      mockStoreState = {
        ...mockStoreState,
        scheduleType: 'daily',
        scheduleHour: 22,
      }
      render(<CloudBackupStatus />)
      expect(screen.getByText('每日 22:00')).toBeTruthy()
    })

    it('shows weekly schedule with hour', () => {
      mockStoreState = {
        ...mockStoreState,
        scheduleType: 'weekly',
        scheduleHour: 8,
      }
      render(<CloudBackupStatus />)
      expect(screen.getByText('每週 8:00')).toBeTruthy()
    })

    it('shows schedule off when type is none', () => {
      mockStoreState = {
        ...mockStoreState,
        scheduleType: 'none',
        scheduleHour: 22,
      }
      render(<CloudBackupStatus />)
      expect(screen.getByText('關閉')).toBeTruthy()
    })
  })
})
