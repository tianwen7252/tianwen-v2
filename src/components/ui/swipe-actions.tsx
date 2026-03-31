import { useRef, useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/cn'

// Minimum movement (px) to determine swipe direction
const SWIPE_DIRECTION_THRESHOLD = 5

export interface SwipeAction {
  readonly key: string
  readonly icon: React.ReactNode
  readonly color: string
  readonly label?: string
  readonly onClick: () => void
}

export interface SwipeActionsProps {
  readonly actions: readonly SwipeAction[]
  readonly actionWidth?: number
  readonly children: React.ReactNode
  readonly className?: string
  /** When this value changes, close any open swipe actions */
  readonly resetKey?: number
}

/**
 * Swipe-to-reveal actions wrapper for touch devices.
 * Swipe left to reveal action icons; tap an action to execute it.
 * Tapping foreground content while open closes the actions.
 */
export function SwipeActions({
  actions,
  actionWidth = 64,
  children,
  className,
  resetKey,
}: SwipeActionsProps) {
  const [offsetX, setOffsetX] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isSwiping, setIsSwiping] = useState(false)

  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const isHorizontalRef = useRef<boolean | null>(null)
  // Track live offset to avoid stale closure in handleTouchEnd
  const offsetXRef = useRef(0)

  const totalActionWidth = actions.length * actionWidth

  // Close swipe actions when resetKey changes (e.g., clicking empty space on page)
  useEffect(() => {
    offsetXRef.current = 0
    setOffsetX(0)
    setIsOpen(false)
  }, [resetKey])

  // Early return for empty actions — no swipe behavior needed
  if (actions.length === 0) {
    return <div className={cn(className)}>{children}</div>
  }

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    if (!touch) return
    startXRef.current = touch.clientX
    startYRef.current = touch.clientY
    isHorizontalRef.current = null
    setIsSwiping(true)
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isSwiping) return
      const touch = e.touches[0]
      if (!touch) return

      const deltaX = touch.clientX - startXRef.current
      const deltaY = touch.clientY - startYRef.current

      // Determine swipe direction on first significant movement
      if (isHorizontalRef.current === null) {
        if (
          Math.abs(deltaX) > SWIPE_DIRECTION_THRESHOLD ||
          Math.abs(deltaY) > SWIPE_DIRECTION_THRESHOLD
        ) {
          isHorizontalRef.current = Math.abs(deltaX) > Math.abs(deltaY)
        }
        return
      }

      // Only handle horizontal swipe
      if (!isHorizontalRef.current) return

      // Calculate offset based on current state (open or closed)
      const baseOffset = isOpen ? -totalActionWidth : 0
      const rawOffset = baseOffset + deltaX

      // Clamp: no swipe right past 0, no swipe left past total action width
      const clampedOffset = Math.max(-totalActionWidth, Math.min(0, rawOffset))
      offsetXRef.current = clampedOffset
      setOffsetX(clampedOffset)
    },
    [isSwiping, isOpen, totalActionWidth],
  )

  const handleTouchEnd = useCallback(() => {
    setIsSwiping(false)
    isHorizontalRef.current = null

    // Read live offset from ref to avoid stale closure
    const currentOffset = offsetXRef.current
    const halfThreshold = totalActionWidth / 2

    // Snap open if dragged past halfway, otherwise snap closed
    if (Math.abs(currentOffset) >= halfThreshold) {
      offsetXRef.current = -totalActionWidth
      setOffsetX(-totalActionWidth)
      setIsOpen(true)
    } else {
      offsetXRef.current = 0
      setOffsetX(0)
      setIsOpen(false)
    }
  }, [totalActionWidth])

  const handleActionClick = useCallback((action: SwipeAction) => {
    action.onClick()
    offsetXRef.current = 0
    setOffsetX(0)
    setIsOpen(false)
  }, [])

  const handleForegroundClick = useCallback(() => {
    if (isOpen) {
      offsetXRef.current = 0
      setOffsetX(0)
      setIsOpen(false)
    }
  }, [isOpen])

  // Reset handler for interrupted gestures (e.g. incoming call on iPad)
  const handleTouchCancel = useCallback(() => {
    setIsSwiping(false)
    isHorizontalRef.current = null
    // Snap back to previous state
    if (isOpen) {
      offsetXRef.current = -totalActionWidth
      setOffsetX(-totalActionWidth)
    } else {
      offsetXRef.current = 0
      setOffsetX(0)
    }
  }, [isOpen, totalActionWidth])

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      data-testid="swipe-actions"
    >
      {/* Background layer — action buttons revealed on swipe left */}
      {/* Hidden until foreground starts sliding to prevent buttons peeking through */}
      <div
        className={cn(
          'absolute inset-y-0 right-0 flex items-center',
          offsetX >= 0 && !isOpen && 'invisible',
        )}
      >
        {actions.map(action => (
          <div
            key={action.key}
            data-testid={`swipe-action-${action.key}`}
            aria-label={action.label}
            role="button"
            tabIndex={0}
            className="flex items-center justify-center"
            style={{
              width: actionWidth,
              height: '100%',
              backgroundColor: action.color,
            }}
            onClick={() => handleActionClick(action)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleActionClick(action)
              }
            }}
          >
            {action.icon}
          </div>
        ))}
      </div>

      {/* Foreground layer — swipeable content */}
      {/* When swiped open, remove right border-radius for clean alignment with action buttons */}
      <div
        className={cn(
          'relative bg-card h-full',
          !isSwiping && 'transition-transform duration-200',
          (isOpen || offsetX < 0) && '[&>*]:rounded-r-none',
        )}
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onClick={handleForegroundClick}
      >
        {children}
      </div>
    </div>
  )
}
