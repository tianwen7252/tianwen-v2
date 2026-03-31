/**
 * Tests for the CloudBackupDbStats component.
 * Covers local/cloud split rendering with row counts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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

let mockIsConfigured = false

vi.mock('@/hooks/use-db-stats', () => ({
  useDbStats: () => mockDbStats,
}))

vi.mock('@/lib/backup-config', () => ({
  isBackupConfigured: () => mockIsConfigured,
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
    mockIsConfigured = false
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
  })

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

  it('shows unavailable message in cloud section', () => {
    renderWithProviders(<CloudBackupDbStats />)
    expect(screen.getByText('連線後顯示雲端資料')).toBeTruthy()
  })
})
