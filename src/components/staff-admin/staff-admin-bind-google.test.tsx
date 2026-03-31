/**
 * Tests for StaffAdmin — Google account binding integration.
 * Covers handleBindGoogle handler, bind button visibility, and success toast.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StaffAdmin } from './staff-admin'
import {
  getEmployeeRepo,
  resetMockRepositories,
} from '@/test/mock-repositories'

// Mock the repository provider
vi.mock('@/lib/repositories', () => ({
  getEmployeeRepo: () => getEmployeeRepo(),
}))

// Mock notify to capture toast calls
const mockNotify = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}))

vi.mock('@/components/ui/sonner', () => ({
  notify: mockNotify,
}))

// Mock the app store so we can control isAdmin and googleUser state
const mockUseAppStore = vi.hoisted(() => vi.fn())

vi.mock('@/stores/app-store', async importOriginal => {
  const actual = await importOriginal<typeof import('@/stores/app-store')>()
  return {
    ...actual,
    useAppStore: mockUseAppStore,
  }
})

// Mock the modal component to avoid Radix Portal issues
vi.mock('@/components/modal', () => ({
  Modal: ({
    open,
    title,
    children,
    footer,
    onClose,
  }: {
    open: boolean
    title: string
    children: React.ReactNode
    footer?: React.ReactNode
    onClose: () => void
  }) =>
    open ? (
      <div data-testid="modal" role="dialog" aria-label={title}>
        <h2>{title}</h2>
        {children}
        {footer}
        <button onClick={onClose}>close-modal</button>
      </div>
    ) : null,
  ConfirmModal: ({
    open,
    title,
    children,
    onConfirm,
    onCancel,
  }: {
    open: boolean
    title: string
    children?: React.ReactNode
    onConfirm: () => void
    onCancel: () => void
  }) =>
    open ? (
      <div data-testid="confirm-modal" role="dialog" aria-label={title}>
        <h2>{title}</h2>
        {children}
        <button onClick={onConfirm}>確認</button>
        <button onClick={onCancel}>取消</button>
      </div>
    ) : null,
}))

// Mock AvatarImage
vi.mock('@/components/avatar-image', () => ({
  AvatarImage: ({ avatar, size }: { avatar?: string; size?: number }) => (
    <img
      data-testid="avatar-image"
      src={avatar ?? ''}
      style={{ width: size, height: size }}
      alt="avatar"
    />
  ),
}))

// Mock RippleButton to render as a regular button
vi.mock('@/components/ui/ripple-button', () => ({
  RippleButton: ({
    children,
    onClick,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children?: React.ReactNode
  }) => (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

// ─── Test setup ──────────────────────────────────────────────────────────────

const MOCK_GOOGLE_USER = {
  sub: '112232479673923380065',
  name: 'Admin User',
  email: 'admin@gmail.com',
}

function setupAdminStore() {
  mockUseAppStore.mockImplementation(
    (
      selector: (state: {
        isAdmin: boolean
        googleUser: typeof MOCK_GOOGLE_USER | null
      }) => unknown,
    ) => selector({ isAdmin: true, googleUser: MOCK_GOOGLE_USER }),
  )
}

function setupNonAdminStore() {
  mockUseAppStore.mockImplementation(
    (selector: (state: { isAdmin: boolean; googleUser: null }) => unknown) =>
      selector({ isAdmin: false, googleUser: null }),
  )
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('StaffAdmin — Google account binding', () => {
  beforeEach(() => {
    resetMockRepositories()
    vi.clearAllMocks()
  })

  afterEach(() => {
    resetMockRepositories()
  })

  describe('bind button visibility', () => {
    it('shows "綁定Google" button in action column when current user is admin', async () => {
      setupAdminStore()
      render(<StaffAdmin />)

      // Wait for employees to load
      await screen.findByText('Alex')

      const bindButtons = screen.getAllByText('綁定Google')
      expect(bindButtons.length).toBeGreaterThan(0)
    })

    it('does not show "綁定Google" button when current user is not admin', async () => {
      setupNonAdminStore()
      render(<StaffAdmin />)

      await screen.findByText('Alex')

      expect(screen.queryByText('綁定Google')).toBeNull()
    })
  })

  describe('handleBindGoogle', () => {
    it('calls bindGoogleAccount on the repo with correct args', async () => {
      setupAdminStore()
      const user = userEvent.setup()

      // Add bindGoogleAccount spy to mock repo
      const repo = getEmployeeRepo()
      const bindSpy = vi.spyOn(repo, 'bindGoogleAccount')

      render(<StaffAdmin />)
      await screen.findByText('Alex')

      const bindButtons = screen.getAllByText('綁定Google')
      await user.click(bindButtons[0]!)

      await waitFor(() => {
        expect(bindSpy).toHaveBeenCalledWith(
          expect.any(String),
          MOCK_GOOGLE_USER.sub,
          MOCK_GOOGLE_USER.email,
        )
      })
    })

    it('shows success toast after binding Google account', async () => {
      setupAdminStore()
      const user = userEvent.setup()

      render(<StaffAdmin />)
      await screen.findByText('Alex')

      const bindButtons = screen.getAllByText('綁定Google')
      await user.click(bindButtons[0]!)

      await waitFor(() => {
        expect(mockNotify.success).toHaveBeenCalledWith('Google帳號綁定成功')
      })
    })

    it('refreshes employee list after binding', async () => {
      setupAdminStore()
      const user = userEvent.setup()
      const repo = getEmployeeRepo()
      const findAllSpy = vi.spyOn(repo, 'findAll')
      const initialCallCount = findAllSpy.mock.calls.length

      render(<StaffAdmin />)
      await screen.findByText('Alex')

      const countAfterLoad = findAllSpy.mock.calls.length

      const bindButtons = screen.getAllByText('綁定Google')
      await user.click(bindButtons[0]!)

      await waitFor(() => {
        expect(findAllSpy.mock.calls.length).toBeGreaterThan(
          countAfterLoad + initialCallCount,
        )
      })
    })
  })
})
