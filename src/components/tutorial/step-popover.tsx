import './tutorial.css'
import { useEffect, useState, type CSSProperties } from 'react'
import {
  useFloating,
  offset,
  flip,
  shift,
  autoPlacement,
  autoUpdate,
  type Middleware,
  type Placement,
} from '@floating-ui/react'
import { cn } from '@/lib/cn'
import { RippleButton } from '@/components/ui/ripple-button'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StepPopoverProps {
  /** Anchor element; null = centered on viewport. */
  readonly anchor: Element | null
  /** Placement preference. Default: 'auto'. */
  readonly placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  /** Heading text (pre-translated). */
  readonly title: string
  /** Body text (pre-translated). */
  readonly body: string
  /** Step progress indicator, e.g. "2 / 5". */
  readonly progress?: string
  /** Show the previous-step button (disabled on first step). */
  readonly showPrev?: boolean
  /** "下一步" label — e.g. "下一步" or "完成" on the last step. */
  readonly nextLabel: string
  /** "跳過教學" label (defaults to the zh-TW default for convenience). */
  readonly skipLabel?: string
  /** Previous-step label (defaults to the zh-TW default for convenience). */
  readonly prevLabel?: string
  /** Handlers — caller decides the actions. */
  readonly onPrev?: () => void
  readonly onNext: () => void
  readonly onSkip: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Step popover rendered via Floating UI when an anchor element is available,
 * or centered on the viewport when anchor is null.
 *
 * z-index: 61 — sits above the spotlight overlay (z-[60]).
 *
 * This component is intentionally pure: all strings are passed in pre-translated
 * so that it can be tested and reused without i18n context. Focus trap and
 * Escape-to-abort are the TutorialRunner's responsibility (Story V2-241), not
 * this popover's — we deliberately keep it a dumb presentational element.
 */
export function StepPopover({
  anchor,
  placement = 'auto',
  title,
  body,
  progress,
  showPrev = false,
  nextLabel,
  skipLabel = '跳過教學',
  prevLabel = '上一步',
  onPrev,
  onNext,
  onSkip,
}: StepPopoverProps) {
  // For 'auto', delegate placement choice to autoPlacement() middleware so
  // the popover picks the best side dynamically. For explicit placements,
  // pass them through directly and use flip() as a fallback.
  const middleware: Middleware[] =
    placement === 'auto'
      ? [offset(12), autoPlacement(), shift({ padding: 16 })]
      : [offset(12), flip(), shift({ padding: 16 })]

  const { refs, floatingStyles, update } = useFloating({
    placement: placement === 'auto' ? undefined : (placement as Placement),
    whileElementsMounted: autoUpdate,
    middleware,
    elements: {
      reference: anchor as Element | null,
    },
  })

  // Track visualViewport height so we can cap the popover maxHeight and
  // re-run Floating UI positioning when the iPad soft keyboard appears/disappears.
  const [viewportHeight, setViewportHeight] = useState<number | null>(
    () => window.visualViewport?.height ?? null,
  )

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const handler = () => {
      setViewportHeight(vv.height)
      update()
    }

    vv.addEventListener('resize', handler)
    return () => {
      vv.removeEventListener('resize', handler)
    }
  }, [update])

  const isCentered = anchor === null

  // Cap the popover height so it stays on-screen when the soft keyboard shrinks
  // the visible area. Subtract 32px for a comfortable breathing margin.
  const maxHeightStyle: CSSProperties =
    viewportHeight !== null ? { maxHeight: `${viewportHeight - 32}px` } : {}

  return (
    <div
      ref={refs.setFloating}
      role="dialog"
      aria-label={title}
      tabIndex={-1}
      className={cn(
        'tutorial-popover z-[61] max-w-[360px] rounded-xl border shadow-lg',
        'bg-popover text-popover-foreground overflow-y-auto p-5',
        isCentered
          ? 'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
          : 'absolute',
      )}
      style={
        isCentered ? maxHeightStyle : { ...floatingStyles, ...maxHeightStyle }
      }
    >
      {/* Progress */}
      {progress && (
        <p className="text-muted-foreground mb-2 text-base">{progress}</p>
      )}

      {/* Title */}
      <h2 className="mb-2 text-base">{title}</h2>

      {/* Body */}
      <p className="text-muted-foreground mb-5 text-base">{body}</p>

      {/* Footer buttons */}
      <div className="flex items-center justify-between gap-2">
        {/* Skip */}
        <RippleButton
          className="text-muted-foreground min-h-[44px] rounded-lg px-3 text-base"
          rippleColor="rgba(0,0,0,0.08)"
          onClick={onSkip}
        >
          {skipLabel}
        </RippleButton>

        <div className="flex gap-2">
          {/* Prev */}
          {showPrev && (
            <RippleButton
              className="bg-secondary text-secondary-foreground min-h-[44px] rounded-lg px-4 text-base"
              rippleColor="rgba(0,0,0,0.08)"
              onClick={onPrev}
            >
              {prevLabel}
            </RippleButton>
          )}

          {/* Next */}
          <RippleButton
            className="bg-primary text-primary-foreground min-h-[44px] rounded-lg px-4 text-base"
            rippleColor="rgba(255,255,255,0.3)"
            onClick={onNext}
          >
            {nextLabel}
          </RippleButton>
        </div>
      </div>
    </div>
  )
}
