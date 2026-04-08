import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { InitOverlay } from './init-overlay'

// Mock InitCanvas to avoid canvas rendering in tests
vi.mock('./init-canvas', () => ({
  InitCanvas: ({ className }: { className?: string }) => (
    <div data-testid="init-canvas" className={className} />
  ),
}))

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'init.loading': '點餐系統初始化中…',
      }
      return map[key] ?? key
    },
  }),
}))

afterEach(() => {
  cleanup()
})

describe('InitOverlay', () => {
  it('should render the canvas background', () => {
    const { getByTestId } = render(<InitOverlay />)
    expect(getByTestId('init-canvas')).toBeTruthy()
  })

  it('should display loading text', () => {
    const { getByText } = render(<InitOverlay />)
    expect(getByText('點餐系統初始化中…')).toBeTruthy()
  })

  it('should render a loading spinner', () => {
    const { container } = render(<InitOverlay />)
    const spinner = container.querySelector('[data-testid="init-spinner"]')
    expect(spinner).toBeTruthy()
  })

  it('should have overflow hidden to prevent scrolling', () => {
    const { container } = render(<InitOverlay />)
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.style.overflow === 'hidden' || wrapper.classList.contains('overflow-hidden')).toBe(true)
  })
})
