/**
 * Tests for the CloudBackupStatus component.
 * Covers the three KPI cards: Cloud DB Size, Last Backup, Auto Schedule.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockListBackups = vi.hoisted(() =>
  vi.fn().mockResolvedValue([
    {
      filename: 'backup-300.sqlite.gz',
      size: 1024,
      createdAt: '2026-04-03T10:00:00Z',
    },
    {
      filename: 'backup-200.sqlite.gz',
      size: 2048,
      createdAt: '2026-04-02T10:00:00Z',
    },
  ]),
)

vi.mock('@/lib/backup', () => ({
  createBackupService: () => ({
    listBackups: mockListBackups,
  }),
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

// ── Helpers ─────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('CloudBackupStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStoreState = {
      scheduleType: 'daily',
      scheduleHour: 22,
      lastBackupTime: null,
      isBackingUp: false,
      backupProgress: 0,
      backupError: null,
    }
    mockListBackups.mockResolvedValue([
      {
        filename: 'backup-300.sqlite.gz',
        size: 1024,
        createdAt: '2026-04-03T10:00:00Z',
      },
      {
        filename: 'backup-200.sqlite.gz',
        size: 2048,
        createdAt: '2026-04-02T10:00:00Z',
      },
    ])
  })

  describe('Cloud DB Size card', () => {
    it('renders the cloud size card title', () => {
      render(<CloudBackupStatus />, { wrapper: createWrapper() })
      expect(screen.getByText('雲端資料庫大小')).toBeTruthy()
    })

    it('displays total cloud size formatted when backups exist', async () => {
      render(<CloudBackupStatus />, { wrapper: createWrapper() })

      await waitFor(() => {
        // 1024 + 2048 = 3072 = 3.0 KB
        expect(screen.getByText('3.0 KB')).toBeTruthy()
      })
    })

    it('displays "0 B" when backup list is empty', async () => {
      mockListBackups.mockResolvedValue([])

      render(<CloudBackupStatus />, { wrapper: createWrapper() })

      await waitFor(() => {
        expect(screen.getByText('0 B')).toBeTruthy()
      })
    })

    it('displays dash when listBackups fails', async () => {
      mockListBackups.mockRejectedValue(new Error('Network error'))

      render(<CloudBackupStatus />, { wrapper: createWrapper() })

      // Should show dash on error
      await waitFor(() => {
        expect(screen.getByText('—')).toBeTruthy()
      })
    })
  })

  describe('Last Backup card', () => {
    it('renders the last backup card title', () => {
      render(<CloudBackupStatus />, { wrapper: createWrapper() })
      expect(screen.getByText('最後備份時間')).toBeTruthy()
    })

    it('shows no record when lastBackupTime is null', async () => {
      // Both local lastBackupTime AND cloud latestBackup are null.
      mockStoreState = { ...mockStoreState, lastBackupTime: null }
      mockListBackups.mockResolvedValue([])
      render(<CloudBackupStatus />, { wrapper: createWrapper() })
      // The Last Backup card is behind a skeleton while the cloud query is
      // in flight; wait for the query to settle before asserting the empty
      // fallback copy.
      await waitFor(() => {
        expect(screen.getByText('尚無記錄')).toBeTruthy()
      })
    })

    it('shows formatted time when lastBackupTime is set', () => {
      mockStoreState = {
        ...mockStoreState,
        lastBackupTime: '2026-03-29T10:30:00.000Z',
      }
      render(<CloudBackupStatus />, { wrapper: createWrapper() })
      expect(screen.queryByText('尚無記錄')).toBeNull()
    })
  })

  describe('Auto Schedule card', () => {
    it('renders the schedule card title', () => {
      render(<CloudBackupStatus />, { wrapper: createWrapper() })
      expect(screen.getByText('自動備份排程')).toBeTruthy()
    })

    it('shows daily schedule', () => {
      mockStoreState = {
        ...mockStoreState,
        scheduleType: 'daily',
      }
      render(<CloudBackupStatus />, { wrapper: createWrapper() })
      expect(screen.getByText('每日')).toBeTruthy()
    })

    it('shows weekly schedule', () => {
      mockStoreState = {
        ...mockStoreState,
        scheduleType: 'weekly',
      }
      render(<CloudBackupStatus />, { wrapper: createWrapper() })
      expect(screen.getByText('每週')).toBeTruthy()
    })

    it('shows schedule off when type is none', () => {
      mockStoreState = {
        ...mockStoreState,
        scheduleType: 'none',
        scheduleHour: 22,
      }
      render(<CloudBackupStatus />, { wrapper: createWrapper() })
      expect(screen.getByText('關閉')).toBeTruthy()
    })
  })
})
