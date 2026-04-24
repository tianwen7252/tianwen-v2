import { useState, useLayoutEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Immutable snapshot of an element's bounding rect relative to the viewport. */
export interface AnchorRect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly top: number
  readonly left: number
  readonly right: number
  readonly bottom: number
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Tracks the bounding rect of a DOM element in viewport-relative coordinates.
 *
 * Updates when:
 * - The element itself resizes (ResizeObserver)
 * - The viewport resizes (window 'resize' event)
 * - The page scrolls (window 'scroll' event)
 *
 * Returns null when `element` is null.
 *
 * @example
 * ```tsx
 * const rect = useAnchorRect(ref.current)
 * ```
 */
export function useAnchorRect(element: Element | null): AnchorRect | null {
  const [rect, setRect] = useState<AnchorRect | null>(null)

  useLayoutEffect(() => {
    if (!element) {
      setRect(null)
      return
    }

    // Capture the initial rect synchronously
    const capture = () => {
      const r = element.getBoundingClientRect()
      setRect({
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        top: r.top,
        left: r.left,
        right: r.right,
        bottom: r.bottom,
      })
    }

    capture()

    const observer = new ResizeObserver(() => {
      capture()
    })
    observer.observe(element)

    window.addEventListener('resize', capture)
    // Passive scroll listener — we never preventDefault so let the browser
    // keep the compositor thread free on iPad Safari.
    window.addEventListener('scroll', capture, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', capture)
      window.removeEventListener('scroll', capture)
    }
  }, [element])

  return rect
}
