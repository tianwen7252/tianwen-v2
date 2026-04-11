import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, fireEvent, screen } from '@testing-library/react'
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

// NOTE: InitOverlay renders via `createPortal(..., document.body)` so
// the DOM tree lives directly under <body>, not inside the wrapper that
// `render()` returns. Tests therefore query `screen.*` / `document.*`
// instead of the `{ container }` destructured from `render`.
describe('InitOverlay', () => {
  it('should render the canvas background', () => {
    render(<InitOverlay />)
    expect(screen.getByTestId('init-canvas')).toBeTruthy()
  })

  it('should display default loading text', () => {
    render(<InitOverlay />)
    expect(screen.getByText('點餐系統初始化中…')).toBeTruthy()
  })

  it('should display custom message when provided', () => {
    render(<InitOverlay message="同步資料中…" />)
    expect(screen.getByText('同步資料中…')).toBeTruthy()
  })

  it('should render a loading spinner', () => {
    render(<InitOverlay />)
    expect(screen.getByTestId('init-spinner')).toBeTruthy()
  })

  it('should render as fixed full-screen overlay', () => {
    render(<InitOverlay />)
    const wrapper = document.body.querySelector(
      '.fixed.inset-0',
    ) as HTMLElement | null
    expect(wrapper).not.toBeNull()
    expect(wrapper!.classList.contains('fixed')).toBe(true)
    expect(wrapper!.classList.contains('inset-0')).toBe(true)
  })

  it('should not show back button when onClose is not provided', () => {
    render(<InitOverlay />)
    expect(document.querySelector('[aria-label="Back"]')).toBeNull()
  })

  it('should show back button when onClose is provided', () => {
    const onClose = vi.fn()
    render(<InitOverlay onClose={onClose} />)
    expect(document.querySelector('[aria-label="Back"]')).toBeTruthy()
  })

  it('should call onClose when back button is clicked', () => {
    const onClose = vi.fn()
    render(<InitOverlay onClose={onClose} />)
    const backBtn = document.querySelector('[aria-label="Back"]')!
    fireEvent.click(backBtn)
    expect(onClose).toHaveBeenCalledOnce()
  })
})
