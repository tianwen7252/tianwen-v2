import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { InitOverlay } from './init-overlay'

// Mock InitCanvas to avoid canvas rendering in tests
vi.mock('./init-canvas', () => ({
  InitCanvas: ({ className }: { className?: string }) => (
    <div data-testid="init-canvas" className={className} />
  ),
}))

// Mock Spinner
vi.mock('@/components/ui/spinner', () => ({
  Spinner: (props: Record<string, unknown>) => (
    <svg data-testid={props['data-testid'] as string} />
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

  it('should display default loading text', () => {
    const { getByText } = render(<InitOverlay />)
    expect(getByText('點餐系統初始化中…')).toBeTruthy()
  })

  it('should display custom message when provided', () => {
    const { getByText } = render(<InitOverlay message="同步資料中…" />)
    expect(getByText('同步資料中…')).toBeTruthy()
  })

  it('should render a loading spinner', () => {
    const { container } = render(<InitOverlay />)
    const spinner = container.querySelector('[data-testid="init-spinner"]')
    expect(spinner).toBeTruthy()
  })

  it('should render as fixed full-screen overlay', () => {
    const { container } = render(<InitOverlay />)
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.classList.contains('fixed')).toBe(true)
    expect(wrapper.classList.contains('inset-0')).toBe(true)
  })

  it('should not show back button when onClose is not provided', () => {
    const { container } = render(<InitOverlay />)
    expect(container.querySelector('[aria-label="Back"]')).toBeNull()
  })

  it('should show back button when onClose is provided', () => {
    const onClose = vi.fn()
    const { container } = render(<InitOverlay onClose={onClose} />)
    const backBtn = container.querySelector('[aria-label="Back"]')
    expect(backBtn).toBeTruthy()
  })

  it('should call onClose when back button is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(<InitOverlay onClose={onClose} />)
    const backBtn = container.querySelector('[aria-label="Back"]')!
    fireEvent.click(backBtn)
    expect(onClose).toHaveBeenCalledOnce()
  })
})
