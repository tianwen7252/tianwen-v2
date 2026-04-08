import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { InitCanvas } from './init-canvas'

// Mock canvas context since jsdom doesn't support Canvas 2D
const mockCtx = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  arc: vi.fn(),
  ellipse: vi.fn(),
  fill: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  setTransform: vi.fn(),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  createRadialGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  font: '',
  textAlign: '',
  textBaseline: '',
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  shadowColor: '',
  shadowBlur: 0,
}

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    mockCtx as unknown as CanvasRenderingContext2D,
  )
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('InitCanvas', () => {
  it('should render a canvas element', () => {
    const { container } = render(<InitCanvas />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeTruthy()
  })

  it('should accept className prop', () => {
    const { container } = render(<InitCanvas className="test-class" />)
    const wrapper = container.firstElementChild
    expect(wrapper?.classList.contains('test-class')).toBe(true)
  })

  it('should start requestAnimationFrame on mount', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1)
    render(<InitCanvas />)
    expect(rafSpy).toHaveBeenCalled()
  })

  it('should cancel animation frame on unmount', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(42)
    const cafSpy = vi.spyOn(window, 'cancelAnimationFrame')
    const { unmount } = render(<InitCanvas />)
    unmount()
    expect(cafSpy).toHaveBeenCalledWith(42)
  })

  it('should add and remove resize listener', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1)

    const { unmount } = render(<InitCanvas />)
    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function))

    unmount()
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})
