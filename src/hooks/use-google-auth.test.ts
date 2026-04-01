/**
 * Tests for useGoogleAuth hook.
 * Covers handleAuthError: logout and toast on AuthExpiredError,
 * and no-op behavior for non-auth errors.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockLogout = vi.fn()
const mockSetGoogleUser = vi.fn()

const mockAppStoreState = {
  googleUser: { sub: '123', name: 'Test User', email: 'test@example.com' },
  accessToken: 'test-token',
  isAdmin: true,
  logout: mockLogout,
  setGoogleUser: mockSetGoogleUser,
}

vi.mock('@/stores/app-store', () => ({
  useAppStore: vi.fn((selector: (state: typeof mockAppStoreState) => unknown) =>
    selector(mockAppStoreState),
  ),
  isAdminUser: vi.fn(() => false),
}))

const mockNotify = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}))

vi.mock('@/components/ui/sonner', () => ({
  notify: mockNotify,
}))

import { AuthExpiredError } from '@/lib/errors'
import { useGoogleAuth } from './use-google-auth'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useGoogleAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── handleAuthError ────────────────────────────────────────────────────────

  describe('handleAuthError', () => {
    it('is exported from the hook', () => {
      const { result } = renderHook(() => useGoogleAuth())
      expect(typeof result.current.handleAuthError).toBe('function')
    })

    it('calls store logout when error is AuthExpiredError', () => {
      const { result } = renderHook(() => useGoogleAuth())
      const authError = new AuthExpiredError()

      act(() => {
        result.current.handleAuthError(authError)
      })

      expect(mockLogout).toHaveBeenCalledOnce()
    })

    it('shows error toast when error is AuthExpiredError', () => {
      const { result } = renderHook(() => useGoogleAuth())
      const authError = new AuthExpiredError()

      act(() => {
        result.current.handleAuthError(authError)
      })

      expect(mockNotify.error).toHaveBeenCalledOnce()
    })

    it('does NOT call logout for a generic Error', () => {
      const { result } = renderHook(() => useGoogleAuth())
      const genericError = new Error('Something else failed')

      act(() => {
        result.current.handleAuthError(genericError)
      })

      expect(mockLogout).not.toHaveBeenCalled()
    })

    it('does NOT show toast for a generic Error', () => {
      const { result } = renderHook(() => useGoogleAuth())
      const genericError = new Error('Something else failed')

      act(() => {
        result.current.handleAuthError(genericError)
      })

      expect(mockNotify.error).not.toHaveBeenCalled()
    })

    it('does NOT call logout when error is null', () => {
      const { result } = renderHook(() => useGoogleAuth())

      act(() => {
        result.current.handleAuthError(null)
      })

      expect(mockLogout).not.toHaveBeenCalled()
    })

    it('does NOT call logout when error is undefined', () => {
      const { result } = renderHook(() => useGoogleAuth())

      act(() => {
        result.current.handleAuthError(undefined)
      })

      expect(mockLogout).not.toHaveBeenCalled()
    })

    it('does NOT call logout when error is a plain string', () => {
      const { result } = renderHook(() => useGoogleAuth())

      act(() => {
        result.current.handleAuthError('some string error')
      })

      expect(mockLogout).not.toHaveBeenCalled()
    })
  })

  // ── existing interface ─────────────────────────────────────────────────────

  describe('return values', () => {
    it('exposes login, logout, isLoggedIn, googleUser, isAdmin', () => {
      const { result } = renderHook(() => useGoogleAuth())

      expect(typeof result.current.login).toBe('function')
      expect(typeof result.current.logout).toBe('function')
      expect(typeof result.current.isLoggedIn).toBe('boolean')
      expect(result.current.googleUser).toBeDefined()
      expect(typeof result.current.isAdmin).toBe('boolean')
    })

    it('isLoggedIn is true when googleUser is set', () => {
      const { result } = renderHook(() => useGoogleAuth())
      expect(result.current.isLoggedIn).toBe(true)
    })
  })
})
