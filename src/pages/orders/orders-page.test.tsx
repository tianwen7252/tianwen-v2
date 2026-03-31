import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Order } from '@/lib/schemas'
import dayjs from 'dayjs'

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Mock useQuery / useMutation / useQueryClient before importing OrdersPage
const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()
const mockInvalidateQueries = vi.fn()

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}))

vi.mock('@/lib/repositories/provider', () => ({
  getOrderRepo: vi.fn(() => ({
    findByDateRange: vi.fn(),
    findAll: vi.fn(),
    remove: vi.fn(),
  })),
  getCommodityRepo: vi.fn(() => ({
    findAll: vi.fn().mockResolvedValue([]),
  })),
}))

// Mock child components to isolate page testing
vi.mock('@/components/orders', () => ({
  OrdersDateHeader: ({
    selectedDate,
    onSearchOpen,
  }: {
    selectedDate: import('dayjs').Dayjs
    onSearchOpen: () => void
  }) => (
    <div data-testid="orders-date-header">
      {selectedDate.format('YYYY-MM-DD')}
      <button data-testid="open-search-btn" onClick={onSearchOpen}>
        Search
      </button>
    </div>
  ),
  OrdersShiftSummary: ({ orders }: { orders: readonly Order[] }) => (
    <div data-testid="shift-summary">{orders.length} orders</div>
  ),
  OrderHistoryCard: ({
    order,
    onDelete,
  }: {
    order: Order
    onDelete: () => void
  }) => (
    <div data-testid="order-history-card" data-order-id={order.id}>
      #{order.number}
      <button data-testid={`delete-btn-${order.id}`} onClick={onDelete}>
        Delete
      </button>
    </div>
  ),
  DeleteOrderModal: ({
    open,
    orderNumber,
  }: {
    open: boolean
    orderNumber: number
  }) =>
    open ? (
      <div data-testid="delete-order-modal">Delete #{orderNumber}</div>
    ) : null,
  OrdersSearch: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="orders-search">
      <button data-testid="search-close-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
  EditOrderModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="edit-order-modal">Edit Order</div> : null,
}))

// Mock sonner toast
vi.mock('@/components/ui/sonner', () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'orders.loading': '載入訂單中...',
        'orders.loadError': '載入失敗，請重試',
        'orders.noOrders': '本日無訂單',
        'orders.toastDeleted': '訂單已刪除',
        'orders.toastDeleteError': '刪除失敗，請重試',
      }
      return map[key] ?? key
    },
  }),
}))

// Import after all vi.mock calls (vitest hoists vi.mock automatically)
import { OrdersPage } from './orders-page'

// ─── Factories ───────────────────────────────────────────────────────────────

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'test-1',
    number: 1,
    memo: [],
    soups: 0,
    total: 100,
    editor: '',
    items: [],
    discounts: [],
    createdAt: dayjs('2026-03-24T10:00:00').valueOf(),
    updatedAt: dayjs('2026-03-24T10:00:00').valueOf(),
    ...overrides,
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('OrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: return a mutation stub
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    })
    // Default useQuery returns empty data for both queries
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    })
  })

  it('should show loading state initially', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })

    render(<OrdersPage />)
    expect(screen.getByText('載入訂單中...')).toBeTruthy()
  })

  it('should render date header', () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    })

    render(<OrdersPage />)
    expect(screen.getByTestId('orders-date-header')).toBeTruthy()
  })

  it('should render orders when data is loaded', () => {
    const orders = [
      makeOrder({ id: 'o1', number: 1 }),
      makeOrder({ id: 'o2', number: 2 }),
    ]
    mockUseQuery.mockReturnValue({
      data: orders,
      isLoading: false,
      isError: false,
    })

    render(<OrdersPage />)
    const cards = screen.getAllByTestId('order-history-card')
    expect(cards).toHaveLength(2)
  })

  it('should show empty state when no orders', () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    })

    render(<OrdersPage />)
    expect(screen.getByText('本日無訂單')).toBeTruthy()
  })

  it('should render shift summary when orders exist', () => {
    mockUseQuery.mockReturnValue({
      data: [makeOrder()],
      isLoading: false,
      isError: false,
    })

    render(<OrdersPage />)
    expect(screen.getByTestId('shift-summary')).toBeTruthy()
  })

  it('should show error state with retry message', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network error'),
    })

    render(<OrdersPage />)
    expect(screen.getByText(/載入失敗/)).toBeTruthy()
  })

  it('should have full viewport height minus header', () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    })

    const { container } = render(<OrdersPage />)
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.classList.contains('min-h-[calc(100vh-57px)]')).toBe(true)
  })

  it('should not show OrdersSearch initially', () => {
    render(<OrdersPage />)
    expect(screen.queryByTestId('orders-search')).toBeNull()
  })

  it('should show OrdersSearch when search is opened', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    render(<OrdersPage />)
    await user.click(screen.getByTestId('open-search-btn'))
    expect(screen.getByTestId('orders-search')).toBeTruthy()
  })

  it('should hide date header content when search is open', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    render(<OrdersPage />)
    // Date header is visible initially
    expect(screen.getByTestId('orders-date-header')).toBeTruthy()

    // Open search
    await user.click(screen.getByTestId('open-search-btn'))

    // Date header should no longer be visible (OrdersSearch replaced it)
    expect(screen.queryByTestId('orders-date-header')).toBeNull()
    expect(screen.getByTestId('orders-search')).toBeTruthy()
  })

  it('should close OrdersSearch when close is called', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    render(<OrdersPage />)

    // Open search
    await user.click(screen.getByTestId('open-search-btn'))
    expect(screen.getByTestId('orders-search')).toBeTruthy()

    // Close search
    await user.click(screen.getByTestId('search-close-btn'))
    expect(screen.queryByTestId('orders-search')).toBeNull()
    expect(screen.getByTestId('orders-date-header')).toBeTruthy()
  })
})
