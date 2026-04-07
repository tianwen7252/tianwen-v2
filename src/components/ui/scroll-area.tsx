import {
  useRef,
  // useState,
  // useEffect,
  // useCallback,
  useImperativeHandle,
  forwardRef,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/cn'
// import { isIPad } from '@/lib/platform'

export interface ScrollAreaHandle {
  scrollTo: (options: ScrollToOptions) => void
  readonly el: HTMLDivElement | null
}

interface ScrollAreaProps {
  readonly children: ReactNode
  readonly className?: string
  /** Additional deps that should trigger scrollbar recalculation */
  readonly watchDeps?: readonly unknown[]
}

/**
 * Scroll container with a custom scrollbar thumb visible on iPad.
 * On desktop browsers the native scrollbar is used instead.
 * Use ref to access scrollTo() for programmatic scrolling.
 *
 * NOTE: Custom iPad scrollbar is temporarily disabled.
 */
export const ScrollArea = forwardRef<ScrollAreaHandle, ScrollAreaProps>(
  function ScrollArea({ children, className /* , watchDeps = [] */ }, ref) {
    const scrollRef = useRef<HTMLDivElement>(null)
    // const [thumbTop, setThumbTop] = useState(0)
    // const [thumbHeight, setThumbHeight] = useState(0)
    // const [visible, setVisible] = useState(false)

    useImperativeHandle(ref, () => ({
      scrollTo: (options: ScrollToOptions) =>
        scrollRef.current?.scrollTo(options),
      get el() {
        return scrollRef.current
      },
    }))

    // const update = useCallback(() => {
    //   const el = scrollRef.current
    //   if (!el) return
    //   const { scrollTop, scrollHeight, clientHeight } = el
    //   const canScroll = scrollHeight > clientHeight
    //   setVisible(isIPad() && canScroll)
    //   if (canScroll) {
    //     const ratio = clientHeight / scrollHeight
    //     setThumbHeight(Math.max(ratio * clientHeight, 24))
    //     setThumbTop((scrollTop / scrollHeight) * clientHeight)
    //   }
    // }, [])

    // useEffect(() => {
    //   const el = scrollRef.current
    //   if (!el) return
    //   update()
    //   el.addEventListener('scroll', update, { passive: true })
    //   return () => el.removeEventListener('scroll', update)
    //   // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [update, ...watchDeps])

    return (
      <div className={cn('relative', className)}>
        <div ref={scrollRef} className="absolute inset-0 overflow-y-auto">
          {children}
        </div>
        {/* Custom iPad scrollbar — temporarily disabled
        {visible && (
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-1.5">
            <div
              className="absolute right-0 w-1 rounded-full bg-border"
              style={{ top: thumbTop, height: thumbHeight }}
            />
          </div>
        )}
        */}
      </div>
    )
  },
)
