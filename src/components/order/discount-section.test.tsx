import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DiscountSection } from './discount-section'
import type { Discount } from '@/stores/order-store'

/** Factory to create mock Discount objects */
function makeDiscount(overrides: Partial<Discount> = {}): Discount {
  return {
    id: 'disc-1',
    label: '會員折扣',
    amount: 50,
    ...overrides,
  }
}

describe('DiscountSection', () => {
  it('should render the section header', () => {
    render(<DiscountSection discounts={[]} onRemoveDiscount={vi.fn()} />)
    expect(screen.getByText('折扣優惠 (可多選)')).toBeTruthy()
  })

  it('should render a discount tag with label and negative amount', () => {
    const discounts = [makeDiscount({ label: '會員折扣', amount: 50 })]
    render(<DiscountSection discounts={discounts} onRemoveDiscount={vi.fn()} />)
    expect(screen.getByText(/會員折扣/)).toBeTruthy()
    expect(screen.getByText(/-\$50/)).toBeTruthy()
  })

  it('should render multiple discount tags', () => {
    const discounts = [
      makeDiscount({ id: 'disc-1', label: '會員折扣', amount: 50 }),
      makeDiscount({ id: 'disc-2', label: '早鳥優惠', amount: 30 }),
    ]
    render(<DiscountSection discounts={discounts} onRemoveDiscount={vi.fn()} />)
    expect(screen.getByText(/會員折扣/)).toBeTruthy()
    expect(screen.getByText(/早鳥優惠/)).toBeTruthy()
  })

  it('should call onRemoveDiscount with discount id when remove button is clicked', async () => {
    const onRemoveDiscount = vi.fn()
    const user = userEvent.setup()
    const discounts = [makeDiscount({ id: 'disc-42' })]
    render(
      <DiscountSection
        discounts={discounts}
        onRemoveDiscount={onRemoveDiscount}
      />,
    )
    await user.click(screen.getByRole('button', { name: /remove/i }))
    expect(onRemoveDiscount).toHaveBeenCalledWith('disc-42')
    expect(onRemoveDiscount).toHaveBeenCalledTimes(1)
  })

  it('should render only the header when discounts array is empty', () => {
    const { container } = render(
      <DiscountSection discounts={[]} onRemoveDiscount={vi.fn()} />,
    )
    expect(screen.getByText('折扣優惠 (可多選)')).toBeTruthy()
    // No discount tags should be rendered
    expect(
      container.querySelectorAll('[data-testid="discount-tag"]').length,
    ).toBe(0)
  })

  it('should call correct handler when removing one of multiple discounts', async () => {
    const onRemoveDiscount = vi.fn()
    const user = userEvent.setup()
    const discounts = [
      makeDiscount({ id: 'disc-1', label: '會員折扣', amount: 50 }),
      makeDiscount({ id: 'disc-2', label: '早鳥優惠', amount: 30 }),
    ]
    render(
      <DiscountSection
        discounts={discounts}
        onRemoveDiscount={onRemoveDiscount}
      />,
    )
    const removeButtons = screen.getAllByRole('button', { name: /remove/i })
    // Click the second remove button
    await user.click(removeButtons[1]!)
    expect(onRemoveDiscount).toHaveBeenCalledWith('disc-2')
  })

  it('should render large discount amounts', () => {
    const discounts = [makeDiscount({ amount: 1500 })]
    render(<DiscountSection discounts={discounts} onRemoveDiscount={vi.fn()} />)
    expect(screen.getByText(/-\$1,500/)).toBeTruthy()
  })

  it('should not call handler without user interaction', () => {
    const onRemoveDiscount = vi.fn()
    const discounts = [makeDiscount()]
    render(
      <DiscountSection
        discounts={discounts}
        onRemoveDiscount={onRemoveDiscount}
      />,
    )
    expect(onRemoveDiscount).not.toHaveBeenCalled()
  })

  it('should handle special characters in discount label', () => {
    const discounts = [makeDiscount({ label: '特殊折扣 (VIP)' })]
    render(<DiscountSection discounts={discounts} onRemoveDiscount={vi.fn()} />)
    expect(screen.getByText(/特殊折扣 \(VIP\)/)).toBeTruthy()
  })

  it('should use RippleButton (not shadcn Button) for remove buttons', () => {
    const discounts = [
      makeDiscount({ id: 'disc-1', label: '會員折扣', amount: 50 }),
      makeDiscount({ id: 'disc-2', label: '早鳥優惠', amount: 30 }),
    ]
    const { container } = render(
      <DiscountSection discounts={discounts} onRemoveDiscount={vi.fn()} />,
    )
    // shadcn Button renders with data-slot="button" — must not be present
    expect(container.querySelectorAll('[data-slot="button"]').length).toBe(0)
    // RippleButton renders with "relative overflow-hidden" classes
    const rippleButtons = container.querySelectorAll(
      'button.relative.overflow-hidden',
    )
    expect(rippleButtons.length).toBe(2)
  })
})
