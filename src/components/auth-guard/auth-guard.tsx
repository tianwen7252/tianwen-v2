import { useTranslation } from 'react-i18next'
import { useGoogleAuth } from '@/hooks/use-google-auth'

type AuthGuardVariant = 'staffAdmin' | 'backup' | 'productAdmin'

// Translation key mapping for variant-specific subtitles
const SUBTITLE_KEYS: Record<AuthGuardVariant, string> = {
  staffAdmin: 'auth.staffAdminSubtitle',
  backup: 'auth.backupSubtitle',
  productAdmin: 'auth.productAdminSubtitle',
}

interface AuthGuardProps {
  readonly children: React.ReactNode
  readonly variant?: AuthGuardVariant
}

/**
 * Protects content behind admin authentication.
 * Reads auth state from useAppStore (shared with HeaderUserMenu).
 * Shows a 403-style screen when not logged in or not admin.
 */
export function AuthGuard({
  children,
  variant = 'staffAdmin',
}: AuthGuardProps) {
  const { t } = useTranslation()
  const { googleUser, isAdmin } = useGoogleAuth()

  // Not logged in
  if (!googleUser) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-10">
        <div className="text-6xl" aria-hidden="true">
          &#x1F512;
        </div>
        <h2 className="text-2xl text-foreground">{t('auth.title')}</h2>
        <p className="text-muted-foreground">{t(SUBTITLE_KEYS[variant])}</p>
        <p className="text-md text-muted-foreground">
          {t('auth.loginViaHeader')}
        </p>
      </div>
    )
  }

  // Logged in but not admin
  if (!isAdmin) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-10">
        <div className="text-6xl" aria-hidden="true">
          &#x1F6AB;
        </div>
        <h2 className="text-2xl text-foreground">{t('auth.title')}</h2>
        <p className="text-muted-foreground">{t('auth.adminOnly')}</p>
      </div>
    )
  }

  // Authenticated admin — render children directly (no admin bar, header handles it)
  return <>{children}</>
}
