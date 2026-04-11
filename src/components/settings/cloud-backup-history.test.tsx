/**
 * Tests for CloudBackupHistory component — import backup feature (V2-215).
 * Covers: import button, confirm modal, overlay, download+import flow, error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockUseCloudBackups = vi.hoisted(() =>
  vi.fn().mockReturnValue({
    backups: [
      {
        filename: 'tianwen-ipad-2026-04-01_10-00-00.sqlite.gz',
        size: 1024,
        createdAt: '2026-04-01T10:00:00Z',
      },
      {
        filename: 'tianwen-ipad-2026-04-02_10-00-00.sqlite.gz',
        size: 2048,
        createdAt: '2026-04-02T10:00:00Z',
      },
    ],
    isLoading: false,
  }),
)

vi.mock('@/hooks/use-cloud-backups', () => ({
  useCloudBackups: mockUseCloudBackups,
}))

const mockNotify = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}))

vi.mock('@/components/ui/sonner', () => ({
  notify: mockNotify,
}))

const mockDownload = vi.hoisted(() =>
  vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
)
const mockDecompress = vi.hoisted(() =>
  vi.fn().mockResolvedValue(new Uint8Array([5, 6, 7, 8])),
)

vi.mock('@/lib/backup', () => ({
  createBackupService: () => ({
    download: mockDownload,
  }),
  decompress: mockDecompress,
}))

const mockImportDatabase = vi.hoisted(() =>
  vi.fn().mockResolvedValue(undefined),
)

const mockErrorLogCreate = vi.hoisted(() => vi.fn().mockResolvedValue({}))

vi.mock('@/lib/repositories/provider', () => ({
  getDatabase: () => ({
    importDatabase: mockImportDatabase,
  }),
  getErrorLogRepo: () => ({
    create: mockErrorLogCreate,
  }),
}))

// Mock window.location.reload
const mockReload = vi.fn()
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true,
})

import { CloudBackupHistory } from './cloud-backup-history'
import { clearLogBuffer } from '@/lib/log-buffer'

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderComponent() {
  return render(<CloudBackupHistory />)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CloudBackupHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearLogBuffer()
    mockReload.mockClear()
    mockUseCloudBackups.mockReturnValue({
      backups: [
        {
          filename: 'tianwen-ipad-2026-04-01_10-00-00.sqlite.gz',
          size: 1024,
          createdAt: '2026-04-01T10:00:00Z',
        },
        {
          filename: 'tianwen-ipad-2026-04-02_10-00-00.sqlite.gz',
          size: 2048,
          createdAt: '2026-04-02T10:00:00Z',
        },
      ],
      isLoading: false,
    })
    mockDownload.mockResolvedValue(new Uint8Array([1, 2, 3, 4]))
    mockDecompress.mockResolvedValue(new Uint8Array([5, 6, 7, 8]))
    mockImportDatabase.mockResolvedValue(undefined)
  })

  // ── Table structure ────────────────────────────────────────────────────────

  it('renders the backup history card title', () => {
    renderComponent()
    expect(screen.getByText('備份記錄')).toBeTruthy()
  })

  it('renders the Actions column header', () => {
    renderComponent()
    expect(screen.getByText('操作')).toBeTruthy()
  })

  it('renders an import button for each backup row', () => {
    renderComponent()
    const importButtons = screen.getAllByText('匯入')
    expect(importButtons).toHaveLength(2)
  })

  it('renders loading state when isLoading is true', () => {
    mockUseCloudBackups.mockReturnValue({ backups: [], isLoading: true })
    renderComponent()
    expect(screen.getByText('...')).toBeTruthy()
  })

  it('renders empty state when there are no backups', () => {
    mockUseCloudBackups.mockReturnValue({ backups: [], isLoading: false })
    renderComponent()
    expect(screen.getByText('尚無備份記錄')).toBeTruthy()
  })

  // ── Confirm modal ──────────────────────────────────────────────────────────

  it('opens confirm modal when import button is clicked', () => {
    renderComponent()
    const importButton = screen.getAllByText('匯入')[0]!
    fireEvent.click(importButton)
    // Modal title appears in both sr-only h2 and visible div — getAllByText handles both
    expect(screen.getAllByText('匯入備份').length).toBeGreaterThanOrEqual(1)
  })

  it('shows the confirmation description in the modal', () => {
    renderComponent()
    const importButton = screen.getAllByText('匯入')[0]!
    fireEvent.click(importButton)
    expect(screen.getByText('確定要匯入此備份？現有資料將被取代')).toBeTruthy()
  })

  it('closes modal when cancel is clicked', async () => {
    renderComponent()
    const importButton = screen.getAllByText('匯入')[0]!
    fireEvent.click(importButton)

    const cancelButton = screen.getByText('取消')
    fireEvent.click(cancelButton)

    await waitFor(() => {
      // After close, the confirmation description should be gone
      expect(
        screen.queryByText('確定要匯入此備份？現有資料將被取代'),
      ).toBeNull()
    })
  })

  // ── Import flow ────────────────────────────────────────────────────────────

  it('calls download with the correct filename on confirm', async () => {
    renderComponent()
    const importButton = screen.getAllByText('匯入')[0]!
    fireEvent.click(importButton)

    const confirmButton = screen.getByText('確認')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockDownload).toHaveBeenCalledWith(
        'tianwen-ipad-2026-04-01_10-00-00.sqlite.gz',
      )
    })
  })

  it('calls decompress with the downloaded data', async () => {
    renderComponent()
    const importButton = screen.getAllByText('匯入')[0]!
    fireEvent.click(importButton)

    const confirmButton = screen.getByText('確認')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockDecompress).toHaveBeenCalledWith(new Uint8Array([1, 2, 3, 4]))
    })
  })

  it('calls importDatabase with the decompressed data buffer', async () => {
    renderComponent()
    const importButton = screen.getAllByText('匯入')[0]!
    fireEvent.click(importButton)

    const confirmButton = screen.getByText('確認')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockImportDatabase).toHaveBeenCalledWith(expect.any(ArrayBuffer))
    })
  })

  it('reloads the page after a successful import', async () => {
    renderComponent()
    const importButton = screen.getAllByText('匯入')[0]!
    fireEvent.click(importButton)

    const confirmButton = screen.getByText('確認')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockReload).toHaveBeenCalledOnce()
    })
  })

  // ── Overlay ────────────────────────────────────────────────────────────────

  it('shows loading overlay while import is in progress', async () => {
    // Make download take time so we can observe the overlay
    let resolveDownload!: (v: Uint8Array) => void
    mockDownload.mockReturnValue(
      new Promise<Uint8Array>(resolve => {
        resolveDownload = resolve
      }),
    )

    renderComponent()
    const importButton = screen.getAllByText('匯入')[0]!
    fireEvent.click(importButton)

    const confirmButton = screen.getByText('確認')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText('匯入雲端資料庫中')).toBeTruthy()
    })

    // Let the download finish
    resolveDownload(new Uint8Array([1, 2, 3]))
  })

  // ── Error handling ─────────────────────────────────────────────────────────

  it('hides overlay and shows error toast when download fails', async () => {
    mockDownload.mockRejectedValueOnce(new Error('Network error'))

    renderComponent()
    const importButton = screen.getAllByText('匯入')[0]!
    fireEvent.click(importButton)

    const confirmButton = screen.getByText('確認')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalled()
    })

    // Overlay should be gone
    expect(screen.queryByText('匯入雲端資料庫中')).toBeNull()
  })

  it('hides overlay and shows error toast when importDatabase fails', async () => {
    mockImportDatabase.mockRejectedValueOnce(
      new Error('Integrity check failed'),
    )

    renderComponent()
    const importButton = screen.getAllByText('匯入')[0]!
    fireEvent.click(importButton)

    const confirmButton = screen.getByText('確認')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalled()
    })

    expect(screen.queryByText('匯入雲端資料庫中')).toBeNull()
  })

  it('does not reload when import fails', async () => {
    mockImportDatabase.mockRejectedValueOnce(new Error('Failed'))

    renderComponent()
    const importButton = screen.getAllByText('匯入')[0]!
    fireEvent.click(importButton)

    const confirmButton = screen.getByText('確認')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalled()
    })

    expect(mockReload).not.toHaveBeenCalled()
  })
})
