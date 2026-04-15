import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HeaderOrderStaff } from './header-order-staff'
import { useOrderStaffStore } from '@/stores/order-staff-store'

vi.mock('@/components/order-staff-modal', () => ({
  OrderStaffModal: ({
    open,
    onClose,
  }: {
    open: boolean
    onClose: () => void
  }) =>
    open ? (
      <div data-testid="order-staff-modal">
        <button type="button" onClick={onClose}>
          close
        </button>
      </div>
    ) : null,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) => {
      const translations: Record<string, string> = {
        'orderStaff.currentlyTaking': `${opts?.name ?? ''}正在點餐`,
        'orderStaff.noSelection': '選擇點餐人員',
      }
      return translations[key] ?? key
    },
    i18n: { language: 'zh-TW' },
  }),
}))

describe('HeaderOrderStaff', () => {
  beforeEach(() => {
    useOrderStaffStore.setState({
      orderStaffId: null,
      orderStaffName: null,
      orderStaffAvatar: undefined,
    })
  })

  it('renders ContactRound icon', () => {
    render(<HeaderOrderStaff />)
    expect(screen.getByTestId('header-order-staff-btn')).toBeTruthy()
  })

  it('shows staff name when selected', () => {
    useOrderStaffStore.setState({
      orderStaffId: 'emp-002',
      orderStaffName: '妞妞',
    })

    render(<HeaderOrderStaff />)
    expect(screen.getByText('妞妞正在點餐')).toBeTruthy()
  })

  it('does not show name when no staff selected', () => {
    render(<HeaderOrderStaff />)
    expect(screen.queryByText(/正在點餐/)).toBeNull()
  })

  it('opens modal on click', () => {
    render(<HeaderOrderStaff />)

    expect(screen.queryByTestId('order-staff-modal')).toBeNull()

    fireEvent.click(screen.getByTestId('header-order-staff-btn'))

    expect(screen.getByTestId('order-staff-modal')).toBeTruthy()
  })
})
