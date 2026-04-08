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
const mockNotifyError = vi.fn()

vi.mock('@/components/ui/sonner', () => ({
  notify: {
    success: (...args: unknown[]) => mockNotifySuccess(...args),
    info: (...args: unknown[]) => mockNotifyInfo(...args),
    error: (...args: unknown[]) => mockNotifyError(...args),
  },
}))

// Mock TanStack Router hooks
const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useSearch: () => ({ errorPage: 1 }),
  useNavigate: () => mockNavigate,
}))

// Mock useCloudBackups
vi.mock('@/hooks/use-cloud-backups', () => ({
  useCloudBackups: () => ({
    totalSize: 0,
    backupCount: 0,
    latestBackup: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

// Mock device utilities
let mockDeviceDisplayName = 'Mac-test123'
const mockGetDeviceId = vi.fn(() => 'test-device-id')
const mockGetDeviceType = vi.fn(() => 'Mac')
const mockGetDeviceDisplayName = vi.fn(() => mockDeviceDisplayName)
const mockSetDeviceName = vi.fn()

vi.mock('@/lib/device', () => ({
  getDeviceId: () => mockGetDeviceId(),
  getDeviceType: () => mockGetDeviceType(),
  getDeviceDisplayName: () => mockGetDeviceDisplayName(),
  setDeviceName: (name: string) => mockSetDeviceName(name),
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
    mockDeviceDisplayName = 'Mac-test123'
    mockFindPaginatedErrors.mockResolvedValue([])
    mockCountErrors.mockResolvedValue(0)
    mockClearAllErrors.mockResolvedValue(undefined)
    mockEstimate.mockResolvedValue({ usage: 50_000_000, quota: 1_000_000_000 })
    mockGetDeviceId.mockReturnValue('test-device-id')
    mockGetDeviceType.mockReturnValue('Mac')
    mockGetDeviceDisplayName.mockReturnValue('Mac-test123')
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
      // Version comes from package.json via Vite define (__APP_VERSION__)
      expect(screen.getByText(/v\d+\.\d+\.\d+/)).toBeTruthy()
    })

    it('displays storage percentage after estimate resolves', async () => {
      mockEstimate.mockResolvedValue({
        usage: 250_000_000,
        quota: 1_000_000_000,
      })
      renderWithProviders(<SystemInfo />)
      // 250MB / 1GB = 25%
      await waitFor(() => {
        expect(screen.getByText('25%')).toBeTruthy()
      })
    })

    it('handles zero quota gracefully', async () => {
      mockEstimate.mockResolvedValue({ usage: 0, quota: 0 })
      renderWithProviders(<SystemInfo />)
      await waitFor(() => {
        // Both local and cloud progress bars show 0%; verify at least one is present
        expect(screen.getAllByText('0%').length).toBeGreaterThanOrEqual(1)
      })
    })

    it('handles storage estimate failure gracefully', async () => {
      mockEstimate.mockRejectedValue(new Error('Not supported'))
      renderWithProviders(<SystemInfo />)
      // Should not crash — should show 0% or fallback
      await waitFor(() => {
        // Both local and cloud progress bars show 0%; verify at least one is present
        expect(screen.getAllByText('0%').length).toBeGreaterThanOrEqual(1)
      })
    })

    it('displays backup status placeholder', () => {
      renderWithProviders(<SystemInfo />)
      // Cloud backup card now shows AnimatedCircularProgressBar with usage/remaining labels
      expect(screen.getAllByText('使用量').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('剩餘量').length).toBeGreaterThanOrEqual(1)
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

  // ── Device Name ────────────────────────────────────────────────────────

  describe('Device Name', () => {
    it('renders device name row in application card', () => {
      renderWithProviders(<SystemInfo />)
      expect(screen.getByText('裝置代號')).toBeTruthy()
    })

    it('shows default device display name (type-id)', () => {
      mockGetDeviceDisplayName.mockReturnValue('Mac-test123')
      renderWithProviders(<SystemInfo />)

      const display = screen.getByTestId('device-name-display')
      expect(display.textContent).toBe('Mac-test123')
    })

    it('shows custom device name when set', () => {
      mockGetDeviceDisplayName.mockReturnValue('iPad-MAIN')
      renderWithProviders(<SystemInfo />)

      const display = screen.getByTestId('device-name-display')
      expect(display.textContent).toBe('iPad-MAIN')
    })

    it('hides edit button when not admin', () => {
      mockIsAdmin = false
      renderWithProviders(<SystemInfo />)

      expect(screen.queryByTestId('edit-device-name-btn')).toBeNull()
    })

    it('shows edit button when admin', () => {
      mockIsAdmin = true
      renderWithProviders(<SystemInfo />)

      expect(screen.getByTestId('edit-device-name-btn')).toBeTruthy()
    })

    it('opens modal when edit button is clicked', async () => {
      mockIsAdmin = true
      const user = userEvent.setup()
      renderWithProviders(<SystemInfo />)

      await user.click(screen.getByTestId('edit-device-name-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('device-name-input')).toBeTruthy()
      })
    })

    it('calls PUT /api/device on confirm and updates display', async () => {
      mockIsAdmin = true
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            id: 'test-device-id',
            name: 'Bar Counter',
            type: 'Mac',
            mode: 'development',
            updatedAt: new Date().toISOString(),
          },
        }),
      } as Response)

      const user = userEvent.setup()
      renderWithProviders(<SystemInfo />)

      await user.click(screen.getByTestId('edit-device-name-btn'))
      await waitFor(() => {
        expect(screen.getByTestId('device-name-input')).toBeTruthy()
      })

      await user.clear(screen.getByTestId('device-name-input'))
      await user.type(screen.getByTestId('device-name-input'), 'Bar Counter')

      // Click the confirm button
      await user.click(screen.getByText('確認'))

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/device',
          expect.objectContaining({ method: 'PUT' }),
        )
        expect(mockSetDeviceName).toHaveBeenCalledWith('Bar Counter')
        expect(mockNotifySuccess).toHaveBeenCalled()
      })
    })

    it('shows duplicate error toast on 409 response', async () => {
      mockIsAdmin = true
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ success: false, error: 'Device name already in use' }),
      } as Response)

      const user = userEvent.setup()
      renderWithProviders(<SystemInfo />)

      await user.click(screen.getByTestId('edit-device-name-btn'))
      await waitFor(() => {
        expect(screen.getByTestId('device-name-input')).toBeTruthy()
      })

      await user.type(screen.getByTestId('device-name-input'), 'Taken Name')
      await user.click(screen.getByText('確認'))

      await waitFor(() => {
        expect(mockNotifyError).toHaveBeenCalledWith('裝置代號已被使用')
      })
    })
  })
})
