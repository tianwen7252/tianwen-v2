/**
 * Tests for HeaderUserMenu component with Google OAuth.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockLogin = vi.fn()
const mockLogout = vi.fn()
let mockGoogleUser: {
  sub: string
  name: string
  email: string
  picture?: string
} | null = null
let mockIsLoggedIn = false

vi.mock('@/hooks/use-google-auth', () => ({
  useGoogleAuth: () => ({
    googleUser: mockGoogleUser,
    isLoggedIn: mockIsLoggedIn,
    isAdmin: true,
    login: mockLogin,
    logout: mockLogout,
  }),
}))

const mockFindAll = vi.fn().mockResolvedValue([])

vi.mock('@/lib/repositories/provider', () => ({
  getEmployeeRepo: () => ({
    findAll: mockFindAll,
  }),
}))

import { HeaderUserMenu } from './header-user-menu'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderWithProviders(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('HeaderUserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGoogleUser = null
    mockIsLoggedIn = false
    mockFindAll.mockResolvedValue([])
  })

  describe('when not logged in', () => {
    it('renders a UserRound login button', () => {
      renderWithProviders(<HeaderUserMenu />)
      expect(screen.getByTestId('header-login')).toBeTruthy()
    })

    it('calls login on click', async () => {
      const user = userEvent.setup()
      renderWithProviders(<HeaderUserMenu />)
      await user.click(screen.getByTestId('header-login'))
      expect(mockLogin).toHaveBeenCalledOnce()
    })
  })

  describe('when logged in', () => {
    beforeEach(() => {
      mockGoogleUser = {
        sub: '112232479673923380065',
        name: 'Tianwen',
        email: 'tianwen@example.com',
        picture: 'https://example.com/photo.jpg',
      }
      mockIsLoggedIn = true
    })

    it('renders avatar image from Google when no employee match', () => {
      renderWithProviders(<HeaderUserMenu />)
      const avatar = screen.getByTestId('header-avatar')
      const img = avatar.querySelector('img')
      expect(img).toBeTruthy()
      expect(img?.getAttribute('src')).toBe('https://example.com/photo.jpg')
    })

    it('renders employee avatar when matched', async () => {
      mockFindAll.mockResolvedValue([
        {
          id: 'emp-001',
          name: 'Tianwen',
          avatar: '/images/tianwen.png',
          status: 'active',
          shiftType: 'regular',
          isAdmin: true,
          createdAt: 0,
          updatedAt: 0,
        },
      ])

      renderWithProviders(<HeaderUserMenu />)

      await waitFor(() => {
        const img = screen.getByAltText('Tianwen')
        expect(img.getAttribute('src')).toBe('/images/tianwen.png')
      })
    })

    it('renders text initial when no picture available', () => {
      mockGoogleUser = {
        sub: '123',
        name: 'Alice',
        email: 'alice@example.com',
      }
      renderWithProviders(<HeaderUserMenu />)
      const avatar = screen.getByTestId('header-avatar')
      expect(avatar.textContent).toContain('A')
    })

    it('opens logout modal on avatar click', async () => {
      const user = userEvent.setup()
      renderWithProviders(<HeaderUserMenu />)
      await user.click(screen.getByTestId('header-avatar'))
      expect(screen.getAllByText('確認登出？').length).toBeGreaterThan(0)
    })

    it('shows user name in logout modal', async () => {
      const user = userEvent.setup()
      renderWithProviders(<HeaderUserMenu />)
      await user.click(screen.getByTestId('header-avatar'))
      expect(screen.getByText('目前登入：Tianwen')).toBeTruthy()
    })

    it('calls logout on confirm', async () => {
      const user = userEvent.setup()
      renderWithProviders(<HeaderUserMenu />)
      await user.click(screen.getByTestId('header-avatar'))
      await user.click(screen.getByText('確認'))
      expect(mockLogout).toHaveBeenCalledOnce()
    })

    it('does not logout on cancel', async () => {
      const user = userEvent.setup()
      renderWithProviders(<HeaderUserMenu />)
      await user.click(screen.getByTestId('header-avatar'))
      await user.click(screen.getByText('取消'))
      expect(mockLogout).not.toHaveBeenCalled()
    })
  })
})
