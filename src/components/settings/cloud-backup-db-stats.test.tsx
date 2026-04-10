/**
 * Tests for the CloudBackupDbStats component.
 * Covers local DB table stats and cloud backup summary (count, size, latest).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockRefetch = vi.fn()
let mockDbStats = {
  tables: [
    { tableName: 'commodities', rowCount: 25 },
    { tableName: 'orders', rowCount: 100 },
    { tableName: 'employees', rowCount: 8 },
  ],
  totalRows: 133,
  isLoading: false,
  error: null as Error | null,
  refetch: mockRefetch,
}

vi.mock('@/hooks/use-db-stats', () => ({
  useDbStats: () => mockDbStats,
}))

const mockListBackups = vi.hoisted(() =>
  vi.fn().mockResolvedValue([
    {
      filename: 'backup-300.sqlite.gz',
      size: 3072,
      createdAt: '2026-04-03T10:00:00Z',
    },
    {
      filename: 'backup-200.sqlite.gz',
      size: 2048,
      createdAt: '2026-04-02T10:00:00Z',
    },
    {
      filename: 'backup-100.sqlite.gz',
      size: 1024,
      createdAt: '2026-04-01T10:00:00Z',
    },
  ]),
)

vi.mock('@/lib/backup', () => ({
  createBackupService: () => ({
    listBackups: mockListBackups,
  }),
}))

const mockHasPreviousDatabase = vi.hoisted(() =>
  vi.fn().mockResolvedValue(false),
)
const mockRestorePreviousDatabase = vi.hoisted(() =>
  vi.fn().mockResolvedValue(undefined),
)
const mockGetPreviousDatabaseSize = vi.hoisted(() =>
  vi.fn().mockResolvedValue(0),
)
const mockDeletePreviousDatabase = vi.hoisted(() =>
  vi.fn().mockResolvedValue(undefined),
)
const mockExportDatabase = vi.hoisted(() =>
  vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
)
const mockErrorLogCreate = vi.hoisted(() => vi.fn().mockResolvedValue({}))

vi.mock('@/lib/repositories/provider', () => ({
  getDatabase: () => ({
    hasPreviousDatabase: mockHasPreviousDatabase,
    restorePreviousDatabase: mockRestorePreviousDatabase,
    getPreviousDatabaseSize: mockGetPreviousDatabaseSize,
    deletePreviousDatabase: mockDeletePreviousDatabase,
    exportDatabase: mockExportDatabase,
  }),
  getErrorLogRepo: () => ({
    create: mockErrorLogCreate,
  }),
}))

const mockNotify = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}))

vi.mock('@/components/ui/sonner', () => ({
  notify: mockNotify,
}))

// Mock window.location.reload
const mockReload = vi.fn()
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true,
})

import { CloudBackupDbStats } from './cloud-backup-db-stats'
import { clearLogBuffer } from '@/lib/log-buffer'

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderWithProviders(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('CloudBackupDbStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearLogBuffer()
    mockDbStats = {
      tables: [
        { tableName: 'commodities', rowCount: 25 },
        { tableName: 'orders', rowCount: 100 },
        { tableName: 'employees', rowCount: 8 },
      ],
      totalRows: 133,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    }
    mockListBackups.mockResolvedValue([
      {
        filename: 'backup-300.sqlite.gz',
        size: 3072,
        createdAt: '2026-04-03T10:00:00Z',
      },
      {
        filename: 'backup-200.sqlite.gz',
        size: 2048,
        createdAt: '2026-04-02T10:00:00Z',
      },
      {
        filename: 'backup-100.sqlite.gz',
        size: 1024,
        createdAt: '2026-04-01T10:00:00Z',
      },
    ])
    mockHasPreviousDatabase.mockResolvedValue(false)
    mockRestorePreviousDatabase.mockResolvedValue(undefined)
  })

  // ── Local DB stats (unchanged) ────────────────────────────────────────

  it('renders local and cloud section titles', () => {
    renderWithProviders(<CloudBackupDbStats />)
    expect(screen.getByText('本機資料庫')).toBeTruthy()
    expect(screen.getByText('雲端資料庫')).toBeTruthy()
  })

  it('renders table headers in local section', () => {
    renderWithProviders(<CloudBackupDbStats />)
    expect(screen.getAllByText('資料表').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('筆數').length).toBeGreaterThanOrEqual(1)
  })

  it('renders all local table names from useDbStats', () => {
    renderWithProviders(<CloudBackupDbStats />)
    expect(screen.getByText('commodities')).toBeTruthy()
    expect(screen.getByText('orders')).toBeTruthy()
    expect(screen.getByText('employees')).toBeTruthy()
  })

  it('renders row counts for each local table', () => {
    renderWithProviders(<CloudBackupDbStats />)
    expect(screen.getByText('25')).toBeTruthy()
    expect(screen.getByText('100')).toBeTruthy()
    expect(screen.getByText('8')).toBeTruthy()
  })

  it('renders total row in local section', () => {
    renderWithProviders(<CloudBackupDbStats />)
    expect(screen.getByText('合計')).toBeTruthy()
    expect(screen.getByText('133')).toBeTruthy()
  })

  it('formats large row counts with locale separators', () => {
    mockDbStats = {
      tables: [
        { tableName: 'orders', rowCount: 12345 },
        { tableName: 'employees', rowCount: 1000000 },
      ],
      totalRows: 1012345,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    }
    renderWithProviders(<CloudBackupDbStats />)
    expect(screen.queryByText('12345')).toBeNull()
    expect(screen.queryByText('1000000')).toBeNull()
    expect(screen.queryByText('1012345')).toBeNull()
    expect(screen.getByText('12,345')).toBeTruthy()
    expect(screen.getByText('1,000,000')).toBeTruthy()
    expect(screen.getByText('1,012,345')).toBeTruthy()
  })

  it('formats totalRows with locale separators', () => {
    mockDbStats = {
      tables: [{ tableName: 'orders', rowCount: 999 }],
      totalRows: 9999999,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    }
    renderWithProviders(<CloudBackupDbStats />)
    expect(screen.queryByText('9999999')).toBeNull()
    expect(screen.getByText('9,999,999')).toBeTruthy()
  })

  // ── Cloud stats panel ────────────────────────────────────────────────

  describe('Cloud stats', () => {
    it('shows backup count in cloud section', async () => {
      renderWithProviders(<CloudBackupDbStats />)

      await waitFor(() => {
        expect(screen.getByText('3')).toBeTruthy()
      })
    })

    it('shows total cloud storage size in cloud section', async () => {
      renderWithProviders(<CloudBackupDbStats />)

      await waitFor(() => {
        // 3072 + 2048 + 1024 = 6144 = 6.0 KB; displayed as "USED / QUOTA"
        expect(screen.getByText('6.0 KB / 10.0 GB')).toBeTruthy()
      })
    })

    it('shows latest backup filename in cloud section', async () => {
      renderWithProviders(<CloudBackupDbStats />)

      await waitFor(() => {
        expect(screen.getByText('backup-300.sqlite.gz')).toBeTruthy()
      })
    })

    it('shows empty state when no cloud backups exist', async () => {
      mockListBackups.mockResolvedValue([])

      renderWithProviders(<CloudBackupDbStats />)

      await waitFor(() => {
        expect(screen.getByText('尚無備份')).toBeTruthy()
      })
    })
  })

  // ── Restore Previous Database button ──────────────────────────────────────

  describe('Restore Previous Database button', () => {
    it('disables restore button when hasPreviousDatabase returns false', async () => {
      mockHasPreviousDatabase.mockResolvedValue(false)

      renderWithProviders(<CloudBackupDbStats />)

      // Button is always rendered but should be disabled when no previous DB exists
      const btn = screen.getByText('還原上一版本') as HTMLButtonElement
      expect(btn.disabled).toBe(true)
    })

    it('renders restore button when hasPreviousDatabase returns true', async () => {
      mockHasPreviousDatabase.mockResolvedValue(true)

      renderWithProviders(<CloudBackupDbStats />)

      await waitFor(() => {
        const btn = screen.getByText('還原上一版本') as HTMLButtonElement
        expect(btn.disabled).toBe(false)
      })
    })

    it('opens confirm modal when restore button is clicked', async () => {
      mockHasPreviousDatabase.mockResolvedValue(true)

      renderWithProviders(<CloudBackupDbStats />)

      await waitFor(() => {
        const btn = screen.getByText('還原上一版本') as HTMLButtonElement
        expect(btn.disabled).toBe(false)
      })

      const restoreButton = screen.getByText('還原上一版本')
      fireEvent.click(restoreButton)

      // Modal title appears in both sr-only h2 and visible div — use getAllByText
      expect(screen.getAllByText('還原資料庫').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('確定要還原上一版本資料庫？')).toBeTruthy()
    })

    it('calls restorePreviousDatabase and reloads on confirm', async () => {
      mockHasPreviousDatabase.mockResolvedValue(true)

      renderWithProviders(<CloudBackupDbStats />)

      await waitFor(() => {
        const btn = screen.getByText('還原上一版本') as HTMLButtonElement
        expect(btn.disabled).toBe(false)
      })

      fireEvent.click(screen.getByText('還原上一版本'))

      await waitFor(() => {
        expect(screen.getByText('確認')).toBeTruthy()
      })

      fireEvent.click(screen.getByText('確認'))

      await waitFor(() => {
        expect(mockRestorePreviousDatabase).toHaveBeenCalledOnce()
        expect(mockReload).toHaveBeenCalledOnce()
      })
    })

    it('shows error toast and does not reload when restore fails', async () => {
      mockHasPreviousDatabase.mockResolvedValue(true)
      mockRestorePreviousDatabase.mockRejectedValueOnce(new Error('No prev db'))

      renderWithProviders(<CloudBackupDbStats />)

      await waitFor(() => {
        const btn = screen.getByText('還原上一版本') as HTMLButtonElement
        expect(btn.disabled).toBe(false)
      })

      fireEvent.click(screen.getByText('還原上一版本'))

      await waitFor(() => {
        expect(screen.getByText('確認')).toBeTruthy()
      })

      fireEvent.click(screen.getByText('確認'))

      await waitFor(() => {
        expect(mockNotify.error).toHaveBeenCalled()
      })

      expect(mockReload).not.toHaveBeenCalled()
    })

    it('shows overlay with restore message during restore', async () => {
      mockHasPreviousDatabase.mockResolvedValue(true)

      let resolveRestore!: () => void
      mockRestorePreviousDatabase.mockReturnValue(
        new Promise<void>(resolve => {
          resolveRestore = resolve
        }),
      )

      renderWithProviders(<CloudBackupDbStats />)

      await waitFor(() => {
        const btn = screen.getByText('還原上一版本') as HTMLButtonElement
        expect(btn.disabled).toBe(false)
      })

      fireEvent.click(screen.getByText('還原上一版本'))

      await waitFor(() => {
        expect(screen.getByText('確認')).toBeTruthy()
      })

      fireEvent.click(screen.getByText('確認'))

      await waitFor(() => {
        expect(screen.getByText('還原上一版本資料庫中')).toBeTruthy()
      })

      resolveRestore()
    })

    it('closes modal when cancel is clicked', async () => {
      mockHasPreviousDatabase.mockResolvedValue(true)

      renderWithProviders(<CloudBackupDbStats />)

      await waitFor(() => {
        const btn = screen.getByText('還原上一版本') as HTMLButtonElement
        expect(btn.disabled).toBe(false)
      })

      fireEvent.click(screen.getByText('還原上一版本'))

      await waitFor(() => {
        expect(screen.getByText('確定要還原上一版本資料庫？')).toBeTruthy()
      })

      fireEvent.click(screen.getByText('取消'))

      await waitFor(() => {
        // After close, the confirmation description should be gone
        expect(screen.queryByText('確定要還原上一版本資料庫？')).toBeNull()
      })
    })
  })
})
