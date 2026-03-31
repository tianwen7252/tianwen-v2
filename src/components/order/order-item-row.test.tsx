import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrderItemRow } from './order-item-row'
import type { CartItem } from '@/stores/order-store'

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

describe('OrderItemRow', () => {
  const defaultHandlers = {
    onRemove: vi.fn(),
    onUpdateQuantity: vi.fn(),
    onUpdateNote: vi.fn(),
  }

  it('should render the item name', () => {
    const item = makeCartItem()
    render(<OrderItemRow item={item} {...defaultHandlers} />)
    expect(screen.getByText('經典漢堡')).toBeTruthy()
  })

  it('should render quantity with x prefix', () => {
    const item = makeCartItem({ quantity: 2 })
    render(<OrderItemRow item={item} {...defaultHandlers} />)
    expect(screen.getByText('x2')).toBeTruthy()
  })

  it('should render total price (price * quantity)', () => {
    const item = makeCartItem({ price: 120, quantity: 2 })
    render(<OrderItemRow item={item} {...defaultHandlers} />)
    expect(screen.getByText('$240')).toBeTruthy()
  })

  it('should render single quantity item price', () => {
    const item = makeCartItem({ price: 80, quantity: 1 })
    render(<OrderItemRow item={item} {...defaultHandlers} />)
    expect(screen.getByText('$80')).toBeTruthy()
  })

  it('should display note text when note is non-empty', () => {
    const item = makeCartItem({ note: '不加蛋' })
    render(<OrderItemRow item={item} {...defaultHandlers} />)
    expect(screen.getByText('不加蛋')).toBeTruthy()
  })

  it('should not display note area when note is empty', () => {
    const item = makeCartItem({ note: '' })
    render(<OrderItemRow item={item} {...defaultHandlers} />)
    expect(screen.queryByTestId('order-item-note')).toBeNull()
  })

  it('should call onRemove with cartItemId when remove button is clicked', async () => {
    const onRemove = vi.fn()
    const user = userEvent.setup()
    const item = makeCartItem({ id: 'cart-99' })
    render(
      <OrderItemRow
        item={item}
        onRemove={onRemove}
        onUpdateQuantity={vi.fn()}
        onUpdateNote={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: /remove/i }))
    expect(onRemove).toHaveBeenCalledWith('cart-99')
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('should call onUpdateQuantity with incremented quantity when + button is clicked', async () => {
    const onUpdateQuantity = vi.fn()
    const user = userEvent.setup()
    const item = makeCartItem({ id: 'cart-1', quantity: 2 })
    render(
      <OrderItemRow
        item={item}
        onRemove={vi.fn()}
        onUpdateQuantity={onUpdateQuantity}
        onUpdateNote={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: /increase/i }))
    expect(onUpdateQuantity).toHaveBeenCalledWith('cart-1', 3)
  })

  it('should call onUpdateQuantity with decremented quantity when - button is clicked', async () => {
    const onUpdateQuantity = vi.fn()
    const user = userEvent.setup()
    const item = makeCartItem({ id: 'cart-1', quantity: 3 })
    render(
      <OrderItemRow
        item={item}
        onRemove={vi.fn()}
        onUpdateQuantity={onUpdateQuantity}
        onUpdateNote={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: /decrease/i }))
    expect(onUpdateQuantity).toHaveBeenCalledWith('cart-1', 2)
  })

  it('should call onRemove when quantity is 1 and - button is clicked', async () => {
    const onRemove = vi.fn()
    const onUpdateQuantity = vi.fn()
    const user = userEvent.setup()
    const item = makeCartItem({ id: 'cart-1', quantity: 1 })
    render(
      <OrderItemRow
        item={item}
        onRemove={onRemove}
        onUpdateQuantity={onUpdateQuantity}
        onUpdateNote={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: /decrease/i }))
    expect(onRemove).toHaveBeenCalledWith('cart-1')
    expect(onUpdateQuantity).not.toHaveBeenCalled()
  })

  it('should render zero price correctly', () => {
    const item = makeCartItem({ price: 0, quantity: 1 })
    render(<OrderItemRow item={item} {...defaultHandlers} />)
    expect(screen.getByText('$0')).toBeTruthy()
  })

  it('should handle special characters in name', () => {
    const item = makeCartItem({ name: '紅燒雞腿便當 (大)' })
    render(<OrderItemRow item={item} {...defaultHandlers} />)
    expect(screen.getByText('紅燒雞腿便當 (大)')).toBeTruthy()
  })

  it('should handle special characters in note', () => {
    const item = makeCartItem({ note: '少糖 + 加冰' })
    render(<OrderItemRow item={item} {...defaultHandlers} />)
    expect(screen.getByText('少糖 + 加冰')).toBeTruthy()
  })

  it('should format large prices with locale string', () => {
    const item = makeCartItem({ price: 1500, quantity: 3 })
    render(<OrderItemRow item={item} {...defaultHandlers} />)
    // 1500 * 3 = 4500 → "$4,500"
    expect(screen.getByText('$4,500')).toBeTruthy()
  })

  it('should not call any handler without user interaction', () => {
    const onRemove = vi.fn()
    const onUpdateQuantity = vi.fn()
    const onUpdateNote = vi.fn()
    const item = makeCartItem()
    render(
      <OrderItemRow
        item={item}
        onRemove={onRemove}
        onUpdateQuantity={onUpdateQuantity}
        onUpdateNote={onUpdateNote}
      />,
    )
    expect(onRemove).not.toHaveBeenCalled()
    expect(onUpdateQuantity).not.toHaveBeenCalled()
    expect(onUpdateNote).not.toHaveBeenCalled()
  })
})
