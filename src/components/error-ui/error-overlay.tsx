import { useTranslation } from 'react-i18next'
import { ArrowLeft, FileQuestion, ServerCrash, CircleAlert } from 'lucide-react'
import { RippleButton } from '@/components/ui/ripple-button'
import { ErrorCanvas } from './error-canvas'

// ─── Types ───────────────────────────────────────────────────────────────────

type ErrorType = '404' | '500' | 'error'

interface ErrorOverlayProps {
  /** Error type determines icon, title, and default message */
  readonly type: ErrorType
  /** Custom message (overrides default for the type) */
  readonly message?: string
  /** Callback to close the overlay (shows back button when provided) */
  readonly onClose?: () => void
}

// ─── Config ─────────────────────────────────────────────────────────────────

const ERROR_CONFIG: Record<
  ErrorType,
  { icon: typeof FileQuestion; title: string; messageKey: string }
> = {
  '404': { icon: FileQuestion, title: '404', messageKey: 'error.notFound' },
  '500': { icon: ServerCrash, title: '500', messageKey: 'error.serverError' },
  error: { icon: CircleAlert, title: 'Error', messageKey: 'error.title' },
}

// ─── Component ──────────────────────────────────────────────────────────────

/** Full-screen error overlay with Event Horizon animation background */
export function ErrorOverlay({ type, message, onClose }: ErrorOverlayProps) {
  const { t } = useTranslation()
  const config = ERROR_CONFIG[type]
  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-40 overflow-hidden">
      {/* WebGL animation background */}
      <ErrorCanvas className="absolute inset-0" />

      {/* Back button */}
      {onClose && (
        <RippleButton
          onClick={onClose}
          className="absolute top-16 left-4 z-50 flex size-10 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-sm hover:bg-white/20"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </RippleButton>
      )}

      {/* Centered error card */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="flex flex-col items-center gap-4 rounded-2xl px-10 py-8 backdrop-blur-md"
          style={{ backgroundColor: '#ffffff08' }}
        >
          <div className="flex size-16 items-center justify-center rounded-2xl bg-white/10">
            <Icon className="size-8 text-white/80" strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl tracking-wide text-white/90">
            {config.title}
          </h1>
          <p className="text-lg tracking-wide text-white/60">
            {message ?? t(config.messageKey)}
          </p>
        </div>
      </div>
    </div>
  )
}
