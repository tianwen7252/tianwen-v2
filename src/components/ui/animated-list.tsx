/**
 * AnimatedList — staggers child elements in with a CSS opacity/translate animation.
 * Each item fades up with an increasing delay based on its index.
 * Uses pure CSS + inline animationDelay — no framer-motion dependency.
 */

import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnimatedListProps {
  /** Child elements to render with stagger animation. */
  children: ReactNode[]
  /** Extra classes on the outer wrapper. */
  className?: string
  /** Stagger delay in ms between each item. Defaults to 100. */
  delay?: number
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Wraps each child in a div that animates in with a staggered delay.
 * The animation is defined via a global keyframe — callers must ensure
 * `@keyframes animated-list-item` is available in the CSS context.
 */
export function AnimatedList({
  children,
  className,
  delay = 100,
}: AnimatedListProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      {children.map((child, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: index is the only stable key here since children are positional
          key={index}
          style={{
            animationDelay: `${index * delay}ms`,
            animationFillMode: 'both',
            animationDuration: '300ms',
            animationName: 'animated-list-item',
            animationTimingFunction: 'ease-out',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}
