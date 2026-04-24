import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { SpotlightOverlay } from './spotlight-overlay'
import type { AnchorRect } from '@/hooks/use-anchor-rect'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRect(overrides: Partial<AnchorRect> = {}): AnchorRect {
  return {
    x: 100,
    y: 200,
    width: 150,
    height: 60,
    top: 200,
    left: 100,
    right: 250,
    bottom: 260,
    ...overrides,
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SpotlightOverlay', () => {
  it('renders a centered overlay when rect is null', () => {
    const { container } = render(<SpotlightOverlay rect={null} />)
    const overlay = container.firstChild as HTMLElement
    expect(overlay).toBeTruthy()
    // No SVG when rect is null
    expect(container.querySelector('svg')).toBeNull()
  })

  it('renders an SVG mask when rect is provided', () => {
    const rect = makeRect()
    const { container } = render(<SpotlightOverlay rect={rect} />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('applies the tutorial-spotlight-overlay CSS class for animation', () => {
    const { container } = render(<SpotlightOverlay rect={null} />)
    const overlay = container.firstChild as HTMLElement
    expect(overlay.className).toContain('tutorial-spotlight-overlay')
  })

  it('encodes rect coordinates into SVG mask', () => {
    const rect = makeRect({ left: 100, top: 200, width: 150, height: 60 })
    const { container } = render(
      <SpotlightOverlay rect={rect} padding={0} radius={0} />,
    )
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()

    // The cutout rect should be identifiable
    const cutout = container.querySelector('[data-testid="spotlight-cutout"]')
    expect(cutout).toBeTruthy()
  })

  it('applies custom padding around the cutout', () => {
    const rect = makeRect({ left: 100, top: 200, width: 150, height: 60 })
    const { container: c1 } = render(
      <SpotlightOverlay rect={rect} padding={0} />,
    )
    const { container: c2 } = render(
      <SpotlightOverlay rect={rect} padding={20} />,
    )

    // With padding=20 the cutout rect x should be 80 (100 - 20)
    const cutout1 = c1.querySelector('[data-testid="spotlight-cutout"]')
    const cutout2 = c2.querySelector('[data-testid="spotlight-cutout"]')

    const x1 = parseFloat(cutout1?.getAttribute('x') ?? '0')
    const x2 = parseFloat(cutout2?.getAttribute('x') ?? '0')

    expect(x2).toBeLessThan(x1) // More padding = smaller x (shifted left)
    expect(x2).toBe(x1 - 20)
  })

  it('applies custom border radius to the cutout', () => {
    const rect = makeRect()
    const { container } = render(<SpotlightOverlay rect={rect} radius={16} />)
    const cutout = container.querySelector('[data-testid="spotlight-cutout"]')
    expect(parseFloat(cutout?.getAttribute('rx') ?? '0')).toBe(16)
  })

  it('calls onOverlayClick when the plain dimmed overlay is clicked', () => {
    const handler = vi.fn()
    const { container } = render(
      <SpotlightOverlay rect={null} onOverlayClick={handler} />,
    )
    // rect=null branch renders a plain dim div; clicking it fires the handler.
    const dim = container.querySelector('[style*="rgba(0, 0, 0, 0.6)"]')
    expect(dim).toBeTruthy()
    fireEvent.click(dim as HTMLElement)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('calls onOverlayClick when the SVG dim region is clicked', () => {
    const handler = vi.fn()
    const rect = makeRect()
    const { container } = render(
      <SpotlightOverlay rect={rect} onOverlayClick={handler} />,
    )
    const svg = container.querySelector('svg')
    fireEvent.click(svg as SVGElement)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('sets pointer-events none on the root overlay when allowInteraction is true', () => {
    const rect = makeRect()
    const { container } = render(
      <SpotlightOverlay rect={rect} allowInteraction={true} />,
    )
    const overlay = container.firstChild as HTMLElement
    expect(overlay.style.pointerEvents).toBe('none')
  })

  it('does not fire onOverlayClick when allowInteraction is true', () => {
    const handler = vi.fn()
    const rect = makeRect()
    const { container } = render(
      <SpotlightOverlay
        rect={rect}
        onOverlayClick={handler}
        allowInteraction={true}
      />,
    )
    const svg = container.querySelector('svg')
    fireEvent.click(svg as SVGElement)
    // When allowInteraction is on, no click handler is wired up at all — the
    // overlay has pointer-events: none and cannot be dismissed by tapping.
    expect(handler).not.toHaveBeenCalled()
  })

  it('leaves overlay pointer-events unset when allowInteraction is false', () => {
    const rect = makeRect()
    const { container } = render(
      <SpotlightOverlay rect={rect} allowInteraction={false} />,
    )
    const overlay = container.firstChild as HTMLElement
    expect(overlay.style.pointerEvents).toBe('')
  })

  it('clamps a negative cutout x to 0 when the target is near the left edge', () => {
    const rect = makeRect({ left: 2, width: 50 })
    const { container } = render(
      <SpotlightOverlay rect={rect} padding={8} radius={0} />,
    )
    const cutout = container.querySelector('[data-testid="spotlight-cutout"]')
    // raw x would be 2 - 8 = -6, clamped to 0.
    expect(parseFloat(cutout?.getAttribute('x') ?? '-1')).toBe(0)
  })

  it('clamps cutout width when the target extends past the viewport right edge', () => {
    // Force window.innerWidth so the clamp is deterministic.
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 400,
    })
    const rect = makeRect({ left: 380, width: 200 }) // right edge = 580, beyond viewport
    const { container } = render(
      <SpotlightOverlay rect={rect} padding={0} radius={0} />,
    )
    const cutout = container.querySelector('[data-testid="spotlight-cutout"]')
    const x = parseFloat(cutout?.getAttribute('x') ?? '0')
    const w = parseFloat(cutout?.getAttribute('width') ?? '0')
    expect(x + w).toBeLessThanOrEqual(400)
  })

  it('generates unique mask ids per instance to avoid collisions', () => {
    const rect = makeRect()
    const { container: a } = render(<SpotlightOverlay rect={rect} />)
    const { container: b } = render(<SpotlightOverlay rect={rect} />)
    const maskA = a.querySelector('mask')?.getAttribute('id')
    const maskB = b.querySelector('mask')?.getAttribute('id')
    expect(maskA).toBeTruthy()
    expect(maskB).toBeTruthy()
    expect(maskA).not.toBe(maskB)
  })

  it('uses default padding of 8 when not specified', () => {
    const rect = makeRect({ left: 100, top: 200, width: 150, height: 60 })
    const { container } = render(<SpotlightOverlay rect={rect} />)
    const cutout = container.querySelector('[data-testid="spotlight-cutout"]')
    // Default padding 8 => x = 100 - 8 = 92
    expect(parseFloat(cutout?.getAttribute('x') ?? '0')).toBe(92)
  })

  it('uses default radius of 8 when not specified', () => {
    const rect = makeRect()
    const { container } = render(<SpotlightOverlay rect={rect} />)
    const cutout = container.querySelector('[data-testid="spotlight-cutout"]')
    expect(parseFloat(cutout?.getAttribute('rx') ?? '0')).toBe(8)
  })
})
