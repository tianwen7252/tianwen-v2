/**
 * useGoogleAuth — reusable hook for Google Identity Services OAuth.
 * Handles login via GIS token client, fetches user info, and updates app store.
 * Can be used by HeaderUserMenu, AuthGuard, or any component that needs auth.
 */

import { useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore, isAdminUser, TIANWEN_SUB } from '@/stores/app-store'
import type { GoogleUser } from '@/stores/app-store'
import { notify } from '@/components/ui/sonner'
import { AuthExpiredError } from '@/lib/errors'

// ─── Constants ───────────────────────────────────────────────────────────────

const GOOGLE_CLIENT_ID =
  '799987452297-qetqo8blfushga2h064of13epeqtgh4a.apps.googleusercontent.com'
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'
const GIS_SCOPES =
  'openid email profile https://www.googleapis.com/auth/drive.readonly'

// ─── GIS type declarations ───────────────────────────────────────────────────

interface TokenResponse {
  access_token: string
  error?: string
  error_description?: string
}

interface TokenClient {
  requestAccessToken: () => void
}

interface GoogleOAuth2 {
  initTokenClient: (config: {
    client_id: string
    scope: string
    callback: (response: TokenResponse) => void
  }) => TokenClient
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: GoogleOAuth2
      }
    }
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useGoogleAuth() {
  const { t } = useTranslation()
  const googleUser = useAppStore((s) => s.googleUser)
  const setGoogleUser = useAppStore((s) => s.setGoogleUser)
  const appLogout = useAppStore((s) => s.logout)
  const isAdmin = useAppStore((s) => s.isAdmin)

  const tokenClientRef = useRef<TokenClient | null>(null)

  const isLoggedIn = googleUser !== null

  // Handle token response from GIS
  const handleTokenResponse = useCallback(
    async (tokenResponse: TokenResponse) => {
      if (tokenResponse.error) {
        notify.error(
          `${t('auth.loginError')}: ${tokenResponse.error_description ?? tokenResponse.error}`,
        )
        return
      }
      try {
        const res = await fetch(USERINFO_URL, {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        })
        if (!res.ok) throw new Error('Failed to fetch user info')
        const userInfo = (await res.json()) as GoogleUser
        const admin = isAdminUser(userInfo.sub)
        setGoogleUser(userInfo, tokenResponse.access_token, admin)

        // Tianwen admin gets a centered info toast
        if (userInfo.sub === TIANWEN_SUB) {
          notify.info(
            t('auth.loginSuccess', {
              name: userInfo.name,
            }),
            {
              description: '歡迎天文賴老闆!',
              position: 'top-center',
            },
          )
        } else {
          notify.success(t('auth.loginSuccess', { name: userInfo.name }))
        }
      } catch (err) {
        notify.error(
          t('auth.loginError') +
            (err instanceof Error ? `: ${err.message}` : ''),
        )
      }
    },
    [setGoogleUser, t],
  )

  // Initialize GIS token client and request access token
  const login = useCallback(() => {
    if (!window.google?.accounts?.oauth2) {
      notify.error(
        t('auth.loginError') + ': Google Identity Services not loaded',
      )
      return
    }

    if (!tokenClientRef.current) {
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GIS_SCOPES,
        callback: handleTokenResponse,
      })
    }

    tokenClientRef.current.requestAccessToken()
  }, [handleTokenResponse, t])

  const logout = useCallback(() => {
    appLogout()
    notify.success(t('auth.logoutSuccess'))
  }, [appLogout, t])

  // Silently refresh the Google access token.
  // Returns a Promise that resolves with the new token, or null if
  // the user must re-authenticate (e.g. Google session expired).
  const refreshToken = useCallback((): Promise<string | null> => {
    return new Promise(resolve => {
      if (!window.google?.accounts?.oauth2) {
        resolve(null)
        return
      }

      // Create a one-shot token client with a fresh callback
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GIS_SCOPES,
        callback: async (response: TokenResponse) => {
          if (response.error || !response.access_token) {
            resolve(null)
            return
          }
          // Update store with the new token
          const currentUser = useAppStore.getState().googleUser
          if (currentUser) {
            setGoogleUser(
              currentUser,
              response.access_token,
              isAdminUser(currentUser.sub),
            )
          }
          resolve(response.access_token)
        },
      })

      client.requestAccessToken()
    })
  }, [setGoogleUser])

  // Handle auth errors from Google API calls.
  // On AuthExpiredError: logs the user out and shows a toast notification.
  const handleAuthError = useCallback(
    (err: unknown) => {
      if (err instanceof AuthExpiredError) {
        appLogout()
        notify.error(t('auth.sessionExpired'))
      }
    },
    [appLogout, t],
  )

  return {
    googleUser,
    isLoggedIn,
    isAdmin,
    login,
    logout,
    refreshToken,
    handleAuthError,
  }
}
