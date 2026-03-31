/**
 * SlideIn — wrapper component that slides children in from a given direction.
 * Uses CSS animations for GPU-accelerated transform transitions.
 */

type Direction = 'up' | 'down' | 'left' | 'right'

interface SlideInProps extends React.ComponentProps<'div'> {
  /** Slide direction (default: 'up') */
  readonly direction?: Direction
  /** Slide distance in pixels (default: 20) */
  readonly distance?: number
  /** Animation duration in seconds (default: 0.3) */
  readonly duration?: number
  /** Delay before animation starts in seconds (default: 0) */
  readonly delay?: number
  readonly children: React.ReactNode
}

/** Map direction to CSS custom property values for translateX/Y. */
function getTransformValue(direction: Direction, distance: number): string {
  switch (direction) {
    case 'up':
      return `translateY(${distance}px)`
    case 'down':
      return `translateY(${-distance}px)`
    case 'left':
      return `translateX(${distance}px)`
    case 'right':
      return `translateX(${-distance}px)`
  }
}

export function SlideIn({
  children,
  direction = 'up',
  distance = 20,
  duration = 0.3,
  delay = 0,
  className,
  style,
  ...rest
}: SlideInProps) {
  const fromTransform = getTransformValue(direction, distance)

  return (
    <div
      className={className}
      style={
        {
          '--slide-from': fromTransform,
          animation: `slide-in ${duration}s ease-out ${delay}s both`,
          ...style,
        } as React.CSSProperties
      }
      {...rest}
    >
      {children}
    </div>
  )
}
