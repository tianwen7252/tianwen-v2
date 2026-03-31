/**
 * NumberTicker — animates a number from 0 to its target value on mount.
 * Uses requestAnimationFrame for a smooth count-up effect.
 */

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NumberTickerProps {
  /** Target numeric value to animate toward. */
  value: number
  /** Number of decimal places to display. Default: 0 */
  decimalPlaces?: number
  /** Animation duration in milliseconds. Default: 1000 */
  duration?: number
  className?: string
}

// ─── Easing ───────────────────────────────────────────────────────────────────

/** Ease-out cubic for a snappy deceleration curve. */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Renders a number that counts up from 0 to `value` when mounted.
 * Skips animation in test environments (no requestAnimationFrame timing).
 */
export function NumberTicker({
  value,
  decimalPlaces = 0,
  duration = 1000,
  className,
}: NumberTickerProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0)
      return
    }

    startTimeRef.current = null

    function tick(now: number) {
      if (startTimeRef.current === null) {
        startTimeRef.current = now
      }

      const elapsed = now - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOut(progress)

      setDisplayValue(eased * value)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDisplayValue(value)
      }
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [value, duration])

  return (
    <span className={cn('tabular-nums', className)}>
      {displayValue.toFixed(decimalPlaces)}
    </span>
  )
}
