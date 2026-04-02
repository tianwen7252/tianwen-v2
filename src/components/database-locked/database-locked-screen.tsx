import { useTranslation } from 'react-i18next'
import { ShieldAlert } from 'lucide-react'

/**
 * Full-screen blocking UI shown when the OPFS database is already
 * locked by another browser tab (opfs-sahpool exclusive lock).
 */
export function DatabaseLockedScreen() {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex max-w-md flex-col items-center gap-6 px-8 text-center">
        {/* Icon container with subtle glow */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-(--color-gold)/10">
          <ShieldAlert className="h-10 w-10 text-(--color-gold)" strokeWidth={1.5} />
        </div>

        {/* Message */}
        <p className="text-base leading-relaxed text-muted-foreground">
          {t('error.databaseLocked')}
        </p>
      </div>
    </div>
  )
}
