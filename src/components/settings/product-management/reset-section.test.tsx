/**
 * Tests for ResetSection component.
 * Verifies render, confirm flow, cancel flow, error handling, and loading state.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResetSection } from './reset-section'

// Mock the resetCommodityDataAsync function
const mockResetCommodityDataAsync = vi.fn()
vi.mock('@/lib/default-data', () => ({
  resetCommodityDataAsync: (...args: unknown[]) =>
    mockResetCommodityDataAsync(...args),
}))

// Mock sonner notify
const mockNotifySuccess = vi.fn()
const mockNotifyError = vi.fn()
vi.mock('@/components/ui/sonner', () => ({
  notify: {
    success: (...args: unknown[]) => mockNotifySuccess(...args),
    error: (...args: unknown[]) => mockNotifyError(...args),
  },
}))

// Mock the modal component to avoid Radix Portal issues in tests
vi.mock('@/components/modal', () => ({
  ConfirmModal: ({
    open,
    title,
    children,
    loading,
    onConfirm,
    onCancel,
  }: {
    open: boolean
    title: string
    children?: React.ReactNode
    loading?: boolean
    onConfirm: () => void
    onCancel: () => void
  }) =>
    open ? (
      <div data-testid="confirm-modal" role="dialog" aria-label={title}>
        <h2>{title}</h2>
        {children}
        {loading && <span data-testid="modal-loading">loading</span>}
        <button onClick={onConfirm}>確認</button>
        <button onClick={onCancel}>取消</button>
      </div>
    ) : null,
}))

// Mock window.location.reload
const mockReload = vi.fn()
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true,
})

describe('ResetSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockResetCommodityDataAsync.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('rendering', () => {
    it('should render the reset button', () => {
      render(<ResetSection onReset={vi.fn()} />)
      expect(screen.getByText('還原預設')).toBeTruthy()
    })

    it('should not show confirm modal initially', () => {
      render(<ResetSection onReset={vi.fn()} />)
      expect(screen.queryByTestId('confirm-modal')).toBeNull()
    })
  })

  describe('confirm flow', () => {
    it('should open confirm modal when reset button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<ResetSection onReset={vi.fn()} />)

      await user.click(screen.getByText('還原預設'))

      expect(screen.getByTestId('confirm-modal')).toBeTruthy()
      expect(screen.getByText('確認還原預設')).toBeTruthy()
    })

    it('should display warning message in confirm modal', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<ResetSection onReset={vi.fn()} />)

      await user.click(screen.getByText('還原預設'))

      expect(
        screen.getByText(
          '確定要將所有商品種類、商品和訂單分類還原為預設值嗎？此操作無法復原。員工和打卡資料不受影響。',
        ),
      ).toBeTruthy()
    })

    it('should call resetCommodityDataAsync and show success toast on confirm', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<ResetSection onReset={vi.fn()} />)

      // Open modal
      await user.click(screen.getByText('還原預設'))
      // Confirm
      await user.click(screen.getByText('確認'))

      await waitFor(() => {
        expect(mockResetCommodityDataAsync).toHaveBeenCalledOnce()
      })
      expect(mockNotifySuccess).toHaveBeenCalledWith('資料已還原成功')
    })

    it('should call onReset callback after successful reset', async () => {
      const onReset = vi.fn()
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<ResetSection onReset={onReset} />)

      await user.click(screen.getByText('還原預設'))
      await user.click(screen.getByText('確認'))

      await waitFor(() => {
        expect(mockNotifySuccess).toHaveBeenCalled()
      })

      expect(onReset).toHaveBeenCalledOnce()
    })
  })

  describe('cancel flow', () => {
    it('should close confirm modal when cancel is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<ResetSection onReset={vi.fn()} />)

      // Open modal
      await user.click(screen.getByText('還原預設'))
      expect(screen.getByTestId('confirm-modal')).toBeTruthy()

      // Cancel
      await user.click(screen.getByText('取消'))
      expect(screen.queryByTestId('confirm-modal')).toBeNull()
    })

    it('should not call resetCommodityDataAsync when cancelled', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<ResetSection onReset={vi.fn()} />)

      await user.click(screen.getByText('還原預設'))
      await user.click(screen.getByText('取消'))

      expect(mockResetCommodityDataAsync).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should show error toast when reset fails', async () => {
      mockResetCommodityDataAsync.mockRejectedValue(new Error('DB error'))
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<ResetSection onReset={vi.fn()} />)

      await user.click(screen.getByText('還原預設'))
      await user.click(screen.getByText('確認'))

      await waitFor(() => {
        expect(mockNotifyError).toHaveBeenCalledWith('還原失敗')
      })
    })

    it('should not call onReset when reset fails', async () => {
      mockResetCommodityDataAsync.mockRejectedValue(new Error('DB error'))
      const onReset = vi.fn()
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<ResetSection onReset={onReset} />)

      await user.click(screen.getByText('還原預設'))
      await user.click(screen.getByText('確認'))

      await waitFor(() => {
        expect(mockNotifyError).toHaveBeenCalled()
      })

      expect(onReset).not.toHaveBeenCalled()
    })

    it('should close modal and reset loading state after error', async () => {
      mockResetCommodityDataAsync.mockRejectedValue(new Error('DB error'))
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<ResetSection onReset={vi.fn()} />)

      await user.click(screen.getByText('還原預設'))
      await user.click(screen.getByText('確認'))

      await waitFor(() => {
        expect(mockNotifyError).toHaveBeenCalled()
      })

      // Modal should be closed after error
      expect(screen.queryByTestId('confirm-modal')).toBeNull()
    })
  })
})
