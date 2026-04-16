import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HeaderCheckout } from './header-checkout'

vi.mock('@/components/shift-checkout/shift-checkout-modal', () => ({
  ShiftCheckoutModal: ({
    open,
    onClose,
  }: {
    open: boolean
    onClose: () => void
  }) =>
    open ? (
      <div data-testid="shift-checkout-modal">
        <button type="button" onClick={onClose}>
          close
        </button>
      </div>
    ) : null,
}))

const mockNotifyError = vi.fn()
vi.mock('@/components/ui/sonner', () => ({
  notify: { error: (...args: unknown[]) => mockNotifyError(...args) },
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'zh-TW' },
  }),
}))

// Default: outside checkout window
vi.mock('@/lib/shift-checkout', () => ({
  isInCheckoutWindow: vi.fn().mockReturnValue(false),
}))

describe('HeaderCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Receipt icon button', () => {
    render(<HeaderCheckout />)
    expect(screen.getByTestId('header-checkout-btn')).toBeTruthy()
  })

  it('shows error toast when clicked outside checkout window', () => {
    render(<HeaderCheckout />)
    fireEvent.click(screen.getByTestId('header-checkout-btn'))
    expect(mockNotifyError).toHaveBeenCalledOnce()
    expect(screen.queryByTestId('shift-checkout-modal')).toBeNull()
  })

  it('opens modal when clicked during checkout window', async () => {
    const { isInCheckoutWindow } = await import('@/lib/shift-checkout')
    vi.mocked(isInCheckoutWindow).mockReturnValue(true)

    render(<HeaderCheckout />)
    fireEvent.click(screen.getByTestId('header-checkout-btn'))
    expect(screen.getByTestId('shift-checkout-modal')).toBeTruthy()
  })
})
