/**
 * Tests for CloudBackupV1Import component.
 * Covers Connect button state, file list rendering, empty state,
 * and import confirmation modal.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthExpiredError } from '@/lib/errors'

// ── Mocks ───────────────────────────────────────────────────────────────────

let mockAppStoreState = {
  googleUser: null as { sub: string; name: string; email: string } | null,
  accessToken: null as string | null,
  isAdmin: false,
}

vi.mock('@/stores/app-store', () => ({
  useAppStore: vi.fn((selector: (state: typeof mockAppStoreState) => unknown) =>
    selector(mockAppStoreState),
  ),
}))

const mockLogin = vi.fn()
const mockHandleAuthError = vi.fn()
vi.mock('@/hooks/use-google-auth', () => ({
  useGoogleAuth: () => ({
    login: mockLogin,
    isLoggedIn: mockAppStoreState.googleUser !== null,
    handleAuthError: mockHandleAuthError,
  }),
}))

const mockListDriveBackupFiles = vi.fn()
const mockDownloadDriveFile = vi.fn()
vi.mock('@/lib/google-drive-service', () => ({
  listDriveBackupFiles: (...args: unknown[]) =>
    mockListDriveBackupFiles(...args),
  downloadDriveFile: (...args: unknown[]) => mockDownloadDriveFile(...args),
}))

const mockTransformV1Data = vi.fn()
vi.mock('@/lib/v1-data-transformer', () => ({
  transformV1Data: (...args: unknown[]) => mockTransformV1Data(...args),
}))

vi.mock('@/components/ui/sonner', () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

import { CloudBackupV1Import } from './cloud-backup-v1-import'

// ── Tests ───────────────────────────────────────────────────────────────────

describe('CloudBackupV1Import', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAppStoreState = {
      googleUser: null,
      accessToken: null,
      isAdmin: false,
    }
    mockListDriveBackupFiles.mockResolvedValue([])
    mockTransformV1Data.mockReturnValue({
      tables: new Map(),
      warnings: [],
    })
  })

  // ── Not logged in ───────────────────────────────────────────────────────

  describe('when not logged in', () => {
    it('shows Connect Google Drive button', () => {
      render(<CloudBackupV1Import />)

      expect(screen.getByText('連接 Google Drive')).toBeTruthy()
    })

    it('does not show file list', () => {
      render(<CloudBackupV1Import />)

      expect(screen.queryByText('檔案名稱')).toBeNull()
    })
  })

  // ── Logged in ─────────────────────────────────────────────────────────

  describe('when logged in', () => {
    beforeEach(() => {
      mockAppStoreState = {
        googleUser: {
          sub: '123',
          name: 'Test User',
          email: 'test@example.com',
        },
        accessToken: 'test-token',
        isAdmin: true,
      }
    })

    it('shows file list table headers when logged in', async () => {
      mockListDriveBackupFiles.mockResolvedValue([
        {
          id: 'f1',
          name: 'tianwen-backup.db.gz',
          size: 1024,
          createdTime: '2026-03-29T10:00:00Z',
          mimeType: 'application/gzip',
        },
      ])

      render(<CloudBackupV1Import />)

      await waitFor(() => {
        expect(screen.getByText('檔案名稱')).toBeTruthy()
      })
    })

    it('shows no files message when list is empty', async () => {
      mockListDriveBackupFiles.mockResolvedValue([])

      render(<CloudBackupV1Import />)

      await waitFor(() => {
        expect(screen.getByText('未找到備份檔案')).toBeTruthy()
      })
    })

    it('shows file names in the list', async () => {
      mockListDriveBackupFiles.mockResolvedValue([
        {
          id: 'f1',
          name: 'tianwen-backup-2026.db.gz',
          size: 2048,
          createdTime: '2026-03-29T10:00:00Z',
          mimeType: 'application/gzip',
        },
      ])

      render(<CloudBackupV1Import />)

      await waitFor(() => {
        expect(screen.getByText('tianwen-backup-2026.db.gz')).toBeTruthy()
      })
    })

    it('shows import button for each file', async () => {
      mockListDriveBackupFiles.mockResolvedValue([
        {
          id: 'f1',
          name: 'tianwen-backup.db.gz',
          size: 1024,
          createdTime: '2026-03-29T10:00:00Z',
          mimeType: 'application/gzip',
        },
      ])

      render(<CloudBackupV1Import />)

      await waitFor(() => {
        expect(screen.getByText('匯入')).toBeTruthy()
      })
    })

    it('import button triggers confirmation modal', async () => {
      mockListDriveBackupFiles.mockResolvedValue([
        {
          id: 'f1',
          name: 'tianwen-backup.db.gz',
          size: 1024,
          createdTime: '2026-03-29T10:00:00Z',
          mimeType: 'application/gzip',
        },
      ])

      render(<CloudBackupV1Import />)

      await waitFor(() => {
        expect(screen.getByText('匯入')).toBeTruthy()
      })

      fireEvent.click(screen.getByText('匯入'))

      await waitFor(() => {
        // Confirmation modal text
        expect(
          screen.getByText('此操作可能覆蓋現有資料，確定要繼續嗎？'),
        ).toBeTruthy()
      })
    })

    // ── AuthExpiredError handling ──────────────────────────────────────────

    it('calls handleAuthError when listDriveBackupFiles throws AuthExpiredError', async () => {
      mockListDriveBackupFiles.mockRejectedValue(new AuthExpiredError())

      render(<CloudBackupV1Import />)

      await waitFor(() => {
        expect(mockHandleAuthError).toHaveBeenCalledOnce()
        expect(mockHandleAuthError).toHaveBeenCalledWith(
          expect.any(AuthExpiredError),
        )
      })
    })

    it('does NOT call handleAuthError for a generic Drive error', async () => {
      mockListDriveBackupFiles.mockRejectedValue(
        new Error('Google Drive API error: 500 Internal Server Error'),
      )

      render(<CloudBackupV1Import />)

      // Wait for loading to settle
      await waitFor(() => {
        expect(mockListDriveBackupFiles).toHaveBeenCalled()
      })

      expect(mockHandleAuthError).not.toHaveBeenCalled()
    })
  })
})
