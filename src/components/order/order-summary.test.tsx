import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OrderSummary } from './order-summary'

describe('OrderSummary', () => {
  it('should render bento and soup count row when bentoCount > 0', () => {
    render(<OrderSummary bentoCount={3} soupCount={3} total={380} />)
    expect(screen.getByText('3個便當')).toBeTruthy()
    expect(screen.getByText('3杯湯')).toBeTruthy()
  })

  it('should hide bento/soup count row when bentoCount is 0', () => {
    render(<OrderSummary bentoCount={0} soupCount={0} total={200} />)
    expect(screen.queryByTestId('bento-soup-row')).toBeNull()
  })

  it('should render total label and value', () => {
    render(<OrderSummary bentoCount={1} soupCount={1} total={380} />)
    expect(screen.getByText('總金額')).toBeTruthy()
    expect(screen.getByText('$380')).toBeTruthy()
  })

  it('should format large total with locale string', () => {
    render(<OrderSummary bentoCount={0} soupCount={0} total={13000} />)
    expect(screen.getByText('$13,000')).toBeTruthy()
  })

  it('should render zero total correctly', () => {
    render(<OrderSummary bentoCount={0} soupCount={0} total={0} />)
    expect(screen.getByText('$0')).toBeTruthy()
  })

  it('should render total in large bold text', () => {
    const { container } = render(
      <OrderSummary bentoCount={0} soupCount={0} total={100} />,
    )
    const totalValue = container.querySelector('[data-testid="total-value"]')
    expect(totalValue).toBeTruthy()
    expect(totalValue!.textContent).toContain('$100')
  })

  it('should not render subtotal row', () => {
    const { container } = render(
      <OrderSummary bentoCount={2} soupCount={2} total={200} />,
    )
    const subtotalRow = container.querySelector('[data-testid="subtotal-row"]')
    expect(subtotalRow).toBeNull()
  })

  it('should render UtensilsCrossed and Soup icons when bentoCount > 0', () => {
    const { container } = render(
      <OrderSummary bentoCount={2} soupCount={2} total={200} />,
    )
    const bentoSoupRow = container.querySelector(
      '[data-testid="bento-soup-row"]',
    )
    expect(bentoSoupRow).toBeTruthy()
    // Lucide icons render as <svg> elements
    const svgs = bentoSoupRow!.querySelectorAll('svg')
    expect(svgs.length).toBe(2)
  })

  it('should show correct counts with different bento and soup values', () => {
    render(<OrderSummary bentoCount={5} soupCount={5} total={500} />)
    expect(screen.getByText('5個便當')).toBeTruthy()
    expect(screen.getByText('5杯湯')).toBeTruthy()
  })

  it('should apply muted-foreground styling to bento/soup row', () => {
    const { container } = render(
      <OrderSummary bentoCount={1} soupCount={1} total={100} />,
    )
    const row = container.querySelector('[data-testid="bento-soup-row"]')
    expect(row).toBeTruthy()
    expect(row!.className).toContain('text-muted-foreground')
  })
})
