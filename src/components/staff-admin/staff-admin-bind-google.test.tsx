/**
 * Tests for StaffAdmin — Google account linking/unlinking integration.
 * Covers confirm modal flow, link/unlink handlers, and success toasts.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
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
  warning: vi.fn(),
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

describe('StaffAdmin — Google account linking', () => {
  beforeEach(() => {
    resetMockRepositories()
    vi.clearAllMocks()
  })

  afterEach(() => {
    resetMockRepositories()
  })

  describe('link button visibility', () => {
    it('shows "連結Google" button when current user is admin', async () => {
      setupAdminStore()
      render(<StaffAdmin />)

      await screen.findByText('Eric')

      const linkButtons = screen.getAllByText('連結Google')
      expect(linkButtons.length).toBeGreaterThan(0)
    })

    it('does not show "連結Google" button when current user is not admin', async () => {
      setupNonAdminStore()
      render(<StaffAdmin />)

      await screen.findByText('Eric')

      expect(screen.queryByText('連結Google')).toBeNull()
    })
  })

  describe('link Google flow', () => {
    it('shows confirm modal with employee and Google name when link button clicked', async () => {
      setupAdminStore()
      const user = userEvent.setup()

      render(<StaffAdmin />)
      await screen.findByText('Eric')

      const linkButtons = screen.getAllByText('連結Google')
      await user.click(linkButtons[0]!)

      // Confirm modal should appear with link title
      const modal = screen.getByRole('dialog', {
        name: '確認連結Google帳號',
      })
      expect(modal).toBeTruthy()

      // Should show both employee name and Google account name
      expect(
        within(modal).getByText(/Eric/, { exact: false }),
      ).toBeTruthy()
      expect(
        within(modal).getByText(/Admin User/, { exact: false }),
      ).toBeTruthy()
    })

    it('calls bindGoogleAccount after confirming link', async () => {
      setupAdminStore()
      const user = userEvent.setup()

      const repo = getEmployeeRepo()
      const bindSpy = vi.spyOn(repo, 'bindGoogleAccount')

      render(<StaffAdmin />)
      await screen.findByText('Eric')

      const linkButtons = screen.getAllByText('連結Google')
      await user.click(linkButtons[0]!)

      // Confirm in modal
      const modal = screen.getByRole('dialog', {
        name: '確認連結Google帳號',
      })
      await user.click(within(modal).getByText('確認'))

      await waitFor(() => {
        expect(bindSpy).toHaveBeenCalledWith(
          expect.any(String),
          MOCK_GOOGLE_USER.sub,
          MOCK_GOOGLE_USER.email,
        )
      })
    })

    it('shows success toast after linking Google account', async () => {
      setupAdminStore()
      const user = userEvent.setup()

      render(<StaffAdmin />)
      await screen.findByText('Eric')

      const linkButtons = screen.getAllByText('連結Google')
      await user.click(linkButtons[0]!)

      const modal = screen.getByRole('dialog', {
        name: '確認連結Google帳號',
      })
      await user.click(within(modal).getByText('確認'))

      await waitFor(() => {
        expect(mockNotify.success).toHaveBeenCalledWith('Google帳號連結成功')
      })
    })

    it('does not call bindGoogleAccount when cancel is clicked', async () => {
      setupAdminStore()
      const user = userEvent.setup()

      const repo = getEmployeeRepo()
      const bindSpy = vi.spyOn(repo, 'bindGoogleAccount')

      render(<StaffAdmin />)
      await screen.findByText('Eric')

      const linkButtons = screen.getAllByText('連結Google')
      await user.click(linkButtons[0]!)

      const modal = screen.getByRole('dialog', {
        name: '確認連結Google帳號',
      })
      await user.click(within(modal).getByText('取消'))

      expect(bindSpy).not.toHaveBeenCalled()
      expect(screen.queryByRole('dialog', { name: '確認連結Google帳號' })).toBeNull()
    })

    it('shows warning when Google account is already linked to another employee', async () => {
      setupAdminStore()
      const user = userEvent.setup()

      // Pre-link Eric with the same Google sub as MOCK_GOOGLE_USER
      const repo = getEmployeeRepo()
      const employees = await repo.findAll()
      const alex = employees.find((e) => e.name === 'Eric')!
      await repo.bindGoogleAccount(
        alex.id,
        MOCK_GOOGLE_USER.sub,
        MOCK_GOOGLE_USER.email,
      )

      // Now make another admin employee to try linking the same account
      const allEmployees = await repo.findAll()
      const otherAdmin = allEmployees.find(
        (e) => e.isAdmin && e.id !== alex.id,
      )

      // If no other admin exists, update one to be admin
      if (!otherAdmin) {
        const mia = allEmployees.find((e) => e.name === '妞妞')!
        await repo.update(mia.id, { isAdmin: true })
      }

      render(<StaffAdmin />)
      await screen.findByText('Eric')

      // Find the link button for the other admin employee (not Eric who is already linked)
      const linkButtons = screen.queryAllByText('連結Google')
      if (linkButtons.length > 0) {
        await user.click(linkButtons[0]!)

        const modal = screen.getByRole('dialog', {
          name: '確認連結Google帳號',
        })
        await user.click(within(modal).getByText('確認'))

        await waitFor(() => {
          expect(mockNotify.warning).toHaveBeenCalledWith(
            expect.stringContaining('Eric'),
          )
        })
      }
    })
  })

  describe('unlink Google flow', () => {
    it('shows "取消連結" button for linked employees when admin', async () => {
      setupAdminStore()

      // Pre-link an employee
      const repo = getEmployeeRepo()
      const employees = await repo.findAll()
      await repo.bindGoogleAccount(
        employees[0]!.id,
        'sub-123',
        'alex@gmail.com',
      )

      render(<StaffAdmin />)
      await screen.findByText('Eric')

      expect(screen.getByText('取消連結')).toBeTruthy()
    })

    it('shows confirm modal when unlink button is clicked', async () => {
      setupAdminStore()
      const user = userEvent.setup()

      const repo = getEmployeeRepo()
      const employees = await repo.findAll()
      await repo.bindGoogleAccount(
        employees[0]!.id,
        'sub-123',
        'alex@gmail.com',
      )

      render(<StaffAdmin />)
      await screen.findByText('Eric')

      await user.click(screen.getByText('取消連結'))

      const modal = screen.getByRole('dialog', { name: '確認取消連結' })
      expect(modal).toBeTruthy()
      expect(
        within(modal).getByText(/Eric/, { exact: false }),
      ).toBeTruthy()
    })

    it('calls unbindGoogleAccount after confirming unlink', async () => {
      setupAdminStore()
      const user = userEvent.setup()

      const repo = getEmployeeRepo()
      const employees = await repo.findAll()
      await repo.bindGoogleAccount(
        employees[0]!.id,
        'sub-123',
        'alex@gmail.com',
      )
      const unbindSpy = vi.spyOn(repo, 'unbindGoogleAccount')

      render(<StaffAdmin />)
      await screen.findByText('Eric')

      await user.click(screen.getByText('取消連結'))

      const modal = screen.getByRole('dialog', { name: '確認取消連結' })
      await user.click(within(modal).getByText('確認'))

      await waitFor(() => {
        expect(unbindSpy).toHaveBeenCalledWith(employees[0]!.id)
      })
    })

    it('shows success toast after unlinking', async () => {
      setupAdminStore()
      const user = userEvent.setup()

      const repo = getEmployeeRepo()
      const employees = await repo.findAll()
      await repo.bindGoogleAccount(
        employees[0]!.id,
        'sub-123',
        'alex@gmail.com',
      )

      render(<StaffAdmin />)
      await screen.findByText('Eric')

      await user.click(screen.getByText('取消連結'))

      const modal = screen.getByRole('dialog', { name: '確認取消連結' })
      await user.click(within(modal).getByText('確認'))

      await waitFor(() => {
        expect(mockNotify.success).toHaveBeenCalledWith('已取消Google帳號連結')
      })
    })
  })
})
