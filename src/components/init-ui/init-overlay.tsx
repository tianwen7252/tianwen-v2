import { useTranslation } from 'react-i18next'
import { Spinner } from '@/components/ui/spinner'
import { InitCanvas } from './init-canvas'

export function InitOverlay() {
  const { t } = useTranslation()

  return (
    <div
      className="relative overflow-hidden"
      style={{ height: 'calc(100vh - 52px)' }}
    >
      {/* Canvas animation background */}
      <InitCanvas className="absolute inset-0" />

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
            {t('init.loading')}
          </p>
        </div>
      </div>
    </div>
  )
}
