import * as React from 'react'
import { useCallback, useRef } from 'react'
import type { MouseEvent } from 'react'
import { cn } from '@/lib/cn'

// ─── Types ───────────────────────────────────────────────────────────────────

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Ripple fill color (CSS color string). Defaults to semi-transparent white. */
  rippleColor?: string
  /** Ripple animation duration in ms. */
  duration?: number
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Magic UI-style button that creates a radial ripple at the tap/click position.
 * Drop-in replacement for <button> — accepts all standard button attributes.
 * Supports ref forwarding for use with Radix UI asChild patterns.
 */
export const RippleButton = React.forwardRef<
  HTMLButtonElement,
  RippleButtonProps
>(function RippleButton(
  {
    className,
    children,
    rippleColor = 'rgba(255, 255, 255, 0.4)',
    duration = 600,
    onClick,
    ...props
  },
  ref,
) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Expose the internal DOM ref through the forwarded ref
  React.useImperativeHandle(ref, () => buttonRef.current!, [])

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const button = buttonRef.current
      if (!button) return

      const diameter = Math.max(button.clientWidth, button.clientHeight)
      const radius = diameter / 2
      const rect = button.getBoundingClientRect()

      const circle = document.createElement('span')
      circle.style.cssText = [
        'position:absolute',
        'border-radius:50%',
        `width:${diameter}px`,
        `height:${diameter}px`,
        `left:${event.clientX - rect.left - radius}px`,
        `top:${event.clientY - rect.top - radius}px`,
        `background:${rippleColor}`,
        'transform:scale(0)',
        `animation:ripple-anim ${duration}ms linear`,
        'pointer-events:none',
      ].join(';')

      // Remove any leftover ripple from a previous rapid click
      button.querySelector('.btn-ripple')?.remove()
      circle.classList.add('btn-ripple')
      button.appendChild(circle)

      // Clean up after animation completes
      setTimeout(() => circle.remove(), duration + 100)

      onClick?.(event)
    },
    [onClick, rippleColor, duration],
  )

  return (
    <button
      ref={buttonRef}
      type="button"
      className={cn('relative overflow-hidden', className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
})
