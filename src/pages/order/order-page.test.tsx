import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OrderPage } from './order-page'

// ─── Mock child components to isolate layout testing ─────────────────────────

vi.mock('@/components/order', () => ({
  ProductGrid: () => <div data-testid="product-grid">ProductGrid</div>,
  OrderPanel: () => <div data-testid="order-panel">OrderPanel</div>,
}))

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('OrderPage', () => {
  it('should render ProductGrid component', () => {
    render(<OrderPage />)
    expect(screen.getByTestId('product-grid')).toBeTruthy()
  })

  it('should render OrderPanel component', () => {
    render(<OrderPage />)
    expect(screen.getByTestId('order-panel')).toBeTruthy()
  })

  it('should render a flex container with two panels', () => {
    const { container } = render(<OrderPage />)
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper).toBeTruthy()
    expect(wrapper.classList.contains('flex')).toBe(true)
  })

  it('should set full viewport height minus header on the wrapper', () => {
    const { container } = render(<OrderPage />)
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.classList.contains('h-[calc(100vh-57px)]')).toBe(true)
  })

  it('should have no gap between panels (flush layout)', () => {
    const { container } = render(<OrderPage />)
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.classList.contains('gap-0')).toBe(true)
  })

  it('should have left panel with 65% flex ratio', () => {
    const { container } = render(<OrderPage />)
    // ProductGrid → scroll wrapper → flex-64 outer
    const outerPanel = container.querySelector('[data-testid="product-grid"]')
      ?.parentElement?.parentElement as HTMLElement
    expect(outerPanel).toBeTruthy()
    expect(outerPanel.classList.contains('flex-64')).toBe(true)
  })

  it('should have left panel with scrollable overflow', () => {
    const { container } = render(<OrderPage />)
    // Scroll wrapper is the direct parent of ProductGrid
    const scrollWrapper = container.querySelector(
      '[data-testid="product-grid"]',
    )?.parentElement as HTMLElement
    expect(scrollWrapper.classList.contains('overflow-y-auto')).toBe(true)
  })

  it('should have left panel with correct flex ratio', () => {
    const { container } = render(<OrderPage />)
    const outerPanel = container.querySelector('[data-testid="product-grid"]')
      ?.parentElement?.parentElement as HTMLElement
    expect(outerPanel.classList.contains('flex-64')).toBe(true)
  })

  it('should have right panel with 35% flex ratio', () => {
    const { container } = render(<OrderPage />)
    const rightPanel = container.querySelector('[data-testid="order-panel"]')
      ?.parentElement as HTMLElement
    expect(rightPanel).toBeTruthy()
    expect(rightPanel.classList.contains('flex-36')).toBe(true)
  })

  it('should have right panel with scrollable overflow', () => {
    const { container } = render(<OrderPage />)
    const rightPanel = container.querySelector('[data-testid="order-panel"]')
      ?.parentElement as HTMLElement
    expect(rightPanel.classList.contains('overflow-y-auto')).toBe(true)
  })

  it('should have right panel with card background color', () => {
    const { container } = render(<OrderPage />)
    const rightPanel = container.querySelector('[data-testid="order-panel"]')
      ?.parentElement as HTMLElement
    expect(rightPanel.classList.contains('bg-card')).toBe(true)
  })

  it('should have right panel with left border', () => {
    const { container } = render(<OrderPage />)
    const rightPanel = container.querySelector('[data-testid="order-panel"]')
      ?.parentElement as HTMLElement
    expect(rightPanel.classList.contains('border-l')).toBe(true)
    expect(rightPanel.classList.contains('border-border')).toBe(true)
  })

  it('should have padding on both panels', () => {
    const { container } = render(<OrderPage />)
    const leftPanel = container.querySelector('[data-testid="product-grid"]')
      ?.parentElement as HTMLElement
    const rightPanel = container.querySelector('[data-testid="order-panel"]')
      ?.parentElement as HTMLElement
    expect(leftPanel.classList.contains('px-4')).toBe(true)
    expect(rightPanel.classList.contains('p-4')).toBe(true)
  })

  it('should render exactly two child panels inside the wrapper', () => {
    const { container } = render(<OrderPage />)
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.children).toHaveLength(2)
  })
})
