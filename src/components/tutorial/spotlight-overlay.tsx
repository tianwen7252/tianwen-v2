import './tutorial.css'
import { useId } from 'react'
import type { AnchorRect } from '@/hooks/use-anchor-rect'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SpotlightOverlayProps {
  /** Target bounding rect to highlight; null = centered (no cutout). */
  readonly rect: AnchorRect | null
  /** Extra padding around the cutout in px (default: 8). */
  readonly padding?: number
  /** Border radius of the cutout in px (default: 8). */
  readonly radius?: number
  /** Click handler for the dimmed area (used to close / abort). */
  readonly onOverlayClick?: () => void
  /**
   * If true, the entire overlay has `pointer-events: none` so taps fully
   * pass through to whatever sits beneath. When true, `onOverlayClick`
   * becomes unreachable — that is intentional: an "interactive step" means
   * the user is expected to interact with the target, not dismiss the tour
   * by tapping elsewhere.
   */
  readonly allowInteraction?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Full-viewport fixed overlay that dims the page while cutting out a spotlight
 * around the provided target rect. When rect is null, renders a plain dimmed
 * overlay with no cutout (centered/modal mode).
 *
 * z-index: 60 — intentionally sits above the app header (z-50) AND above
 * the app modals (z-50 used by src/components/modal/modal.tsx). When a tour
 * is running it is expected to shade everything else, including any modal
 * that was left open. The runner (Story 3) is responsible for ensuring that
 * does not clash with the user's flow.
 */
export function SpotlightOverlay({
  rect,
  padding = 8,
  radius = 8,
  onOverlayClick,
  allowInteraction = false,
}: SpotlightOverlayProps) {
  const maskId = `tutorial-spotlight-mask-${useId()}`

  function fireOverlayClick() {
    onOverlayClick?.()
  }

  return (
    <div
      className="tutorial-spotlight-overlay fixed inset-0 z-[60]"
      // When allowInteraction is true, taps pass through the whole overlay
      // (no onOverlayClick possible). Otherwise the overlay captures clicks.
      style={allowInteraction ? { pointerEvents: 'none' } : undefined}
    >
      {rect ? (
        <SvgMask
          rect={rect}
          padding={padding}
          radius={radius}
          maskId={maskId}
          onClick={allowInteraction ? undefined : fireOverlayClick}
        />
      ) : (
        // Plain dimmed overlay — no cutout. Clickable when !allowInteraction.
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(0, 0, 0, 0.6)' }}
          onClick={allowInteraction ? undefined : fireOverlayClick}
        />
      )}
    </div>
  )
}

// ─── SVG mask ─────────────────────────────────────────────────────────────────

interface SvgMaskProps {
  readonly rect: AnchorRect
  readonly padding: number
  readonly radius: number
  readonly maskId: string
  readonly onClick?: () => void
}

/**
 * Full-screen SVG that uses a mask to dim everything except the target area.
 * A white background fills the mask; a black rounded-rect punches out the
 * cutout so the element beneath shows through.
 *
 * Cutout coordinates are clamped to the visible viewport so off-screen or
 * edge-adjacent targets still render a valid cutout instead of a fully black
 * overlay.
 */
function SvgMask({ rect, padding, radius, maskId, onClick }: SvgMaskProps) {
  const viewportW =
    typeof window !== 'undefined' ? window.innerWidth : rect.right + padding
  const viewportH =
    typeof window !== 'undefined' ? window.innerHeight : rect.bottom + padding

  const rawX = rect.left - padding
  const rawY = rect.top - padding
  const rawW = rect.width + padding * 2
  const rawH = rect.height + padding * 2

  // Clamp so no part of the cutout is positioned outside the viewport.
  const cutoutX = Math.max(0, rawX)
  const cutoutY = Math.max(0, rawY)
  const cutoutW = Math.max(0, Math.min(rawX + rawW, viewportW) - cutoutX)
  const cutoutH = Math.max(0, Math.min(rawY + rawH, viewportH) - cutoutY)

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      style={{ display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
    >
      <defs>
        <mask id={maskId}>
          {/* White background — everything is visible through the mask */}
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          {/* Black rect — this area is cut out (transparent) */}
          <rect
            data-testid="spotlight-cutout"
            x={cutoutX}
            y={cutoutY}
            width={cutoutW}
            height={cutoutH}
            rx={radius}
            ry={radius}
            fill="black"
          />
        </mask>
      </defs>
      {/* Semi-transparent overlay rendered through the mask */}
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="rgba(0, 0, 0, 0.6)"
        mask={`url(#${maskId})`}
      />
    </svg>
  )
}
