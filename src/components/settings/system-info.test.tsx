/**
 * Tests for the SystemInfo component.
 * Covers KPI cards, system details, quick actions, and error logs sections.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Mock navigator.storage.estimate
const mockEstimate = vi.fn()
Object.defineProperty(navigator, 'storage', {
  value: { estimate: mockEstimate },
  writable: true,
  configurable: true,
})

// Mock app store
let mockGoogleUser: {
  sub: string
  name: string
  email: string
  picture?: string
} | null = null
let mockIsAdmin = false

vi.mock('@/hooks/use-google-auth', () => ({
  useGoogleAuth: () => ({
    googleUser: mockGoogleUser,
    isLoggedIn: mockGoogleUser !== null,
    isAdmin: mockIsAdmin,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

// Mock error log repository
const mockFindPaginatedErrors = vi.fn().mockResolvedValue([])
const mockCountErrors = vi.fn().mockResolvedValue(0)
const mockClearAllErrors = vi.fn().mockResolvedValue(undefined)

vi.mock('@/lib/repositories/provider', () => ({
  getErrorLogRepo: () => ({
    findPaginated: mockFindPaginatedErrors,
    count: mockCountErrors,
    clearAll: mockClearAllErrors,
  }),
}))

// Mock sonner notifications
const mockNotifySuccess = vi.fn()
const mockNotifyInfo = vi.fn()

vi.mock('@/components/ui/sonner', () => ({
  notify: {
    success: (...args: unknown[]) => mockNotifySuccess(...args),
    info: (...args: unknown[]) => mockNotifyInfo(...args),
  },
}))

// Mock TanStack Router hooks
const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useSearch: () => ({ errorPage: 1 }),
  useNavigate: () => mockNavigate,
}))

// Mock import.meta.env
vi.stubEnv('MODE', 'development')

import { SystemInfo } from './system-info'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderWithProviders(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SystemInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGoogleUser = null
    mockIsAdmin = false
    mockFindPaginatedErrors.mockResolvedValue([])
    mockCountErrors.mockResolvedValue(0)
    mockClearAllErrors.mockResolvedValue(undefined)
    mockEstimate.mockResolvedValue({ usage: 50_000_000, quota: 1_000_000_000 })
  })

  // ── Section 1: KPI Cards ────────────────────────────────────────────────

  describe('KPI Cards', () => {
    it('renders three KPI cards (version, storage, backup)', () => {
      renderWithProviders(<SystemInfo />)
      // zh-TW translated card titles
      expect(screen.getByText('目前版本')).toBeTruthy()
      expect(screen.getByText('本機儲存空間')).toBeTruthy()
      expect(screen.getByText('雲端備份狀態')).toBeTruthy()
    })

    it('displays the app version', () => {
      renderWithProviders(<SystemInfo />)
      expect(screen.getByText(/2\.0\.0-alpha/)).toBeTruthy()
    })

    it('displays storage percentage after estimate resolves', async () => {
      mockEstimate.mockResolvedValue({
        usage: 250_000_000,
        quota: 1_000_000_000,
      })
      renderWithProviders(<SystemInfo />)
      // 250MB / 1GB = 25%
      await waitFor(() => {
        expect(screen.getByText('25')).toBeTruthy()
      })
    })

    it('handles zero quota gracefully', async () => {
      mockEstimate.mockResolvedValue({ usage: 0, quota: 0 })
      renderWithProviders(<SystemInfo />)
      await waitFor(() => {
        expect(screen.getByText('0')).toBeTruthy()
      })
    })

    it('handles storage estimate failure gracefully', async () => {
      mockEstimate.mockRejectedValue(new Error('Not supported'))
      renderWithProviders(<SystemInfo />)
      // Should not crash — should show 0 or fallback
      await waitFor(() => {
        expect(screen.getByText('0')).toBeTruthy()
      })
    })

    it('displays backup status placeholder', () => {
      renderWithProviders(<SystemInfo />)
      expect(screen.getByText('尚未備份')).toBeTruthy()
      expect(screen.getByText(/尚無記錄/)).toBeTruthy()
    })
  })

  // ── Section 2: System Details ───────────────────────────────────────────

  describe('System Details', () => {
    it('renders application info card', () => {
      renderWithProviders(<SystemInfo />)
      expect(screen.getByText('應用程式')).toBeTruthy()
      expect(screen.getByText('部署模式')).toBeTruthy()
      expect(screen.getByText('環境')).toBeTruthy()
    })

    it('renders database info card', () => {
      renderWithProviders(<SystemInfo />)
      expect(screen.getByText('資料庫')).toBeTruthy()
      expect(screen.getByText('Schema 版本')).toBeTruthy()
    })

    it('renders login info card with not-logged-in state', () => {
      renderWithProviders(<SystemInfo />)
      expect(screen.getByText('登入資訊')).toBeTruthy()
      expect(screen.getByText('未登入')).toBeTruthy()
    })

    it('renders login info with user email when logged in', () => {
      mockGoogleUser = {
        sub: '123',
        name: 'Test User',
        email: 'test@example.com',
      }
      mockIsAdmin = true
      renderWithProviders(<SystemInfo />)
      expect(screen.getByText('test@example.com')).toBeTruthy()
    })

    it('shows environment as DEV in development mode', () => {
      renderWithProviders(<SystemInfo />)
      expect(screen.getByText('DEV')).toBeTruthy()
    })

    it('displays schema version number', () => {
      renderWithProviders(<SystemInfo />)
      // SCHEMA_VERSION is 2
      expect(screen.getByText('2')).toBeTruthy()
    })
  })

  // ── Section 3: Quick Actions ────────────────────────────────────────────

  describe('Quick Actions', () => {
    it('hides quick actions panel when not admin', () => {
      mockIsAdmin = false
      renderWithProviders(<SystemInfo />)
      expect(screen.queryByText('快捷操作')).toBeNull()
    })

    it('renders quick action buttons when admin', () => {
      mockIsAdmin = true
      renderWithProviders(<SystemInfo />)
      expect(screen.getByText('快捷操作')).toBeTruthy()
      expect(screen.getByText('清除快取')).toBeTruthy()
      expect(screen.getByText('重新載入App')).toBeTruthy()
    })

    it('does not show export db button (moved to cloud backup)', () => {
      mockIsAdmin = true
      renderWithProviders(<SystemInfo />)
      expect(screen.queryByText('匯出資料庫')).toBeNull()
    })

    it('calls caches.delete on clear cache click', async () => {
      mockIsAdmin = true
      const mockDelete = vi.fn().mockResolvedValue(true)
      const mockKeys = vi.fn().mockResolvedValue(['cache-1', 'cache-2'])
      Object.defineProperty(window, 'caches', {
        value: { keys: mockKeys, delete: mockDelete },
        writable: true,
        configurable: true,
      })

      const user = userEvent.setup()
      renderWithProviders(<SystemInfo />)
      await user.click(screen.getByText('清除快取'))

      await waitFor(() => {
        expect(mockKeys).toHaveBeenCalled()
        expect(mockDelete).toHaveBeenCalledTimes(2)
      })
    })
  })

  // ── Section 4: Error Logs ──────────────────────────────────────────────

  describe('Error Logs', () => {
    it('renders error logs section', () => {
      renderWithProviders(<SystemInfo />)
      expect(screen.getByText('Error Logs')).toBeTruthy()
    })

    it('shows empty state when no error logs', async () => {
      mockFindPaginatedErrors.mockResolvedValue([])
      mockCountErrors.mockResolvedValue(0)
      renderWithProviders(<SystemInfo />)
      await waitFor(() => {
        expect(screen.getByText('無錯誤記錄')).toBeTruthy()
      })
    })

    it('renders error log entries in table', async () => {
      mockFindPaginatedErrors.mockResolvedValue([
        {
          id: 'log-1',
          message: 'Something broke',
          source: 'app.tsx',
          stack: null,
          createdAt: 1700000000000,
        },
        {
          id: 'log-2',
          message: 'Another error',
          source: 'order.tsx',
          stack: null,
          createdAt: 1700000060000,
        },
      ])
      mockCountErrors.mockResolvedValue(2)
      renderWithProviders(<SystemInfo />)

      await waitFor(() => {
        expect(screen.getByText('Something broke')).toBeTruthy()
        expect(screen.getByText('app.tsx')).toBeTruthy()
        expect(screen.getByText('Another error')).toBeTruthy()
        expect(screen.getByText('order.tsx')).toBeTruthy()
      })
    })

    it('renders table headers', async () => {
      mockFindPaginatedErrors.mockResolvedValue([
        {
          id: 'log-1',
          message: 'Test',
          source: 'test.tsx',
          stack: null,
          createdAt: 1700000000000,
        },
      ])
      mockCountErrors.mockResolvedValue(1)
      renderWithProviders(<SystemInfo />)

      await waitFor(() => {
        // zh-TW table headers
        expect(screen.getByText('來源')).toBeTruthy()
        expect(screen.getByText('訊息')).toBeTruthy()
      })
    })

    it('clears logs on clear button click', async () => {
      mockFindPaginatedErrors.mockResolvedValue([
        {
          id: 'log-1',
          message: 'Test',
          source: 'test.tsx',
          stack: null,
          createdAt: 1700000000000,
        },
      ])
      mockCountErrors.mockResolvedValue(1)
      const user = userEvent.setup()
      renderWithProviders(<SystemInfo />)

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeTruthy()
      })

      // "清除記錄" button belongs to error logs section
      await user.click(screen.getByText('清除記錄'))

      await waitFor(() => {
        expect(mockClearAllErrors).toHaveBeenCalled()
      })
    })

    it('calls findPaginated with page 1 and pageSize 20', async () => {
      renderWithProviders(<SystemInfo />)
      await waitFor(() => {
        expect(mockFindPaginatedErrors).toHaveBeenCalledWith(1, 20)
      })
    })

    it('shows pagination when total count exceeds page size', async () => {
      mockFindPaginatedErrors.mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({
          id: `log-${i}`,
          message: `Error ${i}`,
          source: 'test.tsx',
          stack: null,
          createdAt: 1700000000000 - i * 1000,
        })),
      )
      mockCountErrors.mockResolvedValue(45)
      renderWithProviders(<SystemInfo />)

      await waitFor(() => {
        // PaginationControls shows page indicator: "1 / 3"
        expect(screen.getByText(/1 \/ 3/)).toBeTruthy()
      })
    })

    it('does not show pagination when total fits in one page', async () => {
      mockFindPaginatedErrors.mockResolvedValue([
        {
          id: 'log-1',
          message: 'Test',
          source: 'test.tsx',
          stack: null,
          createdAt: 1700000000000,
        },
      ])
      mockCountErrors.mockResolvedValue(1)
      renderWithProviders(<SystemInfo />)

      await waitFor(() => {
        expect(screen.getByText('Test')).toBeTruthy()
      })

      // PaginationControls should not render when totalPages <= 1
      expect(screen.queryByText(/上一頁/)).toBeNull()
      expect(screen.queryByText(/下一頁/)).toBeNull()
    })
  })
})
