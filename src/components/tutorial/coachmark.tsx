import './tutorial.css'
import type { ReactElement } from 'react'
import { useCoachmarkDismiss } from '@/hooks/use-coachmark-dismiss'
import { RippleButton } from '@/components/ui/ripple-button'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CoachmarkProps {
  /** Unique id for dismiss persistence. */
  readonly id: string
  /** Optional click handler — invoked in addition to dismiss. */
  readonly onClick?: () => void
  /** Accessible label. Defaults to a generic hint if omitted. */
  readonly ariaLabel?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Pulsing coachmark dot that draws attention to a feature.
 *
 * Renders an absolutely-positioned button with the `tutorial-pulse-dot` CSS
 * class. The caller must ensure the nearest positioned ancestor (i.e. the row
 * or container that wraps this coachmark) has `position: relative` so the dot
 * anchors correctly.
 *
 * Disappears permanently once dismissed — dismissal is persisted in the
 * tutorial store (backed by localStorage) so it survives page reloads.
 *
 * Motion is disabled automatically for users who prefer reduced motion via the
 * global `tutorial.css` `@media (prefers-reduced-motion: reduce)` rule.
 */
export function Coachmark({
  id,
  onClick,
  ariaLabel = '功能提示',
}: CoachmarkProps): ReactElement | null {
  const { dismissed, dismiss } = useCoachmarkDismiss(id)

  if (dismissed) return null

  const handleClick = () => {
    dismiss()
    onClick?.()
  }

  return (
    <RippleButton
      aria-label={ariaLabel}
      rippleColor="rgba(255,255,255,0.4)"
      onClick={handleClick}
      className={[
        'tutorial-pulse-dot',
        // Position: absolute top-right; caller must have position:relative
        'absolute top-1 right-1',
        // Size and shape
        'h-5 w-5 rounded-full',
        // Color — uses the primary CSS custom property
        'bg-[var(--color-primary)]',
        // Remove default button chrome
        'border-0 p-0 cursor-pointer',
        // Ensure ripple overflow is clipped within the circle
        'overflow-hidden',
      ].join(' ')}
    />
  )
}
