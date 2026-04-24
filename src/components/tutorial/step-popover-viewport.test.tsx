import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { StepPopover } from './step-popover'

// ─── Mock @floating-ui/react ─────────────────────────────────────────────────

const mockUpdate = vi.fn()

vi.mock('@floating-ui/react', () => ({
  useFloating: vi.fn(() => ({
    refs: {
      setReference: vi.fn(),
      setFloating: vi.fn(),
      floating: { current: null },
    },
    floatingStyles: { position: 'absolute', top: '0px', left: '0px' },
    middlewareData: {},
    placement: 'bottom',
    context: {},
    update: mockUpdate,
  })),
  offset: vi.fn(() => ({})),
  flip: vi.fn(() => ({})),
  shift: vi.fn(() => ({})),
  autoPlacement: vi.fn(() => ({})),
  autoUpdate: vi.fn(),
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function defaultProps() {
  return {
    anchor: null,
    title: '設定店家資料',
    body: '請先填寫您的店家基本資料。',
    nextLabel: '下一步',
    onNext: vi.fn(),
    onSkip: vi.fn(),
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('StepPopover — visualViewport resize handling', () => {
  let originalVisualViewport: VisualViewport | null

  beforeEach(() => {
    vi.clearAllMocks()
    originalVisualViewport = window.visualViewport ?? null
  })

  afterEach(() => {
    // Restore
    Object.defineProperty(window, 'visualViewport', {
      value: originalVisualViewport,
      writable: true,
      configurable: true,
    })
  })

  it('subscribes to visualViewport resize when available', () => {
    const mockAddEventListener = vi.fn()
    const mockRemoveEventListener = vi.fn()

    Object.defineProperty(window, 'visualViewport', {
      value: {
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        height: 800,
        width: 1024,
      },
      writable: true,
      configurable: true,
    })

    render(<StepPopover {...defaultProps()} />)

    expect(mockAddEventListener).toHaveBeenCalledWith(
      'resize',
      expect.any(Function),
    )
  })

  it('calls update() when visualViewport fires a resize event', () => {
    let capturedHandler: (() => void) | undefined

    Object.defineProperty(window, 'visualViewport', {
      value: {
        addEventListener: (_event: string, handler: () => void) => {
          capturedHandler = handler
        },
        removeEventListener: vi.fn(),
        height: 800,
        width: 1024,
      },
      writable: true,
      configurable: true,
    })

    const anchor = document.createElement('button')
    document.body.appendChild(anchor)

    render(<StepPopover {...defaultProps()} anchor={anchor} />)

    expect(capturedHandler).toBeDefined()
    act(() => {
      capturedHandler?.()
    })

    expect(mockUpdate).toHaveBeenCalled()

    document.body.removeChild(anchor)
  })

  it('removes the resize listener on unmount', () => {
    const mockRemoveEventListener = vi.fn()
    let capturedHandler: (() => void) | undefined

    Object.defineProperty(window, 'visualViewport', {
      value: {
        addEventListener: (_event: string, handler: () => void) => {
          capturedHandler = handler
        },
        removeEventListener: mockRemoveEventListener,
        height: 800,
        width: 1024,
      },
      writable: true,
      configurable: true,
    })

    const { unmount } = render(<StepPopover {...defaultProps()} />)
    unmount()

    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      'resize',
      capturedHandler,
    )
  })

  it('does not throw when visualViewport is unavailable', () => {
    Object.defineProperty(window, 'visualViewport', {
      value: null,
      writable: true,
      configurable: true,
    })

    expect(() => render(<StepPopover {...defaultProps()} />)).not.toThrow()
  })

  it('caps maxHeight to visualViewport.height - 32 when available', () => {
    Object.defineProperty(window, 'visualViewport', {
      value: {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        height: 500,
        width: 1024,
      },
      writable: true,
      configurable: true,
    })

    const { container } = render(<StepPopover {...defaultProps()} />)
    const popover = container.querySelector('.tutorial-popover') as HTMLElement
    expect(popover).toBeTruthy()
    // maxHeight should be 500 - 32 = 468px
    expect(popover.style.maxHeight).toBe('468px')
  })
})
