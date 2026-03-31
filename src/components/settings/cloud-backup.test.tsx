/**
 * Tests for the CloudBackup main component.
 * Verifies that all sub-sections are rendered.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@tanstack/react-router', () => ({
  useSearch: () => ({ backupPage: 1 }),
  useNavigate: () => vi.fn(),
}))

vi.mock('@/lib/backup-config', () => ({
  isBackupConfigured: () => false,
}))

vi.mock('@/stores/backup-store', () => ({
  useBackupStore: vi.fn(
    (selector: (state: Record<string, unknown>) => unknown) =>
      selector({
        scheduleType: 'daily',
        scheduleHour: 22,
        lastBackupTime: null,
        isBackingUp: false,
        backupProgress: 0,
        backupError: null,
        startBackup: vi.fn(),
        updateProgress: vi.fn(),
        finishBackup: vi.fn(),
      }),
  ),
}))

vi.mock('@/hooks/use-db-stats', () => ({
  useDbStats: () => ({
    tables: [
      { tableName: 'orders', rowCount: 10 },
      { tableName: 'commodities', rowCount: 5 },
    ],
    totalRows: 15,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

import { CloudBackup } from './cloud-backup'

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

describe('CloudBackup', () => {
  it('renders without errors', () => {
    renderWithProviders(<CloudBackup />)
    // Should not throw
  })

  it('renders CloudBackupStatus section with KPI card titles', () => {
    renderWithProviders(<CloudBackup />)
    expect(screen.getByText('雲端資料庫大小')).toBeTruthy()
    expect(screen.getByText('最後備份時間')).toBeTruthy()
    expect(screen.getAllByText('自動備份排程').length).toBeGreaterThanOrEqual(1)
  })

  it('renders CloudBackupDbStats section with local and cloud', () => {
    renderWithProviders(<CloudBackup />)
    expect(screen.getByText('本機資料庫')).toBeTruthy()
    expect(screen.getByText('雲端資料庫')).toBeTruthy()
    expect(screen.getAllByText('資料表').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('筆數').length).toBeGreaterThanOrEqual(1)
  })

  it('renders CloudBackupActions section', () => {
    renderWithProviders(<CloudBackup />)
    expect(screen.getByText('備份操作')).toBeTruthy()
    expect(screen.getByText('立即備份')).toBeTruthy()
  })
})
