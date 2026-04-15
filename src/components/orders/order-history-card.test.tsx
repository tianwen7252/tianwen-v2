import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import dayjs from 'dayjs'
import type { Order } from '@/lib/schemas'
import { OrderHistoryCard } from './order-history-card'

// Mock SwipeActions to render children and expose action buttons directly
vi.mock('@/components/ui/swipe-actions', () => ({
  SwipeActions: ({
    actions,
    children,
  }: {
    actions: readonly {
      key: string
      icon: React.ReactNode
      color: string
      label?: string
      onClick: () => void
    }[]
    children: React.ReactNode
  }) => (
    <div data-testid="swipe-actions">
      {children}
      <div data-testid="swipe-action-buttons">
        {actions.map(action => (
          <button
            key={action.key}
            data-testid={`swipe-action-${action.key}`}
            onClick={action.onClick}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  ),
}))

// Mock lucide-react icons to simple spans
vi.mock('lucide-react', () => ({
  Pencil: (props: Record<string, unknown>) => (
    <span data-testid="pencil-icon" {...props} />
  ),
  Trash2: (props: Record<string, unknown>) => (
    <span data-testid="trash2-icon" {...props} />
  ),
  MoveDown: (props: Record<string, unknown>) => (
    <span data-testid="move-down-icon" {...props} />
  ),
  CircleCheckBig: (props: Record<string, unknown>) => (
    <span data-testid="circle-check-icon" {...props} />
  ),
  ContactRound: (props: Record<string, unknown>) => (
    <span data-testid="contact-round-icon" {...props} />
  ),
}))

// Mock employee repo for order staff name resolution
vi.mock('@/lib/repositories/provider', () => ({
  getEmployeeRepo: () => ({
    findAll: vi.fn().mockResolvedValue([]),
  }),
}))

// Mock i18n — return the key itself, except for known keys
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (key === 'orders.moreItems') return `+${opts?.count} more`
      if (key === 'orders.updatedAt') return 'Updated'
      if (key === 'order.categoryBento') return 'Bento'
      if (key === 'order.categorySingle') return 'A la carte'
      if (key === 'order.categoryDrink') return 'Drinks'
      if (key === 'order.categoryDumpling') return 'Dumplings'
      if (key === 'order.categoryOther') return 'Other'
      if (key === 'order.categoryDiscount') return 'Discounts'
      return key
    },
  }),
}))

// ─── Factories ───────────────────────────────────────────────────────────────

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'test-1',
    number: 3,
    memo: ['Attack on Titan', 'Delivery'],
    soups: 3,
    total: 250,
    originalTotal: 300,
    editor: 'admin',
    items: [
      {
        id: 'i1',
        orderId: 'test-1',
        commodityId: 'c1',
        name: 'Chicken Bento',
        price: 100,
        quantity: 2,
        includesSoup: true,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      },
      {
        id: 'i2',
        orderId: 'test-1',
        commodityId: 'c2',
        name: 'Pork Bento',
        price: 100,
        quantity: 1,
        includesSoup: true,
        createdAt: 1700000000001,
        updatedAt: 1700000000001,
      },
    ],
    discounts: [],
    isServed: false,
    createdAt: new Date('2026-03-24T12:45:00').getTime(),
    updatedAt: new Date('2026-03-24T12:45:00').getTime(),
    ...overrides,
  }
}

/** Default typeIdMap that maps commodity IDs to their category types */
function makeTypeIdMap(
  entries: [string, string][] = [
    ['c1', 'bento'],
    ['c2', 'bento'],
  ],
): ReadonlyMap<string, string> {
  return new Map(entries)
}

// ─── Wrapper ────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('OrderHistoryCard', () => {
  const defaultTypeIdMap = makeTypeIdMap()

  const defaultProps = {
    order: makeOrder(),
    typeIdMap: defaultTypeIdMap,
    onDelete: vi.fn(),
  }

  it('should render order number', () => {
    renderWithProviders(<OrderHistoryCard {...defaultProps} />)
    expect(screen.getByText('#3')).toBeTruthy()
  })

  it('should render formatted time in AM/PM format', () => {
    renderWithProviders(<OrderHistoryCard {...defaultProps} />)
    expect(screen.getByText('12:45 PM')).toBeTruthy()
  })

  it('should render categorized items with category headers', () => {
    renderWithProviders(<OrderHistoryCard {...defaultProps} />)
    const card = screen.getByTestId('order-history-card')
    // Both items are bento with includesSoup=true, so "Bento" header should appear
    expect(card.textContent).toContain('Bento')
    expect(card.textContent).toContain('Chicken Bento')
    expect(card.textContent).toContain('x2')
    expect(card.textContent).toContain('Pork Bento')
    expect(card.textContent).toContain('x1')
  })

  it('should show multiple category groups when items span categories', () => {
    const order = makeOrder({
      items: [
        {
          id: 'i1',
          orderId: 'test-1',
          commodityId: 'c1',
          name: 'Chicken Bento',
          price: 100,
          quantity: 1,
          includesSoup: true,
          createdAt: 1700000000000,
          updatedAt: 1700000000000,
        },
        {
          id: 'i2',
          orderId: 'test-1',
          commodityId: 'c3',
          name: 'Black Tea',
          price: 30,
          quantity: 2,
          includesSoup: false,
          createdAt: 1700000000001,
          updatedAt: 1700000000001,
        },
      ],
    })
    const typeIdMap = makeTypeIdMap([
      ['c1', 'bento'],
      ['c3', 'drink'],
    ])
    renderWithProviders(
      <OrderHistoryCard
        order={order}
        typeIdMap={typeIdMap}
        onDelete={vi.fn()}
      />,
    )
    const card = screen.getByTestId('order-history-card')
    // Should have both Bento and Drinks headers
    expect(card.textContent).toContain('Bento')
    expect(card.textContent).toContain('Drinks')
    expect(card.textContent).toContain('Chicken Bento')
    expect(card.textContent).toContain('Black Tea')
  })

  it('should show "Other" category for unknown commodityId', () => {
    const order = makeOrder({
      items: [
        {
          id: 'i1',
          orderId: 'test-1',
          commodityId: 'unknown',
          name: 'Mystery Item',
          price: 50,
          quantity: 1,
          includesSoup: false,
          createdAt: 1700000000000,
          updatedAt: 1700000000000,
        },
      ],
    })
    const typeIdMap = makeTypeIdMap([])
    renderWithProviders(
      <OrderHistoryCard
        order={order}
        typeIdMap={typeIdMap}
        onDelete={vi.fn()}
      />,
    )
    const card = screen.getByTestId('order-history-card')
    expect(card.textContent).toContain('Other')
    expect(card.textContent).toContain('Mystery Item')
  })

  it('should split bento items by includesSoup into bento and single groups', () => {
    const order = makeOrder({
      items: [
        {
          id: 'i1',
          orderId: 'test-1',
          commodityId: 'c1',
          name: 'Chicken Bento',
          price: 100,
          quantity: 1,
          includesSoup: true,
          createdAt: 1700000000000,
          updatedAt: 1700000000000,
        },
        {
          id: 'i2',
          orderId: 'test-1',
          commodityId: 'c1',
          name: 'Extra Egg',
          price: 15,
          quantity: 1,
          includesSoup: false,
          createdAt: 1700000000001,
          updatedAt: 1700000000001,
        },
      ],
    })
    renderWithProviders(
      <OrderHistoryCard
        order={order}
        typeIdMap={defaultTypeIdMap}
        onDelete={vi.fn()}
      />,
    )
    const card = screen.getByTestId('order-history-card')
    expect(card.textContent).toContain('Bento')
    expect(card.textContent).toContain('A la carte')
    expect(card.textContent).toContain('Chicken Bento')
    expect(card.textContent).toContain('Extra Egg')
  })

  it('should render memo tags as pills', () => {
    renderWithProviders(<OrderHistoryCard {...defaultProps} />)
    expect(screen.getByText('Attack on Titan')).toBeTruthy()
    expect(screen.getByText('Delivery')).toBeTruthy()
  })

  it('should not render memo section when memo is empty', () => {
    const order = makeOrder({ memo: [] })
    renderWithProviders(
      <OrderHistoryCard
        order={order}
        typeIdMap={defaultTypeIdMap}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.queryByTestId('memo-tags')).toBeNull()
  })

  it('should render total amount', () => {
    renderWithProviders(<OrderHistoryCard {...defaultProps} />)
    expect(screen.getByText('$250')).toBeTruthy()
  })

  it('should show original price with strikethrough when discounted', () => {
    renderWithProviders(<OrderHistoryCard {...defaultProps} />)
    const originalPrice = screen.getByText('$300')
    expect(originalPrice).toBeTruthy()
    expect(originalPrice.className).toContain('line-through')
  })

  it('should not show original price when not discounted', () => {
    const order = makeOrder({ originalTotal: undefined })
    renderWithProviders(
      <OrderHistoryCard
        order={order}
        typeIdMap={defaultTypeIdMap}
        onDelete={vi.fn()}
      />,
    )
    const card = screen.getByTestId('order-history-card')
    const lineThroughElements = card.querySelectorAll('.line-through')
    expect(lineThroughElements.length).toBe(0)
  })

  it('should not show original price when originalTotal equals total', () => {
    const order = makeOrder({ originalTotal: 250, total: 250 })
    renderWithProviders(
      <OrderHistoryCard
        order={order}
        typeIdMap={defaultTypeIdMap}
        onDelete={vi.fn()}
      />,
    )
    const card = screen.getByTestId('order-history-card')
    const lineThroughElements = card.querySelectorAll('.line-through')
    expect(lineThroughElements.length).toBe(0)
  })

  it('should show update time when updatedAt differs from createdAt', () => {
    const order = makeOrder({
      createdAt: new Date('2026-03-24T12:45:00').getTime(),
      updatedAt: new Date('2026-03-24T13:30:00').getTime(),
    })
    renderWithProviders(
      <OrderHistoryCard
        order={order}
        typeIdMap={defaultTypeIdMap}
        onDelete={vi.fn()}
      />,
    )
    const card = screen.getByTestId('order-history-card')
    expect(card.textContent).toContain('2026/03/24 13:30:00')
  })

  it('should not show update time when updatedAt equals createdAt', () => {
    renderWithProviders(<OrderHistoryCard {...defaultProps} />)
    const card = screen.getByTestId('order-history-card')
    // The default order has updatedAt === createdAt, so no date string shown
    const defaultTime = dayjs(defaultProps.order.createdAt).format(
      'YYYY/MM/DD HH:mm:ss',
    )
    expect(card.textContent).not.toContain(defaultTime)
  })

  it('should always show both edit and delete swipe actions', () => {
    renderWithProviders(<OrderHistoryCard {...defaultProps} />)
    expect(screen.getByTestId('swipe-action-edit')).toBeTruthy()
    expect(screen.getByTestId('swipe-action-delete')).toBeTruthy()
  })

  it('should call onDelete when delete swipe action is triggered', async () => {
    const onDelete = vi.fn()
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderWithProviders(
      <OrderHistoryCard
        order={makeOrder()}
        typeIdMap={defaultTypeIdMap}
        onDelete={onDelete}
      />,
    )
    await user.click(screen.getByTestId('swipe-action-delete'))
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('should call onEdit when edit swipe action is triggered', async () => {
    const onEdit = vi.fn()
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderWithProviders(
      <OrderHistoryCard
        order={makeOrder()}
        typeIdMap={defaultTypeIdMap}
        onDelete={vi.fn()}
        onEdit={onEdit}
      />,
    )
    await user.click(screen.getByTestId('swipe-action-edit'))
    expect(onEdit).toHaveBeenCalledOnce()
  })

  it('should have data-testid="order-history-card"', () => {
    renderWithProviders(<OrderHistoryCard {...defaultProps} />)
    expect(screen.getByTestId('order-history-card')).toBeTruthy()
  })
})
