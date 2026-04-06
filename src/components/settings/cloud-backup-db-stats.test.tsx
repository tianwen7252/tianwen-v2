/**
 * Tests for the CloudBackupDbStats component.
 * Covers local DB table stats and cloud backup summary (count, size, latest).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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

import { CloudBackupDbStats } from './cloud-backup-db-stats'

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
        // 3072 + 2048 + 1024 = 6144 = 6.0 KB
        expect(screen.getByText('6.0 KB')).toBeTruthy()
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
})
