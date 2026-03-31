import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useOrderStore } from '@/stores/order-store'
import type { CartItem } from '@/stores/order-store'
import {
  getOrderTypeRepo,
  resetMockRepositories,
} from '@/test/mock-repositories'

// Mock the repository provider so OrderNoteTags can load from mock DB
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

/** Factory to create mock CartItem objects */
function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 'cart-1',
    commodityId: 'com-1',
    typeId: 'bento',
    name: '經典漢堡',
    price: 120,
    quantity: 1,
    note: '',
    includesSoup: false,
    ...overrides,
  }
}

describe('OrderPanel', () => {
  beforeEach(() => {
    resetMockRepositories()
    // Reset store state before each test
    act(() => {
      useOrderStore.setState({
        items: [],
        discounts: [],
        operatorId: null,
        operatorName: null,
        quickSubmit: true,
      })
    })
  })

  afterEach(() => {
    resetMockRepositories()
  })

  // Lazy import to ensure mock is applied first
  async function renderOrderPanel() {
    const { OrderPanel } = await import('./order-panel')
    return render(<OrderPanel />)
  }

  it('should render the header', async () => {
    await renderOrderPanel()
    expect(screen.getByText('目前訂單')).toBeTruthy()
  })

  it('should show empty state when cart has no items', async () => {
    await renderOrderPanel()
    expect(screen.getByText('尚無訂單項目')).toBeTruthy()
  })

  it('should render cart items', async () => {
    act(() => {
      useOrderStore.setState({
        items: [
          makeCartItem({ id: 'c1', name: '經典漢堡', price: 120, quantity: 2 }),
          makeCartItem({ id: 'c2', name: '香草奶昔', price: 80, quantity: 1 }),
        ],
      })
    })
    await renderOrderPanel()
    expect(screen.getByText('經典漢堡')).toBeTruthy()
    expect(screen.getByText('香草奶昔')).toBeTruthy()
  })

  it('should render order summary with correct total', async () => {
    act(() => {
      useOrderStore.setState({
        items: [
          makeCartItem({ price: 120, quantity: 2 }),
          makeCartItem({
            id: 'c2',
            commodityId: 'com-2',
            name: '香草奶昔',
            price: 80,
            quantity: 1,
          }),
        ],
      })
    })
    await renderOrderPanel()
    // Total: 120*2 + 80*1 = 320 (no discount)
    expect(screen.getByText('$320')).toBeTruthy()
  })

  it('should pass bentoCount and soupCount to OrderSummary', async () => {
    // Items with includesSoup=true count as bento
    act(() => {
      useOrderStore.setState({
        items: [
          makeCartItem({
            id: 'c1',
            typeId: 'bento',
            name: '滷肉飯',
            price: 100,
            quantity: 2,
            includesSoup: true,
          }),
          makeCartItem({
            id: 'c2',
            typeId: 'drink',
            name: '紅茶',
            price: 30,
            quantity: 1,
            includesSoup: false,
          }),
        ],
      })
    })
    await renderOrderPanel()
    // bentoCount = 2 (only items with includesSoup=true), soupCount = 2 (same as bento)
    expect(screen.getByText('2個便當')).toBeTruthy()
    expect(screen.getByText('2杯湯')).toBeTruthy()
  })

  it('should NOT count bento items where includesSoup is false (e.g. 雞胸肉沙拉)', async () => {
    act(() => {
      useOrderStore.setState({
        items: [
          makeCartItem({
            id: 'c1',
            typeId: 'bento',
            name: '雞胸肉沙拉',
            price: 160,
            quantity: 1,
            includesSoup: false,
          }),
        ],
      })
    })
    await renderOrderPanel()
    expect(screen.queryByTestId('bento-soup-row')).toBeNull()
  })

  it('should not show bento/soup row when no bento items', async () => {
    act(() => {
      useOrderStore.setState({
        items: [
          makeCartItem({
            id: 'c1',
            typeId: 'drink',
            name: '紅茶',
            price: 30,
            quantity: 1,
          }),
        ],
      })
    })
    await renderOrderPanel()
    expect(screen.queryByTestId('bento-soup-row')).toBeNull()
  })

  it('should render submit button', async () => {
    await renderOrderPanel()
    expect(screen.getByRole('button', { name: /送出訂單/i })).toBeTruthy()
  })

  it('should disable submit button when cart is empty', async () => {
    await renderOrderPanel()
    const submitButton = screen.getByRole('button', { name: /送出訂單/i })
    expect(submitButton.hasAttribute('disabled')).toBe(true)
  })

  it('should enable submit button when cart has items', async () => {
    act(() => {
      useOrderStore.setState({
        items: [makeCartItem()],
      })
    })
    await renderOrderPanel()
    const submitButton = screen.getByRole('button', { name: /送出訂單/i })
    expect(submitButton.hasAttribute('disabled')).toBe(false)
  })

  it('should call removeItem when item remove button is clicked', async () => {
    act(() => {
      useOrderStore.setState({
        items: [makeCartItem({ id: 'cart-42', name: '滷肉便當' })],
      })
    })
    const user = userEvent.setup()
    await renderOrderPanel()
    // Click the remove button on the item row
    await user.click(screen.getByRole('button', { name: /remove/i }))
    // Item should be removed from store
    expect(useOrderStore.getState().items).toHaveLength(0)
  })

  it('should open confirm modal when submit button is clicked (quickSubmit OFF)', async () => {
    act(() => {
      useOrderStore.setState({
        items: [makeCartItem()],
      })
    })

    const user = userEvent.setup()
    await renderOrderPanel()
    // Disable quick submit via store
    act(() => {
      useOrderStore.setState({ quickSubmit: false })
    })
    const submitButton = screen.getByRole('button', { name: /送出訂單/i })
    await user.click(submitButton)

    // Modal should appear — dialog role present, visual header shows confirm title
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('確認訂單')).toBeTruthy()
  })

  it('should close confirm modal when cancel button is clicked (quickSubmit OFF)', async () => {
    act(() => {
      useOrderStore.setState({
        items: [makeCartItem()],
      })
    })

    const user = userEvent.setup()
    await renderOrderPanel()
    // Disable quick submit via store
    act(() => {
      useOrderStore.setState({ quickSubmit: false })
    })
    // Open modal
    await user.click(screen.getByRole('button', { name: /送出訂單/i }))
    expect(screen.getByRole('dialog')).toBeTruthy()

    // Click cancel in the modal
    await user.click(screen.getByRole('button', { name: /取消/i }))
    // Modal should close
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('should call submitOrder and show toast on success when confirmed in modal (quickSubmit OFF)', async () => {
    const { notify } = await import('@/components/ui/sonner')
    vi.spyOn(useOrderStore.getState(), 'submitOrder').mockResolvedValueOnce()

    act(() => {
      useOrderStore.setState({
        items: [makeCartItem()],
      })
    })

    const user = userEvent.setup()
    await renderOrderPanel()
    // Disable quick submit via store
    act(() => {
      useOrderStore.setState({ quickSubmit: false })
    })
    // Open modal
    await user.click(screen.getByRole('button', { name: /送出訂單/i }))
    // Click confirm in the modal
    await user.click(screen.getByRole('button', { name: /確認送出/i }))

    expect(notify.success).toHaveBeenCalledWith('訂單已送出')
  })

  it('should show error toast when submitOrder fails after modal confirm (quickSubmit OFF)', async () => {
    const { notify } = await import('@/components/ui/sonner')
    vi.spyOn(useOrderStore.getState(), 'submitOrder').mockRejectedValueOnce(
      new Error('Network error'),
    )

    act(() => {
      useOrderStore.setState({
        items: [makeCartItem()],
      })
    })

    const user = userEvent.setup()
    await renderOrderPanel()
    // Disable quick submit via store
    act(() => {
      useOrderStore.setState({ quickSubmit: false })
    })
    // Open modal
    await user.click(screen.getByRole('button', { name: /送出訂單/i }))
    // Click confirm in the modal
    await user.click(screen.getByRole('button', { name: /確認送出/i }))

    expect(notify.error).toHaveBeenCalledWith('訂單送出失敗')
  })

  it('should submit directly without modal when quickSubmit is ON (default)', async () => {
    const { notify } = await import('@/components/ui/sonner')
    vi.spyOn(useOrderStore.getState(), 'submitOrder').mockResolvedValueOnce()

    act(() => {
      useOrderStore.setState({
        items: [makeCartItem()],
      })
    })

    const user = userEvent.setup()
    await renderOrderPanel()
    // quickSubmit is ON by default — clicking submit should NOT open modal
    await user.click(screen.getByRole('button', { name: /送出訂單/i }))

    // No modal should appear
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(notify.success).toHaveBeenCalledWith('訂單已送出')
  })

  it('should not render empty state when items exist', async () => {
    act(() => {
      useOrderStore.setState({
        items: [makeCartItem()],
      })
    })
    await renderOrderPanel()
    expect(screen.queryByText('尚無訂單項目')).toBeNull()
  })

  it('should update quantity via increase button', async () => {
    act(() => {
      useOrderStore.setState({
        items: [makeCartItem({ id: 'cart-1', quantity: 1 })],
      })
    })
    const user = userEvent.setup()
    await renderOrderPanel()
    await user.click(screen.getByRole('button', { name: /increase/i }))
    const updatedItem = useOrderStore
      .getState()
      .items.find(i => i.id === 'cart-1')
    expect(updatedItem?.quantity).toBe(2)
  })

  it('should show item note when present', async () => {
    act(() => {
      useOrderStore.setState({
        items: [makeCartItem({ note: '不加蛋' })],
      })
    })
    await renderOrderPanel()
    expect(screen.getByText('不加蛋')).toBeTruthy()
  })

  // ─── onSubmitClick / submitLabel / submitColor props ──────────────────────

  async function renderOrderPanelWithProps(
    props: {
      onSubmitClick?: () => void
      submitLabel?: string
      submitColor?: string
    } = {},
  ) {
    const { OrderPanel } = await import('./order-panel')
    return render(<OrderPanel {...props} />)
  }

  describe('onSubmitClick prop', () => {
    it('should use custom submitLabel when provided', async () => {
      act(() => {
        useOrderStore.setState({
          items: [makeCartItem()],
        })
      })
      await renderOrderPanelWithProps({
        onSubmitClick: vi.fn(),
        submitLabel: '編輯訂單',
      })
      expect(screen.getByRole('button', { name: /編輯訂單/i })).toBeTruthy()
      // Default label should NOT appear
      expect(screen.queryByRole('button', { name: /送出訂單/i })).toBeNull()
    })

    it('should call onSubmitClick instead of opening ConfirmOrderModal', async () => {
      const onSubmitClick = vi.fn()
      act(() => {
        useOrderStore.setState({
          items: [makeCartItem()],
        })
      })
      const user = userEvent.setup()
      await renderOrderPanelWithProps({ onSubmitClick })
      const submitButton = screen.getByRole('button', { name: /送出訂單/i })
      await user.click(submitButton)

      expect(onSubmitClick).toHaveBeenCalledOnce()
      // ConfirmOrderModal should NOT open
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('should not render ConfirmOrderModal when onSubmitClick is provided', async () => {
      act(() => {
        useOrderStore.setState({
          items: [makeCartItem()],
        })
      })
      const user = userEvent.setup()
      await renderOrderPanelWithProps({ onSubmitClick: vi.fn() })
      const submitButton = screen.getByRole('button', { name: /送出訂單/i })
      await user.click(submitButton)
      // No dialog should be rendered
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('should apply submitColor as background color on the submit button', async () => {
      act(() => {
        useOrderStore.setState({
          items: [makeCartItem()],
        })
      })
      await renderOrderPanelWithProps({
        onSubmitClick: vi.fn(),
        submitColor: '#4A90D9',
      })
      const submitButton = screen.getByRole('button', { name: /送出訂單/i })
      expect(submitButton.style.backgroundColor).toBe('#4A90D9')
    })

    it('should use default label when submitLabel is not provided with onSubmitClick', async () => {
      act(() => {
        useOrderStore.setState({
          items: [makeCartItem()],
        })
      })
      await renderOrderPanelWithProps({ onSubmitClick: vi.fn() })
      expect(screen.getByRole('button', { name: /送出訂單/i })).toBeTruthy()
    })
  })
})
