import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthGuard } from './auth-guard'

// ─── Mocks ───────────────────────────────────────────────────────────────────

let mockGoogleUser: { sub: string; name: string; email: string } | null = null
let mockIsAdmin = false

vi.mock('@/hooks/use-google-auth', () => ({
  useGoogleAuth: () => ({
    googleUser: mockGoogleUser,
    isLoggedIn: mockGoogleUser !== null,
    isAdmin: mockIsAdmin,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AuthGuard', () => {
  beforeEach(() => {
    mockGoogleUser = null
    mockIsAdmin = false
  })

  describe('not logged in', () => {
    it('should show login screen with lock icon', () => {
      render(
        <AuthGuard>
          <div>Protected content</div>
        </AuthGuard>,
      )
      expect(screen.queryByText('Protected content')).toBeNull()
      expect(screen.getByText('權限不足')).toBeTruthy()
      expect(screen.getByText('請點擊右上角的登入按鈕')).toBeTruthy()
    })

    it('should show staffAdmin subtitle', () => {
      render(
        <AuthGuard variant="staffAdmin">
          <div>Content</div>
        </AuthGuard>,
      )
      expect(
        screen.getByText('此頁面僅限管理員使用，請以管理員帳號登入'),
      ).toBeTruthy()
    })

    it('should show backup subtitle', () => {
      render(
        <AuthGuard variant="backup">
          <div>Content</div>
        </AuthGuard>,
      )
      expect(
        screen.getByText('此功能僅限管理員使用，請以管理員帳號登入'),
      ).toBeTruthy()
    })
  })

  describe('logged in but not admin', () => {
    beforeEach(() => {
      mockGoogleUser = {
        sub: '999',
        name: 'Regular',
        email: 'regular@test.com',
      }
      mockIsAdmin = false
    })

    it('should show admin-only message', () => {
      render(
        <AuthGuard>
          <div>Protected content</div>
        </AuthGuard>,
      )
      expect(screen.queryByText('Protected content')).toBeNull()
      expect(screen.getByText('僅限管理員')).toBeTruthy()
    })
  })

  describe('logged in as admin', () => {
    beforeEach(() => {
      mockGoogleUser = {
        sub: '112232479673923380065',
        name: 'Admin',
        email: 'admin@test.com',
      }
      mockIsAdmin = true
    })

    it('should render children', () => {
      render(
        <AuthGuard>
          <div>Protected content</div>
        </AuthGuard>,
      )
      expect(screen.getByText('Protected content')).toBeTruthy()
    })

    it('should not show login screen or admin bar', () => {
      render(
        <AuthGuard>
          <div>Content</div>
        </AuthGuard>,
      )
      expect(screen.queryByText('權限不足')).toBeNull()
      expect(screen.queryByText('僅限管理員')).toBeNull()
    })
  })
})
