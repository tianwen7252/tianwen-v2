import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OrderStaffModal } from './order-staff-modal'
import { useOrderStaffStore } from '@/stores/order-staff-store'
import type { Employee } from '@/lib/schemas'

const mockEmployees: Employee[] = [
  {
    id: 'emp-001',
    name: 'Eric',
    avatar: 'doberman.png',
    status: 'active',
    shiftType: 'regular',
    isAdmin: true,
    isDefaultOrderStaff: false,
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'emp-002',
    name: '妞妞',
    avatar: 'fish.png',
    status: 'active',
    shiftType: 'regular',
    isAdmin: false,
    isDefaultOrderStaff: true,
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'emp-003',
    name: '阿吉',
    avatar: 'terrier.png',
    status: 'active',
    shiftType: 'regular',
    isAdmin: false,
    isDefaultOrderStaff: false,
    createdAt: 0,
    updatedAt: 0,
  },
]

vi.mock('@/lib/repositories/provider', () => ({
  getEmployeeRepo: () => ({
    findByStatus: vi.fn().mockResolvedValue(mockEmployees),
  }),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'orderStaff.selectTitle': '選擇點餐人員',
      }
      return translations[key] ?? key
    },
    i18n: { language: 'zh-TW' },
  }),
}))

describe('OrderStaffModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useOrderStaffStore.setState({
      orderStaffId: null,
      orderStaffName: null,
      orderStaffAvatar: undefined,
    })
  })

  it('renders all active employees', async () => {
    render(<OrderStaffModal open onClose={mockOnClose} />)

    expect(await screen.findByTestId('order-staff-emp-001')).toBeTruthy()
    expect(screen.getByTestId('order-staff-emp-002')).toBeTruthy()
    expect(screen.getByTestId('order-staff-emp-003')).toBeTruthy()
  })

  it('displays employee names', async () => {
    render(<OrderStaffModal open onClose={mockOnClose} />)

    expect(await screen.findByText('Eric')).toBeTruthy()
    expect(screen.getByText('妞妞')).toBeTruthy()
    expect(screen.getByText('阿吉')).toBeTruthy()
  })

  it('selects employee and closes modal on click', async () => {
    render(<OrderStaffModal open onClose={mockOnClose} />)

    const btn = await screen.findByTestId('order-staff-emp-002')
    fireEvent.click(btn)

    const state = useOrderStaffStore.getState()
    expect(state.orderStaffId).toBe('emp-002')
    expect(state.orderStaffName).toBe('妞妞')
    expect(mockOnClose).toHaveBeenCalledOnce()
  })

  it('does not render when closed', () => {
    render(<OrderStaffModal open={false} onClose={mockOnClose} />)

    expect(screen.queryByText('選擇點餐人員')).toBeNull()
  })
})
