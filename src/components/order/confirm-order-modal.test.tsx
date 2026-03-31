import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CartItem, Discount } from '@/stores/order-store'
import { ConfirmOrderModal } from './confirm-order-modal'
import {
  getOrderTypeRepo,
  resetMockRepositories,
} from '@/test/mock-repositories'

// Mock the repository provider so OrderNoteTags can load from mock DB
vi.mock('@/lib/repositories', () => ({
  getOrderTypeRepo: () => getOrderTypeRepo(),
}))

// ─── Factories ───────────────────────────────────────────────────────────────

function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 'item-1',
    commodityId: 'com-1',
    typeId: 'bento',
    name: '雞腿飯',
    price: 100,
    quantity: 1,
    note: '',
    includesSoup: false,
    ...overrides,
  }
}

function makeDiscount(overrides: Partial<Discount> = {}): Discount {
  return {
    id: 'disc-1',
    label: '會員折扣',
    amount: 50,
    ...overrides,
  }
}

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  items: [] as readonly CartItem[],
  discounts: [] as readonly Discount[],
  total: 0,
  bentoCount: 0,
  soupCount: 0,
  isSubmitting: false,
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ConfirmOrderModal', () => {
  beforeEach(() => {
    resetMockRepositories()
  })

  afterEach(() => {
    resetMockRepositories()
  })

  it('should not render content when open is false', () => {
    render(<ConfirmOrderModal {...defaultProps} open={false} />)
    expect(screen.queryByText('確認訂單')).toBeNull()
  })

  it('should render dialog with title when open', () => {
    render(<ConfirmOrderModal {...defaultProps} open={true} />)
    // sr-only h2 exists for accessibility (contains the title total text)
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy()
    // visual header shows confirm title
    expect(screen.getByText('確認訂單')).toBeTruthy()
  })

  it('should show categorized items grouped by category', () => {
    const items = [
      makeCartItem({
        id: '1',
        name: '雞腿飯',
        typeId: 'bento',
        price: 100,
        quantity: 2,
        includesSoup: true,
      }),
      makeCartItem({
        id: '2',
        name: '紅茶',
        typeId: 'drink',
        price: 30,
        quantity: 1,
      }),
      makeCartItem({
        id: '3',
        name: '加蛋',
        typeId: 'bento',
        price: 15,
        quantity: 1,
        includesSoup: false,
      }),
    ]
    render(<ConfirmOrderModal {...defaultProps} items={items} total={245} />)
    // Category headers should be visible
    expect(screen.getByText('餐盒')).toBeTruthy()
    expect(screen.getByText('單點')).toBeTruthy()
    expect(screen.getByText('飲料')).toBeTruthy()
  })

  it('should display item name, quantity, and total price per item', () => {
    const items = [
      makeCartItem({
        id: '1',
        name: '雞腿飯',
        typeId: 'bento',
        price: 100,
        quantity: 2,
      }),
    ]
    render(<ConfirmOrderModal {...defaultProps} items={items} total={200} />)
    expect(screen.getByText('雞腿飯')).toBeTruthy()
    expect(screen.getByText('x2')).toBeTruthy()
    // $200 appears in item price span
    expect(screen.getByText('$200')).toBeTruthy()
  })

  it('should display discount rows with negative amounts', () => {
    const discounts = [
      makeDiscount({ id: 'd1', label: '會員折扣', amount: 50 }),
    ]
    render(
      <ConfirmOrderModal {...defaultProps} discounts={discounts} total={0} />,
    )
    expect(screen.getByText('優惠')).toBeTruthy()
    expect(screen.getByText('會員折扣')).toBeTruthy()
    expect(screen.getByText('-$50')).toBeTruthy()
  })

  it('should render cancel button that calls onClose', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ConfirmOrderModal {...defaultProps} onClose={onClose} />)
    const cancelButton = screen.getByRole('button', { name: /取消/i })
    await user.click(cancelButton)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('should render confirm button that calls onConfirm', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup()
    render(<ConfirmOrderModal {...defaultProps} onConfirm={onConfirm} />)
    const confirmButton = screen.getByRole('button', { name: /確認送出/i })
    await user.click(confirmButton)
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('should disable confirm button when isSubmitting is true', () => {
    render(<ConfirmOrderModal {...defaultProps} isSubmitting={true} />)
    const confirmButton = screen.getByRole('button', { name: /確認送出/i })
    expect(confirmButton.hasAttribute('disabled')).toBe(true)
  })

  it('should not show categories with no items', () => {
    const items = [
      makeCartItem({
        id: '1',
        name: '紅茶',
        typeId: 'drink',
        price: 30,
        quantity: 1,
      }),
    ]
    render(<ConfirmOrderModal {...defaultProps} items={items} total={30} />)
    // Only drink should appear
    expect(screen.getByText('飲料')).toBeTruthy()
    expect(screen.queryByText('餐盒')).toBeNull()
    expect(screen.queryByText('單點')).toBeNull()
    expect(screen.queryByText('[水餃]')).toBeNull()
    expect(screen.queryByText('[其它]')).toBeNull()
    expect(screen.queryByText('優惠')).toBeNull()
  })

  it('should show total amount', () => {
    const items = [
      makeCartItem({
        id: '1',
        name: '雞腿飯',
        typeId: 'bento',
        price: 100,
        quantity: 3,
      }),
    ]
    render(<ConfirmOrderModal {...defaultProps} items={items} total={300} />)
    // The total should be displayed in the confirm-total-row (sr-only + visible = 2 elements)
    const totalRow = screen.getAllByTestId('confirm-total-row')[0]!
    expect(totalRow.textContent).toContain('$300')
  })

  it('should show multiple items in a single category', () => {
    const items = [
      makeCartItem({
        id: '1',
        name: '雞腿飯',
        typeId: 'bento',
        price: 100,
        quantity: 1,
      }),
      makeCartItem({
        id: '2',
        name: '排骨飯',
        typeId: 'bento',
        price: 110,
        quantity: 1,
      }),
    ]
    render(<ConfirmOrderModal {...defaultProps} items={items} total={210} />)
    expect(screen.getByText('雞腿飯')).toBeTruthy()
    expect(screen.getByText('排骨飯')).toBeTruthy()
  })

  it('should not disable cancel button when isSubmitting', () => {
    render(<ConfirmOrderModal {...defaultProps} isSubmitting={true} />)
    const cancelButton = screen.getByRole('button', { name: /取消/i })
    expect(cancelButton.hasAttribute('disabled')).toBe(false)
  })

  // ─── ChangePrediction integration ────────────────────────────────────────

  describe('ChangePrediction in right panel', () => {
    it('should render change prediction badges in the right panel when total > 0', () => {
      render(
        <ConfirmOrderModal
          {...defaultProps}
          items={[
            makeCartItem({
              id: '1',
              name: '雞腿飯',
              typeId: 'bento',
              price: 100,
              quantity: 1,
            }),
          ]}
          total={140}
        />,
      )
      // Change prediction for total=140: $1000 找 $860, $500 找 $360, $200 找 $60
      expect(screen.getByText('$1000 找 $860')).toBeTruthy()
      expect(screen.getByText('$500 找 $360')).toBeTruthy()
      expect(screen.getByText('$200 找 $60')).toBeTruthy()
    })

    it('should not render change prediction badges when total=0', () => {
      render(<ConfirmOrderModal {...defaultProps} total={0} />)
      expect(screen.queryByTestId('change-badge')).toBeNull()
    })

    it('should render total display row at the bottom of right panel', () => {
      render(
        <ConfirmOrderModal
          {...defaultProps}
          items={[
            makeCartItem({
              id: '1',
              name: '雞腿飯',
              typeId: 'bento',
              price: 100,
              quantity: 3,
            }),
          ]}
          total={300}
        />,
      )
      // Should display a total row with the total amount (sr-only + visible = 2 elements)
      const totalRow = screen.getAllByTestId('confirm-total-row')[0]!
      expect(totalRow).toBeTruthy()
      expect(totalRow.textContent).toContain('$300')
    })
  })

  // ─── Bento/Soup counts in total row ─────────────────────────────────────

  describe('Bento and soup counts in total row', () => {
    it('should display bento and soup counts above the total panel when bentoCount > 0', () => {
      render(
        <ConfirmOrderModal
          {...defaultProps}
          items={[
            makeCartItem({
              id: '1',
              name: '雞腿飯',
              typeId: 'bento',
              price: 100,
              quantity: 3,
            }),
          ]}
          total={300}
          bentoCount={3}
          soupCount={3}
        />,
      )
      const bentoSoupRow = screen.getByTestId('confirm-bento-soup-row')
      expect(bentoSoupRow.textContent).toContain('3個便當')
      expect(bentoSoupRow.textContent).toContain('3杯湯')
    })

    it('should not display bento/soup row when bentoCount is 0', () => {
      render(
        <ConfirmOrderModal
          {...defaultProps}
          items={[
            makeCartItem({
              id: '1',
              name: '紅茶',
              typeId: 'drink',
              price: 30,
              quantity: 1,
            }),
          ]}
          total={30}
          bentoCount={0}
          soupCount={0}
        />,
      )
      expect(screen.queryByTestId('confirm-bento-soup-row')).toBeNull()
    })
  })

  // ─── OrderNoteTags integration ──────────────────────────────────────────

  describe('OrderNoteTags in right panel', () => {
    it('should render OrderNoteTags section title in the right panel', () => {
      render(<ConfirmOrderModal {...defaultProps} open={true} />)
      // i18n key: order.orderNote -> '訂單備註'
      expect(screen.getByText('訂單備註')).toBeTruthy()
    })

    it('should render default note tags in the modal', async () => {
      render(<ConfirmOrderModal {...defaultProps} open={true} />)
      await screen.findByText('攤位')
      expect(screen.getByText('外送')).toBeTruthy()
      expect(screen.getByText('電話自取')).toBeTruthy()
    })

    it('should pass selected tags to onConfirm when confirm button is clicked', async () => {
      const onConfirm = vi.fn()
      const user = userEvent.setup()
      render(<ConfirmOrderModal {...defaultProps} onConfirm={onConfirm} />)

      // Wait for tags to load from DB, then select a tag
      await screen.findByText('外送')
      await user.click(screen.getByText('外送'))

      // Click confirm
      const confirmButton = screen.getByRole('button', { name: /確認送出/i })
      await user.click(confirmButton)

      expect(onConfirm).toHaveBeenCalledWith(['外送'])
    })
  })
})
