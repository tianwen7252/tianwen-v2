import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import dayjs from 'dayjs'
import type { Order } from '@/lib/schemas'

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('./order-history-card', () => ({
  OrderHistoryCard: ({ order }: { order: Order }) => (
    <div data-testid="order-history-card" data-order-id={order.id}>
      #{order.number}
    </div>
  ),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (key === 'orders.searchResultsCount') return `共 ${opts?.count} 筆結果`
      if (key === 'orders.searchNoResults') return '無符合的訂單'
      if (key === 'orders.loading') return '載入訂單中...'
      if (key === 'orders.searchPlaceholder') return '搜尋品項名稱、金額...'
      if (key === 'orders.searchClose') return '關閉搜尋'
      if (key === 'orders.prevPage') return '上一頁'
      if (key === 'orders.nextPage') return '下一頁'
      return key
    },
  }),
}))

vi.mock('lucide-react', () => ({
  X: (props: Record<string, unknown>) => (
    <span data-testid="x-icon" {...props} />
  ),
  ChevronLeft: (props: Record<string, unknown>) => (
    <span data-testid="chevron-left-icon" {...props} />
  ),
  ChevronRight: (props: Record<string, unknown>) => (
    <span data-testid="chevron-right-icon" {...props} />
  ),
}))

// Import after mocks (vitest hoists vi.mock automatically)
import { OrdersSearch } from './orders-search'

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

describe('OrdersSearch', () => {
  const onClose = vi.fn()
  const onDelete = vi.fn()

  const defaultProps = {
    orders: [] as readonly Order[],
    isLoading: false,
    onClose,
    onDelete,
    typeIdMap: new Map<string, string>(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render search input', () => {
    render(<OrdersSearch {...defaultProps} />)
    expect(screen.getByTestId('orders-search-input')).toBeTruthy()
  })

  it('should render close button', () => {
    render(<OrdersSearch {...defaultProps} />)
    const closeBtn = screen.getByRole('button', { name: /關閉搜尋/i })
    expect(closeBtn).toBeTruthy()
  })

  it('should call onClose when close button is clicked', async () => {
    const handleClose = vi.fn()
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    render(<OrdersSearch {...defaultProps} onClose={handleClose} />)
    await user.click(screen.getByRole('button', { name: /關閉搜尋/i }))
    expect(handleClose).toHaveBeenCalledOnce()
  })

  it('should show nothing when query is empty', () => {
    const orders = [makeOrder({ id: 'o1', number: 1 })]
    render(<OrdersSearch {...defaultProps} orders={orders} />)
    // No result groups rendered when query is empty
    expect(screen.queryByTestId('search-result-group')).toBeNull()
    expect(screen.queryByTestId('orders-search-empty')).toBeNull()
  })

  it('should show no results message when query has no match', async () => {
    const orders = [makeOrder({ id: 'o1', number: 1, total: 100 })]
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    render(<OrdersSearch {...defaultProps} orders={orders} />)
    const input = screen.getByTestId('orders-search-input')
    await user.type(input, 'xyznotmatch')
    expect(screen.getByTestId('orders-search-empty')).toBeTruthy()
    expect(screen.getByText('無符合的訂單')).toBeTruthy()
  })

  it('should filter orders by item name (case insensitive)', async () => {
    const orders = [
      makeOrder({
        id: 'o1',
        number: 1,
        items: [
          {
            id: 'i1',
            orderId: 'o1',
            commodityId: 'c1',
            name: 'Chicken Bento',
            price: 200,
            quantity: 1,
            includesSoup: false,
            createdAt: 1700000000000,
          },
        ],
      }),
      makeOrder({
        id: 'o2',
        number: 2,
        items: [
          {
            id: 'i2',
            orderId: 'o2',
            commodityId: 'c2',
            name: 'Fish Soup',
            price: 100,
            quantity: 1,
            includesSoup: false,
            createdAt: 1700000000000,
          },
        ],
      }),
    ]
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    render(<OrdersSearch {...defaultProps} orders={orders} />)
    const input = screen.getByTestId('orders-search-input')
    await user.type(input, 'chicken')

    const cards = screen.getAllByTestId('order-history-card')
    expect(cards).toHaveLength(1)
    expect(cards[0]!.getAttribute('data-order-id')).toBe('o1')
  })

  it('should filter orders by total amount', async () => {
    const orders = [
      makeOrder({ id: 'o1', number: 1, total: 250 }),
      makeOrder({ id: 'o2', number: 2, total: 999 }),
    ]
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    render(<OrdersSearch {...defaultProps} orders={orders} />)
    const input = screen.getByTestId('orders-search-input')
    await user.type(input, '250')

    const cards = screen.getAllByTestId('order-history-card')
    expect(cards).toHaveLength(1)
    expect(cards[0]!.getAttribute('data-order-id')).toBe('o1')
  })

  it('should filter orders by order number', async () => {
    const orders = [
      makeOrder({ id: 'o1', number: 42, total: 100 }),
      makeOrder({ id: 'o2', number: 99, total: 200 }),
    ]
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    render(<OrdersSearch {...defaultProps} orders={orders} />)
    const input = screen.getByTestId('orders-search-input')
    await user.type(input, '42')

    const cards = screen.getAllByTestId('order-history-card')
    expect(cards).toHaveLength(1)
    expect(cards[0]!.getAttribute('data-order-id')).toBe('o1')
  })

  it('should filter orders by memo tag', async () => {
    const orders = [
      makeOrder({ id: 'o1', number: 1, memo: ['外帶'] }),
      makeOrder({ id: 'o2', number: 2, memo: ['內用'] }),
    ]
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    render(<OrdersSearch {...defaultProps} orders={orders} />)
    const input = screen.getByTestId('orders-search-input')
    await user.type(input, '外帶')

    const cards = screen.getAllByTestId('order-history-card')
    expect(cards).toHaveLength(1)
    expect(cards[0]!.getAttribute('data-order-id')).toBe('o1')
  })

  it('should group results by date with date headers', async () => {
    const orders = [
      makeOrder({
        id: 'o1',
        number: 1,
        total: 100,
        createdAt: dayjs('2026-03-24T10:00:00').valueOf(),
      }),
      makeOrder({
        id: 'o2',
        number: 2,
        total: 100,
        createdAt: dayjs('2026-03-23T10:00:00').valueOf(),
      }),
    ]
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    render(<OrdersSearch {...defaultProps} orders={orders} />)
    const input = screen.getByTestId('orders-search-input')
    await user.type(input, '100')

    const groups = screen.getAllByTestId('search-result-group')
    expect(groups).toHaveLength(2)
    const dateLabels = screen.getAllByTestId('search-date-label')
    expect(dateLabels).toHaveLength(2)
  })

  it('should show result count', async () => {
    const orders = [
      makeOrder({ id: 'o1', number: 1, total: 100 }),
      makeOrder({ id: 'o2', number: 2, total: 100 }),
    ]
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    render(<OrdersSearch {...defaultProps} orders={orders} />)
    const input = screen.getByTestId('orders-search-input')
    await user.type(input, '100')

    expect(screen.getByText('共 2 筆結果')).toBeTruthy()
  })

  it('should render order cards for matching orders', async () => {
    const orders = [
      makeOrder({ id: 'o1', number: 1, total: 500 }),
      makeOrder({ id: 'o2', number: 2, total: 500 }),
    ]
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    render(<OrdersSearch {...defaultProps} orders={orders} />)
    const input = screen.getByTestId('orders-search-input')
    await user.type(input, '500')

    const cards = screen.getAllByTestId('order-history-card')
    expect(cards).toHaveLength(2)
  })

  it('should show pagination when results exceed 100', async () => {
    // Create 101 orders each on a different date so they form 101 date groups
    const orders = Array.from({ length: 101 }, (_, i) =>
      makeOrder({
        id: `o${i}`,
        number: i + 1,
        total: 100,
        createdAt: dayjs('2026-03-24').subtract(i, 'day').valueOf(),
      }),
    )
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    render(<OrdersSearch {...defaultProps} orders={orders} />)
    const input = screen.getByTestId('orders-search-input')
    await user.type(input, '100')

    expect(screen.getByTestId('orders-search-pagination')).toBeTruthy()
  })

  it('should not show pagination when 100 or fewer results', async () => {
    const orders = Array.from({ length: 10 }, (_, i) =>
      makeOrder({ id: `o${i}`, number: i + 1, total: 100 }),
    )
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    render(<OrdersSearch {...defaultProps} orders={orders} />)
    const input = screen.getByTestId('orders-search-input')
    await user.type(input, '100')

    expect(screen.queryByTestId('orders-search-pagination')).toBeNull()
  })

  it('should reset to page 1 when query changes', async () => {
    // Create 101 orders each on a different date so pagination triggers
    const orders = Array.from({ length: 101 }, (_, i) =>
      makeOrder({
        id: `o${i}`,
        number: i + 1,
        total: 100,
        createdAt: dayjs('2026-03-24').subtract(i, 'day').valueOf(),
      }),
    )
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    render(<OrdersSearch {...defaultProps} orders={orders} />)
    const input = screen.getByTestId('orders-search-input')

    // Type to get results and pagination
    await user.type(input, '100')
    expect(screen.getByTestId('orders-search-pagination')).toBeTruthy()

    // Change query — page should reset (pagination only shown if >100 still match)
    await user.clear(input)
    await user.type(input, '999')
    // '999' does not match any of the 100-total orders → no pagination
    expect(screen.queryByTestId('orders-search-pagination')).toBeNull()
  })

  it('should show loading state when isLoading is true and query is empty', () => {
    render(<OrdersSearch {...defaultProps} isLoading={true} />)
    // When loading and no query, should not show results
    expect(screen.queryByTestId('search-result-group')).toBeNull()
  })

  it('should filter by item name in order.items', async () => {
    const orders = [
      makeOrder({
        id: 'o1',
        number: 1,
        items: [
          {
            id: 'i1',
            orderId: 'o1',
            commodityId: 'c1',
            name: 'Dragon Roll',
            price: 200,
            quantity: 1,
            includesSoup: false,
            createdAt: 1700000000000,
          },
        ],
      }),
      makeOrder({ id: 'o2', number: 2, items: [] }),
    ]
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    render(<OrdersSearch {...defaultProps} orders={orders} />)
    const input = screen.getByTestId('orders-search-input')
    await user.type(input, 'dragon')

    const cards = screen.getAllByTestId('order-history-card')
    expect(cards).toHaveLength(1)
    expect(cards[0]!.getAttribute('data-order-id')).toBe('o1')
  })
})
