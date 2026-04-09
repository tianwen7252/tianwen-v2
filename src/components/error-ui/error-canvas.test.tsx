import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { ErrorCanvas } from './error-canvas'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ErrorCanvas', () => {
  it('should render an iframe element', () => {
    const { container } = render(<ErrorCanvas />)
    const iframe = container.querySelector('iframe')
    expect(iframe).toBeTruthy()
  })

  it('should point iframe to error-animation.html', () => {
    const { container } = render(<ErrorCanvas />)
    const iframe = container.querySelector('iframe')
    expect(iframe?.getAttribute('src')).toBe('/error-animation.html')
  })

  it('should accept className prop', () => {
    const { container } = render(<ErrorCanvas className="test-class" />)
    const wrapper = container.firstElementChild
    expect(wrapper?.classList.contains('test-class')).toBe(true)
  })

  it('should disable pointer events on iframe', () => {
    const { container } = render(<ErrorCanvas />)
    const iframe = container.querySelector('iframe')
    expect(iframe?.style.pointerEvents).toBe('none')
  })
})
