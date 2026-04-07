import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useOrderStore } from '@/stores/order-store'
import type { Order } from '@/lib/schemas'
import {
  getOrderTypeRepo,
  resetMockRepositories,
} from '@/test/mock-repositories'

// Mock repository provider
const mockUpdate = vi.fn()
vi.mock('@/lib/repositories/provider', () => ({
  getOrderRepo: () => ({
    update: mockUpdate,
  }),
  getCommodityRepo: () => ({
    findAll: vi.fn().mockResolvedValue([]),
  }),
  getOrderTypeRepo: () => getOrderTypeRepo(),
}))

// Also mock the @/lib/repositories barrel so OrderNoteTags resolves getOrderTypeRepo
vi.mock('@/lib/repositories', () => ({
  getOrderTypeRepo: () => getOrderTypeRepo(),
}))

// Mock notify
vi.mock('@/components/ui/sonner', () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock ProductGrid — heavy component, not under test
vi.mock('@/components/order/product-grid', () => ({
  ProductGrid: () => <div data-testid="product-grid">ProductGrid</div>,
}))

// ─── Factories ───────────────────────────────────────────────────────────────

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    number: 5,
    memo: [],
    soups: 2,
    total: 200,
    originalTotal: 200,
    editor: 'admin',
    items: [
      {
        id: 'oi-1',
        orderId: 'order-1',
        commodityId: 'c1',
        name: 'Chicken Bento',
        price: 100,
        quantity: 2,
        includesSoup: true,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      },
    ],
    discounts: [],
    isServed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
}

function makeTypeIdMap(
  entries: [string, string][] = [['c1', 'bento']],
): ReadonlyMap<string, string> {
  return new Map(entries)
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('EditOrderModal', () => {
  const defaultProps = {
    open: true,
    order: makeOrder(),
    typeIdMap: makeTypeIdMap(),
    onClose: vi.fn(),
    onSaved: vi.fn(),
  }

  beforeEach(() => {
    resetMockRepositories()
    vi.clearAllMocks()
    act(() => {
      useOrderStore.setState({
        items: [],
        discounts: [],
        operatorId: null,
        operatorName: null,
        lastAddedItem: null,
      })
    })
  })

  afterEach(() => {
    resetMockRepositories()
  })

  async function renderModal(props: Partial<typeof defaultProps> = {}) {
    const { EditOrderModal } = await import('./edit-order-modal')
    return render(<EditOrderModal {...defaultProps} {...props} />)
  }

  it('should not render when open is false', async () => {
    await renderModal({ open: false })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('should render in ordering mode when opened with an order', async () => {
    await renderModal()
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('should show ProductGrid and OrderPanel in ordering mode', async () => {
    await renderModal()
    // ProductGrid is mocked
    expect(screen.getByTestId('product-grid')).toBeTruthy()
    // OrderPanel renders the header "目前訂單"
    expect(screen.getByText('目前訂單')).toBeTruthy()
  })

  it('should show submit button with edit order text in ordering mode', async () => {
    await renderModal()
    expect(screen.getByRole('button', { name: /編輯訂單/i })).toBeTruthy()
  })

  it('should call loadOrder when opened with order', async () => {
    const loadOrderSpy = vi.spyOn(useOrderStore.getState(), 'loadOrder')
    await renderModal()
    expect(loadOrderSpy).toHaveBeenCalledWith(
      defaultProps.order,
      defaultProps.typeIdMap,
    )
    loadOrderSpy.mockRestore()
  })

  it('should transition to confirming mode when submit is clicked', async () => {
    // Populate store so submit button is enabled
    act(() => {
      useOrderStore
        .getState()
        .loadOrder(defaultProps.order, defaultProps.typeIdMap)
    })
    const user = userEvent.setup()
    await renderModal()

    // Click the edit order button
    const submitBtn = screen.getByRole('button', { name: /編輯訂單/i })
    await user.click(submitBtn)

    // In confirming mode, should show edit title and confirm content
    expect(screen.getByText(/編輯訂單#5/)).toBeTruthy()
    // Should show the confirm button with edit-specific text
    expect(screen.getByRole('button', { name: /確定編輯/i })).toBeTruthy()
  })

  it('should show ArrowLeft button in confirming mode', async () => {
    act(() => {
      useOrderStore
        .getState()
        .loadOrder(defaultProps.order, defaultProps.typeIdMap)
    })
    const user = userEvent.setup()
    await renderModal()

    // Transition to confirming mode
    await user.click(screen.getByRole('button', { name: /編輯訂單/i }))

    // ArrowLeft button should be visible
    expect(screen.getByTestId('edit-order-back-button')).toBeTruthy()
  })

  it('should transition back to ordering mode when ArrowLeft is clicked', async () => {
    act(() => {
      useOrderStore
        .getState()
        .loadOrder(defaultProps.order, defaultProps.typeIdMap)
    })
    const user = userEvent.setup()
    await renderModal()

    // Transition to confirming mode
    await user.click(screen.getByRole('button', { name: /編輯訂單/i }))
    expect(screen.getByRole('button', { name: /確定編輯/i })).toBeTruthy()

    // Click back arrow
    await user.click(screen.getByTestId('edit-order-back-button'))

    // Should be back in ordering mode
    expect(screen.getByTestId('product-grid')).toBeTruthy()
    expect(screen.getByRole('button', { name: /編輯訂單/i })).toBeTruthy()
  })

  it('should show confirm edit button text in confirming mode', async () => {
    act(() => {
      useOrderStore
        .getState()
        .loadOrder(defaultProps.order, defaultProps.typeIdMap)
    })
    const user = userEvent.setup()
    await renderModal()

    await user.click(screen.getByRole('button', { name: /編輯訂單/i }))

    expect(screen.getByRole('button', { name: /確定編輯/i })).toBeTruthy()
  })

  it('should call onClose when modal X close button is clicked', async () => {
    const onClose = vi.fn()
    await renderModal({ onClose })

    const user = userEvent.setup()
    // The Modal component always has a close X button
    const closeButtons = screen.getAllByRole('button')
    // The X close button is the one with the X icon — find it
    const xButton = closeButtons.find(
      btn => btn.querySelector('svg') && btn.className.includes('right-2'),
    )
    if (xButton) {
      await user.click(xButton)
      expect(onClose).toHaveBeenCalled()
    }
  })

  it('should call orderRepo.update and onSaved on successful confirm', async () => {
    const { notify } = await import('@/components/ui/sonner')
    const onSaved = vi.fn()
    mockUpdate.mockResolvedValueOnce(makeOrder())

    act(() => {
      useOrderStore
        .getState()
        .loadOrder(defaultProps.order, defaultProps.typeIdMap)
    })
    const user = userEvent.setup()
    await renderModal({ onSaved })

    // Go to confirming mode
    await user.click(screen.getByRole('button', { name: /編輯訂單/i }))
    // Click confirm
    await user.click(screen.getByRole('button', { name: /確定編輯/i }))

    // Wait for async
    await vi.waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled()
    })
    expect(onSaved).toHaveBeenCalled()
    expect(notify.success).toHaveBeenCalled()
  })

  it('should show error toast when update fails', async () => {
    const { notify } = await import('@/components/ui/sonner')
    mockUpdate.mockRejectedValueOnce(new Error('DB error'))

    act(() => {
      useOrderStore
        .getState()
        .loadOrder(defaultProps.order, defaultProps.typeIdMap)
    })
    const user = userEvent.setup()
    await renderModal()

    await user.click(screen.getByRole('button', { name: /編輯訂單/i }))
    await user.click(screen.getByRole('button', { name: /確定編輯/i }))

    await vi.waitFor(() => {
      expect(notify.error).toHaveBeenCalled()
    })
  })
})
