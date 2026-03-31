import { useRef, useState, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'

interface SwipeToDeleteProps {
  /** Callback when swipe threshold is reached and item should be deleted */
  readonly onDelete: () => void
  /** Minimum swipe distance (px) to trigger delete. Default: 80 */
  readonly threshold?: number
  /** Content to render inside the swipeable area */
  readonly children: React.ReactNode
  /** Additional class for the outer container */
  readonly className?: string
  /** Override foreground background class (default: 'bg-card'). Use 'bg-transparent' inside modals. */
  readonly foregroundClassName?: string
}

/**
 * Swipe-to-delete wrapper component for touch devices.
 * Swipe left to reveal a red delete area; release past threshold to delete.
 * Snaps back if released before threshold.
 */
export function SwipeToDelete({
  onDelete,
  threshold = 80,
  children,
  className,
  foregroundClassName = 'bg-card',
}: SwipeToDeleteProps) {
  const [offsetX, setOffsetX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const isHorizontalRef = useRef<boolean | null>(null)

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
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          isHorizontalRef.current = Math.abs(deltaX) > Math.abs(deltaY)
        }
        return
      }

      // Only handle horizontal swipe
      if (!isHorizontalRef.current) return

      // Only allow swipe left (negative deltaX), clamp to 0
      const clampedOffset = Math.min(0, deltaX)
      setOffsetX(clampedOffset)
    },
    [isSwiping],
  )

  const handleTouchEnd = useCallback(() => {
    setIsSwiping(false)
    isHorizontalRef.current = null

    if (Math.abs(offsetX) >= threshold) {
      // Past threshold — animate off-screen then delete
      setIsDeleting(true)
      setOffsetX(-9999)
      setTimeout(() => {
        onDelete()
      }, 200)
    } else {
      // Snap back
      setOffsetX(0)
    }
  }, [offsetX, threshold, onDelete])

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      data-testid="swipe-to-delete"
    >
      {/* Background layer — red delete zone */}
      <div
        className={cn(
          'absolute inset-y-0 right-0 flex items-center justify-end bg-destructive px-4 text-destructive-foreground',
          offsetX < 0 ? 'visible' : 'invisible',
        )}
        style={{ width: Math.abs(offsetX) }}
      >
        {Math.abs(offsetX) >= threshold && <Trash2 className="size-5" />}
      </div>

      {/* Foreground layer — swipeable content */}
      <div
        className={cn(
          `relative ${foregroundClassName}`,
          !isSwiping && !isDeleting && 'transition-transform duration-200',
        )}
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}
