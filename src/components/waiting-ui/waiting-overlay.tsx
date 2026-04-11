import { createPortal } from 'react-dom'
import { ArrowLeft } from 'lucide-react'
import { RippleButton } from '@/components/ui/ripple-button'
import { useRegisterOverlay } from '@/hooks/use-register-overlay'
import { WaitingCanvas } from './waiting-canvas'

// ─── Types ───────────────────────────────────────────────────────────────────

interface WaitingOverlayProps {
  /** Title displayed below the vortex center */
  readonly title: string
  /** Description displayed below the title */
  readonly message: string
  /** Callback to close the overlay (shows back button when provided) */
  readonly onClose?: () => void
}

// ─── Component ──────────────────────────────────────────────────────────────

/** Full-screen waiting overlay with Vortex animation background */
export function WaitingOverlay({
  title,
  message,
  onClose,
}: WaitingOverlayProps) {
  useRegisterOverlay('waiting')

  // Render via portal directly under <body>. See the note in
  // InitOverlay for why this is necessary to escape ancestor
  // containing blocks (transform / backdrop-filter / filter / ...).
  const overlay = (
    <div className="fixed inset-0 z-30 overflow-hidden">
      {/* WebGL animation background */}
      <WaitingCanvas className="absolute inset-0" />

      {/* Back button — dev mode only */}
      {import.meta.env.DEV && onClose && (
        <RippleButton
          onClick={onClose}
          className="absolute top-16 left-4 z-50 flex size-10 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-sm hover:bg-white/20"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </RippleButton>
      )}

      {/* Centered text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <h1
          style={{
            fontSize: '3rem',
            letterSpacing: '8px',
            color: 'color-mix(in oklab, var(--color-white) 80%, transparent)',
            textShadow: '0 0 15px #ffe0aa',
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: '1.5rem',
            letterSpacing: '4px',
            color: 'color-mix(in oklab, var(--color-white) 80%, transparent)',
          }}
          className="mt-3"
        >
          {message}
        </p>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return overlay
  return createPortal(overlay, document.body)
}
