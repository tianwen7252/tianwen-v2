import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Mock } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAnchorRect } from './use-anchor-rect'

// ─── ResizeObserver mock setup ────────────────────────────────────────────────

type ResizeObserverMock = { observe: Mock; unobserve: Mock; disconnect: Mock }
let observerInstances: ResizeObserverMock[] = []
let observerCallbacks: ResizeObserverCallback[] = []

beforeEach(() => {
  observerInstances = []
  observerCallbacks = []

  // Must be a real constructor function (not arrow fn) so `new ResizeObserver(cb)` works.
  function MockResizeObserver(
    this: ResizeObserverMock,
    cb: ResizeObserverCallback,
  ) {
    observerCallbacks.push(cb)
    this.observe = vi.fn()
    this.unobserve = vi.fn()
    this.disconnect = vi.fn()
    observerInstances.push(this)
  }

  global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeElement(rectOverrides: Partial<DOMRect> = {}): Element {
  const el = document.createElement('div')
  const rect: DOMRect = {
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    top: 20,
    left: 10,
    right: 110,
    bottom: 70,
    toJSON: () => ({}),
    ...rectOverrides,
  }
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect)
  return el
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useAnchorRect', () => {
  it('returns null when element is null', () => {
    const { result } = renderHook(() => useAnchorRect(null))
    expect(result.current).toBeNull()
  })

  it('returns the rect when a valid element is provided', () => {
    const el = makeElement()
    const { result } = renderHook(() => useAnchorRect(el))

    expect(result.current).not.toBeNull()
    expect(result.current?.x).toBe(10)
    expect(result.current?.y).toBe(20)
    expect(result.current?.width).toBe(100)
    expect(result.current?.height).toBe(50)
    expect(result.current?.top).toBe(20)
    expect(result.current?.left).toBe(10)
    expect(result.current?.right).toBe(110)
    expect(result.current?.bottom).toBe(70)
  })

  it('updates rect when ResizeObserver fires', () => {
    const el = makeElement()
    const { result } = renderHook(() => useAnchorRect(el))

    // Update the mock to return new rect values
    const updatedRect: DOMRect = {
      x: 50,
      y: 60,
      width: 200,
      height: 80,
      top: 60,
      left: 50,
      right: 250,
      bottom: 140,
      toJSON: () => ({}),
    }
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(updatedRect)

    act(() => {
      // Fire the ResizeObserver callback with a fake entry
      const fakeEntry = { target: el } as ResizeObserverEntry
      const fakeObserver = {} as ResizeObserver
      observerCallbacks[0]?.([fakeEntry], fakeObserver)
    })

    expect(result.current?.width).toBe(200)
    expect(result.current?.height).toBe(80)
  })

  it('updates rect on window resize event', () => {
    const el = makeElement()
    const { result } = renderHook(() => useAnchorRect(el))

    const updatedRect: DOMRect = {
      x: 30,
      y: 40,
      width: 150,
      height: 75,
      top: 40,
      left: 30,
      right: 180,
      bottom: 115,
      toJSON: () => ({}),
    }
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(updatedRect)

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    expect(result.current?.width).toBe(150)
    expect(result.current?.left).toBe(30)
  })

  it('updates rect on window scroll event', () => {
    const el = makeElement()
    const { result } = renderHook(() => useAnchorRect(el))

    const updatedRect: DOMRect = {
      x: 10,
      y: 120,
      width: 100,
      height: 50,
      top: 120,
      left: 10,
      right: 110,
      bottom: 170,
      toJSON: () => ({}),
    }
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(updatedRect)

    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })

    expect(result.current?.top).toBe(120)
    expect(result.current?.bottom).toBe(170)
  })

  it('cleans up ResizeObserver and event listeners on unmount', () => {
    const el = makeElement()
    const addEventSpy = vi.spyOn(window, 'addEventListener')
    const removeEventSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useAnchorRect(el))

    // Verify listeners were added
    expect(addEventSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    // scroll is registered passively to keep iPad compositor thread free.
    expect(addEventSpy).toHaveBeenCalledWith('scroll', expect.any(Function), {
      passive: true,
    })

    unmount()

    // Verify listeners were removed
    expect(removeEventSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(removeEventSpy).toHaveBeenCalledWith('scroll', expect.any(Function))

    // Verify ResizeObserver was disconnected
    expect(observerInstances[0]?.disconnect).toHaveBeenCalled()
  })

  it('cleans up and re-observes when element changes', () => {
    const el1 = makeElement({ width: 100 })
    const el2 = makeElement({ width: 200 })

    let element: Element | null = el1
    const { result, rerender } = renderHook(() => useAnchorRect(element))

    expect(result.current?.width).toBe(100)

    // Switch to second element
    element = el2
    rerender()

    expect(result.current?.width).toBe(200)
    // The first instance should have been disconnected
    expect(observerInstances[0]?.disconnect).toHaveBeenCalled()
  })

  it('transitions from element to null and returns null', () => {
    const el = makeElement()
    let element: Element | null = el
    const { result, rerender } = renderHook(() => useAnchorRect(element))

    expect(result.current).not.toBeNull()

    element = null
    rerender()

    expect(result.current).toBeNull()
  })

  it('transitions from null to element and returns rect', () => {
    let element: Element | null = null
    const { result, rerender } = renderHook(() => useAnchorRect(element))

    expect(result.current).toBeNull()

    const el = makeElement({
      x: 5,
      y: 10,
      width: 80,
      height: 40,
      top: 10,
      left: 5,
      right: 85,
      bottom: 50,
    })
    element = el
    rerender()

    expect(result.current?.width).toBe(80)
  })
})
