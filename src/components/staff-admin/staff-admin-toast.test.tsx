import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StaffAdmin } from './staff-admin'
import {
  getEmployeeRepo,
  resetMockRepositories,
} from '@/test/mock-repositories'

// Mock the repository provider to use in-memory mock repositories
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

// Mock the modal component to avoid Radix Portal issues in tests
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
        <button onClick={onConfirm}>confirm-delete</button>
        <button onClick={onCancel}>cancel-delete</button>
      </div>
    ) : null,
}))

// Mock AvatarImage to simplify testing
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

describe('StaffAdmin — Toast Integration', () => {
  beforeEach(() => {
    resetMockRepositories()
    vi.clearAllMocks()
  })

  afterEach(() => {
    resetMockRepositories()
  })

  it('should show success toast after adding an employee', async () => {
    const user = userEvent.setup()
    render(<StaffAdmin />)

    await user.click(screen.getByRole('button', { name: /新增員工/ }))

    const nameInput = screen.getByPlaceholderText('請輸入員工姓名')
    await user.type(nameInput, 'New Employee')

    await user.click(screen.getByRole('button', { name: '確認' }))

    await waitFor(() => {
      expect(mockNotify.success).toHaveBeenCalledWith('員工已新增')
    })
  })

  it('should show success toast after updating an employee', async () => {
    const user = userEvent.setup()
    render(<StaffAdmin />)

    // Wait for data
    const editButtons = await screen.findAllByLabelText('編輯')
    await user.click(editButtons[0]!)

    const dialog = screen.getByRole('dialog', { name: '編輯員工' })
    const nameInput = within(dialog).getByDisplayValue('Alex')
    await user.clear(nameInput)
    await user.type(nameInput, 'Alexander')

    await user.click(screen.getByRole('button', { name: '確認' }))

    await waitFor(() => {
      expect(mockNotify.success).toHaveBeenCalledWith('員工資料已更新')
    })
  })

  it('should show success toast after deleting an employee', async () => {
    const user = userEvent.setup()
    render(<StaffAdmin />)

    // Wait for data
    const deleteButtons = await screen.findAllByLabelText('刪除')
    await user.click(deleteButtons[0]!)

    const confirmModal = screen.getByTestId('confirm-modal')
    await user.click(within(confirmModal).getByText('confirm-delete'))

    await waitFor(() => {
      expect(mockNotify.success).toHaveBeenCalledWith('員工已刪除')
    })
  })

  it('should NOT show toast when add form validation fails', async () => {
    const user = userEvent.setup()
    render(<StaffAdmin />)

    await user.click(screen.getByRole('button', { name: /新增員工/ }))
    await user.click(screen.getByRole('button', { name: '確認' }))

    expect(mockNotify.success).not.toHaveBeenCalled()
  })

  it('should NOT show toast when delete is cancelled', async () => {
    const user = userEvent.setup()
    render(<StaffAdmin />)

    // Wait for data
    const deleteButtons = await screen.findAllByLabelText('刪除')
    await user.click(deleteButtons[0]!)

    const confirmModal = screen.getByTestId('confirm-modal')
    await user.click(within(confirmModal).getByText('cancel-delete'))

    expect(mockNotify.success).not.toHaveBeenCalled()
  })
})
