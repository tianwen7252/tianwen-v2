import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { RippleButton } from '@/components/ui/ripple-button'
import { useRegisterOverlay } from '@/hooks/use-register-overlay'
import { ErrorCanvas } from './error-canvas'

// ─── Types ───────────────────────────────────────────────────────────────────

type ErrorType = '404' | 'error'

interface ErrorOverlayProps {
  /** Error type determines title and default message */
  readonly type: ErrorType
  /** Custom message (overrides default for the type) */
  readonly message?: string
  /** Callback to close the overlay (shows back button when provided) */
  readonly onClose?: () => void
}

// ─── Config ─────────────────────────────────────────────────────────────────

const ERROR_CONFIG: Record<ErrorType, { title: string; messageKey: string }> = {
  '404': { title: '404', messageKey: 'error.notFound' },
  error: { title: 'ERROR', messageKey: 'error.title' },
}

// ─── Component ──────────────────────────────────────────────────────────────

/** Full-screen error overlay with Event Horizon animation background */
const LONG_MESSAGE_THRESHOLD = 20

export function ErrorOverlay({ type, message, onClose }: ErrorOverlayProps) {
  const { t } = useTranslation()
  useRegisterOverlay('error')
  const config = ERROR_CONFIG[type]
  const isNumeric = type === '404'
  const displayMessage = message ?? t(config.messageKey)
  const isLongMessage = displayMessage.length > LONG_MESSAGE_THRESHOLD

  // Render via portal directly under <body>. See the note in
  // InitOverlay for the rationale — any ancestor containing-block
  // (transform / backdrop-filter / filter / ...) would otherwise
  // clip the `fixed inset-0` wrapper.
  const overlay = (
    <div className="fixed inset-0 z-30 overflow-hidden">
      {/* WebGL animation background */}
      <ErrorCanvas className="absolute inset-0" />

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

      {/* Centered text — positioned below the black hole center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-120">
        <h1
          style={{
            fontSize: isNumeric ? '5rem' : '4rem',
            letterSpacing: isNumeric ? '15px' : '8px',
            color: '#000000',
            textShadow: '0 0 15px #ffe0aa',
          }}
        >
          {config.title}
        </h1>
        <p
          style={{
            fontSize: isLongMessage ? '1.2rem' : '1.5rem',
            letterSpacing: isLongMessage ? 'normal' : '4px',
            color: 'color-mix(in oklab, var(--color-white) 80%, transparent)',
            textAlign: 'center',
          }}
          className="mt-3 max-w-3xl px-8"
        >
          {displayMessage}
        </p>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return overlay
  return createPortal(overlay, document.body)
}
