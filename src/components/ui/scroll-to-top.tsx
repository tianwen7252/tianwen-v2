import { useState, useEffect, useCallback } from 'react'
import { ArrowUp } from 'lucide-react'
import { RippleButton } from '@/components/ui/ripple-button'
import { cn } from '@/lib/cn'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScrollToTopProps {
  /** Scroll threshold in px before button appears (default: 200) */
  readonly threshold?: number
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Floating scroll-to-top button.
 * Appears with fade-in when scrolled past threshold, fades out when near top.
 * Uses smooth scrolling behavior.
 */
export function ScrollToTop({ threshold = 200 }: ScrollToTopProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > threshold)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <RippleButton
      data-testid="scroll-to-top"
      aria-label="Scroll to top"
      rippleColor="rgba(0,0,0,0.1)"
      className={cn(
        'fixed bottom-6 right-6 z-40 flex size-10 items-center justify-center rounded-full border border-[#eee] bg-white/70 text-muted-foreground shadow-md transition-opacity duration-300 hover:text-foreground',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
      style={{
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
      onClick={scrollToTop}
    >
      <ArrowUp size={20} />
    </RippleButton>
  )
}
