import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeleteOrderModal } from './delete-order-modal'

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (key === 'orders.confirmDeleteTitle')
        return `確認刪除訂單 #${opts?.number}`
      if (key === 'orders.confirmDeleteBtn') return '確認刪除'
      return key
    },
  }),
}))

// Mock ConfirmModal to avoid Radix Portal issues in tests
vi.mock('@/components/modal', () => ({
  ConfirmModal: ({
    open,
    title,
    children,
    confirmText,
    loading,
    onConfirm,
    onCancel,
  }: {
    open: boolean
    title: string
    children?: React.ReactNode
    confirmText?: string
    loading?: boolean
    onConfirm: () => void
    onCancel: () => void
  }) =>
    open ? (
      <div data-testid="confirm-modal" role="dialog" aria-label={title}>
        <h2>{title}</h2>
        {children}
        <button onClick={onConfirm}>{confirmText ?? 'confirm'}</button>
        <button onClick={onCancel}>cancel</button>
        {loading && <div data-testid="modal-loading-overlay" />}
      </div>
    ) : null,
}))

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('DeleteOrderModal', () => {
  const defaultProps = {
    open: true,
    orderNumber: 5,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  }

  it('should render with correct title containing order number', () => {
    render(<DeleteOrderModal {...defaultProps} />)
    expect(screen.getByText('確認刪除訂單 #5')).toBeTruthy()
  })

  it('should call onConfirm when confirm button is clicked', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup()
    render(<DeleteOrderModal {...defaultProps} onConfirm={onConfirm} />)
    await user.click(screen.getByText('確認刪除'))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('should call onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(<DeleteOrderModal {...defaultProps} onCancel={onCancel} />)
    await user.click(screen.getByText('cancel'))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('should show loading state when loading is true', () => {
    render(<DeleteOrderModal {...defaultProps} loading={true} />)
    expect(screen.getByTestId('modal-loading-overlay')).toBeTruthy()
  })

  it('should not render when open is false', () => {
    render(<DeleteOrderModal {...defaultProps} open={false} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('should display different order numbers correctly', () => {
    render(<DeleteOrderModal {...defaultProps} orderNumber={42} />)
    expect(screen.getByText('確認刪除訂單 #42')).toBeTruthy()
  })
})
