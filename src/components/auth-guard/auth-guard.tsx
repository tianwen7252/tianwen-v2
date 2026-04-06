import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Lock, ShieldOff } from 'lucide-react'
import { useGoogleAuth } from '@/hooks/use-google-auth'
import { isSessionValid } from '@/stores/app-store'

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
 * Shows a 403-style screen when not logged in, session expired, or not admin.
 * When a user has a stale Zustand state but an expired session timestamp,
 * logout() is called to clear the store and the user is shown the lock screen.
 */
export function AuthGuard({
  children,
  variant = 'staffAdmin',
}: AuthGuardProps) {
  const { t } = useTranslation()
  const { googleUser, isAdmin, logout } = useGoogleAuth()

  // Session validity check: googleUser may still be in Zustand store after
  // the session timestamp has expired (e.g. after 7 days or a 401 error).
  const sessionExpired = googleUser !== null && !isSessionValid()

  useEffect(() => {
    if (sessionExpired) {
      logout()
    }
  }, [sessionExpired, logout])

  // Not logged in, or session has expired (treat as not logged in)
  if (!googleUser || sessionExpired) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-10">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-(--color-gold)/10">
          <Lock className="h-10 w-10 text-(--color-gold)" strokeWidth={1.5} />
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
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-(--color-red)/10">
          <ShieldOff className="h-10 w-10 text-(--color-red)" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl text-foreground">{t('auth.title')}</h2>
        <p className="text-muted-foreground">{t('auth.adminOnly')}</p>
      </div>
    )
  }

  // Authenticated admin — render children directly (no admin bar, header handles it)
  return <>{children}</>
}
