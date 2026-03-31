import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ScrollToTop } from './scroll-to-top'

// Mock lucide-react
vi.mock('lucide-react', () => ({
  ArrowUp: (props: Record<string, unknown>) => (
    <span data-testid="arrow-up-icon" {...props} />
  ),
}))

describe('ScrollToTop', () => {
  let scrollHandler: (() => void) | null = null

  beforeEach(() => {
    scrollHandler = null
    vi.spyOn(window, 'addEventListener').mockImplementation(
      (event: string, handler: unknown) => {
        if (event === 'scroll') scrollHandler = handler as () => void
      },
    )
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {})
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
  })

  it('should render with opacity-0 when scrollY is 0', () => {
    render(<ScrollToTop />)
    const button = screen.getByTestId('scroll-to-top')
    expect(button.className).toContain('opacity-0')
  })

  it('should show button when scrollY exceeds threshold', () => {
    render(<ScrollToTop threshold={100} />)
    Object.defineProperty(window, 'scrollY', { value: 150 })
    act(() => {
      scrollHandler?.()
    })
    const button = screen.getByTestId('scroll-to-top')
    expect(button.className).toContain('opacity-100')
  })

  it('should call window.scrollTo with smooth behavior when clicked', () => {
    render(<ScrollToTop />)
    Object.defineProperty(window, 'scrollY', { value: 300 })
    act(() => {
      scrollHandler?.()
    })
    fireEvent.click(screen.getByTestId('scroll-to-top'))
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth',
    })
  })

  it('should have ArrowUp icon', () => {
    render(<ScrollToTop />)
    expect(screen.getByTestId('arrow-up-icon')).toBeTruthy()
  })

  it('should hide button when scrolling back to top', () => {
    render(<ScrollToTop threshold={100} />)
    // Scroll down
    Object.defineProperty(window, 'scrollY', { value: 300 })
    act(() => {
      scrollHandler?.()
    })
    expect(screen.getByTestId('scroll-to-top').className).toContain(
      'opacity-100',
    )
    // Scroll back up
    Object.defineProperty(window, 'scrollY', { value: 50 })
    act(() => {
      scrollHandler?.()
    })
    expect(screen.getByTestId('scroll-to-top').className).toContain('opacity-0')
  })
})
