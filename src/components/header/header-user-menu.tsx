/**
 * HeaderUserMenu — Google OAuth login/logout UI for the app header.
 * When logged out: shows UserRound icon, clicking triggers Google Sign-In.
 * When logged in: shows avatar (employee image > Google photo > text initial).
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { UserRound } from 'lucide-react'
import { getEmployeeRepo } from '@/lib/repositories/provider'
import { useGoogleAuth } from '@/hooks/use-google-auth'
import { resolveAvatarSrc } from '@/lib/resolve-avatar-src'
import { ConfirmModal } from '@/components/modal/modal'
import { RippleButton } from '@/components/ui/ripple-button'
import { cn } from '@/lib/cn'

// ─── Component ───────────────────────────────────────────────────────────────

export function HeaderUserMenu() {
  const { t } = useTranslation()
  const { googleUser, isLoggedIn, login, logout } = useGoogleAuth()

  const [logoutModalOpen, setLogoutModalOpen] = useState(false)

  // Fetch employees to check if logged-in user matches an admin employee
  const { data: matchedEmployee } = useQuery({
    queryKey: ['employee-match', googleUser?.email],
    queryFn: async () => {
      const employees = await getEmployeeRepo().findAll()
      return employees.find(
        e => e.status === 'active' && e.name === googleUser?.name,
      )
    },
    enabled: isLoggedIn,
    staleTime: 60_000,
  })

  // Avatar priority: employee avatar > Google picture > text initial
  // Employee avatar is stored as filename-only; resolve to full absolute path before use
  const employeeAvatarSrc = matchedEmployee?.avatar
    ? (() => {
        const resolved = resolveAvatarSrc(matchedEmployee.avatar)
        // Ensure local paths are absolute to avoid nested route resolution issues
        return resolved.startsWith('images/') ? `/${resolved}` : resolved
      })()
    : undefined
  const avatarSrc = employeeAvatarSrc ?? googleUser?.picture
  const displayName = googleUser?.name ?? ''

  function handleLogout() {
    logout()
    setLogoutModalOpen(false)
  }

  return (
    <>
      {/* Trigger button — logged out: UserRound icon, logged in: avatar */}
      {isLoggedIn ? (
        <RippleButton
          data-testid="header-avatar"
          aria-label={t('auth.logout')}
          rippleColor="rgba(0,0,0,0.1)"
          className="flex size-9 items-center justify-center rounded-full overflow-hidden"
          onClick={() => setLogoutModalOpen(true)}
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={displayName}
              className="size-9 rounded-full object-cover w-6 h-6"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-md">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </RippleButton>
      ) : (
        <RippleButton
          data-testid="header-login"
          aria-label={t('auth.loginTitle')}
          rippleColor="rgba(0,0,0,0.1)"
          className={cn(
            'flex size-9 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
            'text-muted-foreground',
          )}
          onClick={login}
        >
          <UserRound size={20} />
        </RippleButton>
      )}

      {/* Logout confirmation modal */}
      <ConfirmModal
        open={logoutModalOpen}
        variant="red"
        title={t('auth.logoutConfirm')}
        onConfirm={handleLogout}
        onCancel={() => setLogoutModalOpen(false)}
      >
        <p className="text-center text-md text-muted-foreground">
          {t('auth.logoutMessage', { name: displayName })}
        </p>
      </ConfirmModal>
    </>
  )
}
