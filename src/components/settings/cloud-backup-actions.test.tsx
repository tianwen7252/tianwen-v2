/**
 * Tests for the CloudBackupActions component.
 * Covers backup button states, disabled logic, not-configured message,
 * schedule selector, hour picker, manual backup, and export DB.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockStartBackup = vi.fn()
const mockFinishBackup = vi.fn()
const mockSetLastBackupTime = vi.fn()
const mockSetSchedule = vi.fn()

let mockStoreState = {
  isBackingUp: false,
  backupProgress: 0,
  backupError: null as string | null,
  scheduleType: 'daily' as 'daily' | 'weekly' | 'none',
  scheduleHour: 22,
  startBackup: mockStartBackup,
  updateProgress: vi.fn(),
  finishBackup: mockFinishBackup,
  setSchedule: mockSetSchedule,
  setLastBackupTime: mockSetLastBackupTime,
}

vi.mock('@/stores/backup-store', () => ({
  useBackupStore: Object.assign(
    vi.fn((selector: (state: typeof mockStoreState) => unknown) =>
      selector(mockStoreState),
    ),
    {
      getState: () => mockStoreState,
    },
  ),
}))

const mockNotify = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}))

vi.mock('@/components/ui/sonner', () => ({
  notify: mockNotify,
}))

const mockPerformBackup = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    filename: 'backup-1234.sqlite.gz',
    size: 1024,
    durationMs: 500,
  }),
)

vi.mock('@/lib/perform-backup', () => ({
  performBackup: mockPerformBackup,
}))

const mockDbExport = vi.hoisted(() =>
  vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
)

vi.mock('@/lib/repositories/provider', () => ({
  getDatabase: () => ({
    exportDatabase: mockDbExport,
  }),
}))

import { CloudBackupActions } from './cloud-backup-actions'

// ── Tests ───────────────────────────────────────────────────────────────────

describe('CloudBackupActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStoreState = {
      isBackingUp: false,
      backupProgress: 0,
      backupError: null,
      scheduleType: 'daily',
      scheduleHour: 22,
      startBackup: mockStartBackup,
      updateProgress: vi.fn(),
      finishBackup: mockFinishBackup,
      setSchedule: mockSetSchedule,
      setLastBackupTime: mockSetLastBackupTime,
    }
    mockPerformBackup.mockResolvedValue({
      filename: 'backup-1234.sqlite.gz',
      size: 1024,
      durationMs: 500,
    })
    mockDbExport.mockResolvedValue(new Uint8Array([1, 2, 3]))
  })

  // ── Existing backup button tests ─────────────────────────────────────────

  it('renders the card title', () => {
    render(<CloudBackupActions />)
    expect(screen.getByText('備份操作')).toBeTruthy()
  })

  it('renders the backup now button', () => {
    render(<CloudBackupActions />)
    expect(screen.getByText('立即備份')).toBeTruthy()
  })

  it('enables button when not backing up', () => {
    render(<CloudBackupActions />)
    const button = screen.getByText('立即備份').closest('button')
    expect(button?.disabled).toBe(false)
  })

  it('disables button when backup is in progress', () => {
    mockStoreState = { ...mockStoreState, isBackingUp: true }
    render(<CloudBackupActions />)
    const button = screen.getByText('備份中...').closest('button')
    expect(button?.disabled).toBe(true)
  })

  it('shows backing up text when isBackingUp is true', () => {
    mockStoreState = { ...mockStoreState, isBackingUp: true }
    render(<CloudBackupActions />)
    expect(screen.getByText('備份中...')).toBeTruthy()
    expect(screen.queryByText('立即備份')).toBeNull()
  })

  it('renders export db button', () => {
    render(<CloudBackupActions />)
    expect(screen.getByText('匯出資料庫')).toBeTruthy()
  })

  // ── Manual backup tests ─────────────────────────────────────────────────

  describe('Manual Backup', () => {
    it('calls startBackup and performBackup("manual") when clicked', async () => {
      render(<CloudBackupActions />)

      const button = screen.getByText('立即備份').closest('button')!
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockStartBackup).toHaveBeenCalledOnce()
        expect(mockPerformBackup).toHaveBeenCalledWith('manual')
      })
    })

    it('calls finishBackup and setLastBackupTime on success', async () => {
      render(<CloudBackupActions />)

      const button = screen.getByText('立即備份').closest('button')!
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockFinishBackup).toHaveBeenCalledWith()
        expect(mockSetLastBackupTime).toHaveBeenCalledWith(expect.any(String))
      })
    })

    it('shows success toast after backup completes', async () => {
      render(<CloudBackupActions />)

      const button = screen.getByText('立即備份').closest('button')!
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockNotify.success).toHaveBeenCalled()
      })
    })

    it('calls finishBackup with error on performBackup failure', async () => {
      mockPerformBackup.mockRejectedValueOnce(new Error('Upload failed'))

      render(<CloudBackupActions />)

      const button = screen.getByText('立即備份').closest('button')!
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockFinishBackup).toHaveBeenCalledWith('Upload failed')
      })
    })

    it('shows error toast on backup failure', async () => {
      mockPerformBackup.mockRejectedValueOnce(new Error('Upload failed'))

      render(<CloudBackupActions />)

      const button = screen.getByText('立即備份').closest('button')!
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockNotify.error).toHaveBeenCalled()
      })
    })
  })

  // ── Export DB tests ─────────────────────────────────────────────────────

  describe('Export DB', () => {
    it('calls exportDatabase when export button clicked', async () => {
      render(<CloudBackupActions />)

      const button = screen.getByText('匯出資料庫').closest('button')!
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockDbExport).toHaveBeenCalledOnce()
      })
    })

    it('shows error toast when export fails', async () => {
      mockDbExport.mockRejectedValueOnce(new Error('Export error'))

      render(<CloudBackupActions />)

      const button = screen.getByText('匯出資料庫').closest('button')!
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockNotify.error).toHaveBeenCalled()
      })
    })
  })

  // ── Schedule selector tests ──────────────────────────────────────────────

  describe('Schedule Selector', () => {
    it('renders the schedule label', () => {
      render(<CloudBackupActions />)
      expect(screen.getByText('自動備份排程')).toBeTruthy()
    })

    it('renders three schedule options', () => {
      render(<CloudBackupActions />)
      expect(screen.getByText('每日')).toBeTruthy()
      expect(screen.getByText('每週')).toBeTruthy()
      expect(screen.getByText('關閉')).toBeTruthy()
    })

    it('highlights the active schedule type', () => {
      mockStoreState = { ...mockStoreState, scheduleType: 'daily' }
      render(<CloudBackupActions />)

      const dailyButton = screen.getByText('每日').closest('button')
      expect(dailyButton?.getAttribute('data-active')).toBe('true')

      const weeklyButton = screen.getByText('每週').closest('button')
      expect(weeklyButton?.getAttribute('data-active')).not.toBe('true')
    })

    it('calls setSchedule with daily when clicking daily button', () => {
      mockStoreState = { ...mockStoreState, scheduleType: 'none' }
      render(<CloudBackupActions />)

      const dailyButton = screen.getByText('每日').closest('button')!
      fireEvent.click(dailyButton)

      expect(mockSetSchedule).toHaveBeenCalledWith('daily')
    })

    it('calls setSchedule with weekly when clicking weekly button', () => {
      mockStoreState = { ...mockStoreState, scheduleType: 'none' }
      render(<CloudBackupActions />)

      const weeklyButton = screen.getByText('每週').closest('button')!
      fireEvent.click(weeklyButton)

      expect(mockSetSchedule).toHaveBeenCalledWith('weekly')
    })

    it('calls setSchedule with none when clicking off button', () => {
      mockStoreState = { ...mockStoreState, scheduleType: 'daily' }
      render(<CloudBackupActions />)

      const noneButton = screen.getByText('關閉').closest('button')!
      fireEvent.click(noneButton)

      expect(mockSetSchedule).toHaveBeenCalledWith('none')
    })
  })

  // ── Hour picker tests ────────────────────────────────────────────────────

  describe('Hour Picker', () => {
    it('renders the hour picker label when schedule is not none', () => {
      mockStoreState = { ...mockStoreState, scheduleType: 'daily' }
      render(<CloudBackupActions />)
      expect(screen.getByText('排程時間')).toBeTruthy()
    })

    it('does not render the hour picker when schedule is none', () => {
      mockStoreState = { ...mockStoreState, scheduleType: 'none' }
      render(<CloudBackupActions />)
      expect(screen.queryByText('排程時間')).toBeNull()
    })

    it('displays the current schedule hour', () => {
      mockStoreState = {
        ...mockStoreState,
        scheduleType: 'daily',
        scheduleHour: 14,
      }
      render(<CloudBackupActions />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('14')
    })

    it('calls setSchedule with new hour when changed', () => {
      mockStoreState = {
        ...mockStoreState,
        scheduleType: 'daily',
        scheduleHour: 22,
      }
      render(<CloudBackupActions />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      fireEvent.change(select, { target: { value: '8' } })

      expect(mockSetSchedule).toHaveBeenCalledWith('daily', 8)
    })

    it('renders all 24 hour options (0-23)', () => {
      mockStoreState = { ...mockStoreState, scheduleType: 'daily' }
      render(<CloudBackupActions />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.options.length).toBe(24)
    })
  })
})
