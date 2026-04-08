import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { RippleButton } from '@/components/ui/ripple-button'
import { InitCanvas } from './init-canvas'

interface InitOverlayProps {
  /** Custom message to display (defaults to i18n init.loading) */
  readonly message?: string
  /** Callback to close the overlay (shows back button when provided) */
  readonly onClose?: () => void
}

export function InitOverlay({ message, onClose }: InitOverlayProps) {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-40 overflow-hidden">
      {/* Canvas animation background — fills entire viewport */}
      <InitCanvas className="absolute inset-0" />

      {/* Back button — only when onClose is provided */}
      {onClose && (
        <RippleButton
          onClick={onClose}
          className="absolute top-16 left-4 z-50 flex size-10 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-sm hover:bg-white/20"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </RippleButton>
      )}

      {/* Centered loading card */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="flex flex-col items-center gap-4 rounded-2xl px-10 py-8 backdrop-blur-md"
          style={{ backgroundColor: '#ffffff05' }}
        >
          <Spinner
            data-testid="init-spinner"
            className="size-8 text-white/80"
          />
          <p className="text-lg tracking-wide text-white/90">
            {message ?? t('init.loading')}
          </p>
        </div>
      </div>
    </div>
  )
}
