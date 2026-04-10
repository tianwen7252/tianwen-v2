import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { ErrorCanvas } from './error-canvas'

// Mock WebGL context since jsdom doesn't support WebGL
const mockGl = {
  createShader: vi.fn(() => ({})),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn(() => true),
  deleteShader: vi.fn(),
  createProgram: vi.fn(() => ({})),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn(() => true),
  deleteProgram: vi.fn(),
  useProgram: vi.fn(),
  createBuffer: vi.fn(() => ({})),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  deleteBuffer: vi.fn(),
  getAttribLocation: vi.fn(() => 0),
  enableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  getUniformLocation: vi.fn(() => ({})),
  uniform1f: vi.fn(),
  uniform2f: vi.fn(),
  viewport: vi.fn(),
  drawArrays: vi.fn(),
  VERTEX_SHADER: 0x8b31,
  FRAGMENT_SHADER: 0x8b30,
  COMPILE_STATUS: 0x8b81,
  LINK_STATUS: 0x8b82,
  ARRAY_BUFFER: 0x8892,
  STATIC_DRAW: 0x88e4,
  FLOAT: 0x1406,
  TRIANGLES: 0x0004,
}

beforeEach(() => {
  // Clear accumulated call counts from previous tests
  Object.values(mockGl).forEach(v => {
    if (typeof v === 'function' && 'mockClear' in v) {
      ;(v as ReturnType<typeof vi.fn>).mockClear()
    }
  })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    mockGl as unknown as WebGLRenderingContext,
  )
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ErrorCanvas', () => {
  it('should render a canvas element', () => {
    const { container } = render(<ErrorCanvas />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeTruthy()
  })

  it('should accept className prop', () => {
    const { container } = render(<ErrorCanvas className="test-class" />)
    const wrapper = container.firstElementChild
    expect(wrapper?.classList.contains('test-class')).toBe(true)
  })

  it('should start requestAnimationFrame on mount', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1)
    render(<ErrorCanvas />)
    expect(rafSpy).toHaveBeenCalled()
  })

  it('should cancel animation frame on unmount', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(42)
    const cafSpy = vi.spyOn(window, 'cancelAnimationFrame')
    const { unmount } = render(<ErrorCanvas />)
    unmount()
    expect(cafSpy).toHaveBeenCalledWith(42)
  })

  it('should add and remove resize listener', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1)

    const { unmount } = render(<ErrorCanvas />)
    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function))

    unmount()
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  it('should initialize WebGL context', () => {
    render(<ErrorCanvas />)
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith(
      'webgl',
      expect.objectContaining({ alpha: false }),
    )
  })

  it('should compile shaders and create program', () => {
    render(<ErrorCanvas />)
    expect(mockGl.createShader).toHaveBeenCalledTimes(2)
    expect(mockGl.compileShader).toHaveBeenCalledTimes(2)
    expect(mockGl.createProgram).toHaveBeenCalledTimes(1)
    expect(mockGl.linkProgram).toHaveBeenCalledTimes(1)
  })

  it('should clean up WebGL resources on unmount', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1)
    const { unmount } = render(<ErrorCanvas />)
    unmount()
    expect(mockGl.deleteBuffer).toHaveBeenCalled()
    expect(mockGl.deleteProgram).toHaveBeenCalled()
  })
})
