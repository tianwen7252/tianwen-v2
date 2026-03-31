/**
 * NeonGradientCard — card with animated neon glow border effect.
 * Inspired by Magic UI's NeonGradientCard pattern.
 */

import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NeonGradientCardProps {
  children: ReactNode
  className?: string
  /** Extra classes applied to the inner content surface (overrides default p-4). */
  innerClassName?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Wraps children in a card with an animated neon gradient border glow.
 */
export function NeonGradientCard({
  children,
  className,
  innerClassName,
}: NeonGradientCardProps) {
  return (
    <div
      data-testid="neon-gradient-card"
      className={cn(
        'relative rounded-xl p-[2px]',
        'bg-linear-to-r from-violet-500 via-fuchsia-500 to-pink-500',
        'motion-safe:animate-neon-pulse',
        className,
      )}
    >
      {/* Inner card surface */}
      <div
        className={cn(
          'relative rounded-[10px] bg-card p-4 h-full',
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}
