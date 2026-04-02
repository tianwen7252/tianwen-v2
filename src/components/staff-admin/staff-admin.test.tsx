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
        <button onClick={onConfirm}>確認</button>
        <button onClick={onCancel}>取消</button>
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

describe('StaffAdmin', () => {
  beforeEach(() => {
    resetMockRepositories()
  })

  afterEach(() => {
    resetMockRepositories()
  })

  describe('employee table rendering', () => {
    it('should render the employee table with column headers', async () => {
      render(<StaffAdmin />)
      await screen.findByText('員工編號')
      expect(screen.getByText('員工')).toBeTruthy()
      expect(screen.getByText('入職日期')).toBeTruthy()
      expect(screen.getByText('離職日期')).toBeTruthy()
      expect(screen.getByText('班別')).toBeTruthy()
      expect(screen.getByText('操作')).toBeTruthy()
    })

    it('should render employees from mock data', async () => {
      render(<StaffAdmin />)
      await screen.findByText('Alex')
      expect(screen.getByText('Mia')).toBeTruthy()
      expect(screen.getByText('David')).toBeTruthy()
    })

    it('should show admin tag for admin employees', async () => {
      render(<StaffAdmin />)
      // Alex is admin
      await screen.findByText('管理員')
    })

    it('should show resigned tag for inactive employees', async () => {
      render(<StaffAdmin />)
      // Mark is inactive (resigned)
      await screen.findByText('已離職')
    })

    it('should show shift type labels', async () => {
      render(<StaffAdmin />)
      // Multiple employees have regular shift type
      await screen.findAllByText('常日班')
      expect(screen.getAllByText('排班').length).toBeGreaterThan(0)
    })

    it('should render add employee button', () => {
      render(<StaffAdmin />)
      expect(screen.getByRole('button', { name: /新增員工/ })).toBeTruthy()
    })
  })

  describe('add employee modal', () => {
    it('should open add modal when add button is clicked', async () => {
      const user = userEvent.setup()
      render(<StaffAdmin />)
      await user.click(screen.getByRole('button', { name: /新增員工/ }))
      expect(screen.getByRole('dialog', { name: '新增員工' })).toBeTruthy()
    })

    it('should close add modal on close', async () => {
      const user = userEvent.setup()
      render(<StaffAdmin />)
      await user.click(screen.getByRole('button', { name: /新增員工/ }))
      expect(screen.getByRole('dialog')).toBeTruthy()

      await user.click(screen.getByText('close-modal'))
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('should validate that name is required on submit', async () => {
      const user = userEvent.setup()
      render(<StaffAdmin />)
      await user.click(screen.getByRole('button', { name: /新增員工/ }))

      // Try to submit with empty name
      const submitButton = screen.getByRole('button', { name: '確認' })
      await user.click(submitButton)

      // Should show validation error
      await screen.findByText('請輸入員工姓名')
    })

    it('should add employee and close modal on valid submit', async () => {
      const user = userEvent.setup()
      render(<StaffAdmin />)

      // Wait for initial data
      await screen.findByText('Alex')
      const initialCount = (await getEmployeeRepo().findAll()).length

      await user.click(screen.getByRole('button', { name: /新增員工/ }))

      // Fill in name
      const nameInput = screen.getByPlaceholderText('請輸入員工姓名')
      await user.type(nameInput, 'New Employee')

      // Submit
      await user.click(screen.getByRole('button', { name: '確認' }))

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull()
      })

      // New employee should appear in the table
      await screen.findByText('New Employee')
      expect((await getEmployeeRepo().findAll()).length).toBe(initialCount + 1)
    })
  })

  describe('edit employee modal', () => {
    it('should open edit modal with pre-filled data when edit button is clicked', async () => {
      const user = userEvent.setup()
      render(<StaffAdmin />)

      // Wait for data
      const editButtons = await screen.findAllByLabelText('編輯')
      await user.click(editButtons[0]!)

      const dialog = screen.getByRole('dialog', { name: '編輯員工' })
      expect(dialog).toBeTruthy()

      // Name should be pre-filled
      const nameInput = within(dialog).getByDisplayValue('Alex')
      expect(nameInput).toBeTruthy()
    })

    it('should show resignation date field only in edit mode', async () => {
      const user = userEvent.setup()
      render(<StaffAdmin />)

      // Open add modal — resignation date input should NOT exist
      await user.click(screen.getByRole('button', { name: /新增員工/ }))
      expect(screen.queryByLabelText('離職日期')).toBeNull()
      await user.click(screen.getByText('close-modal'))

      // Wait for data to reload
      const editButtons = await screen.findAllByLabelText('編輯')
      await user.click(editButtons[0]!)
      expect(screen.getByLabelText('離職日期')).toBeTruthy()
    })

    it('should update employee name and close modal on edit submit', async () => {
      const user = userEvent.setup()
      render(<StaffAdmin />)

      // Wait for data
      const editButtons = await screen.findAllByLabelText('編輯')
      await user.click(editButtons[0]!)

      const dialog = screen.getByRole('dialog', { name: '編輯員工' })
      const nameInput = within(dialog).getByDisplayValue('Alex')

      // Clear and type new name
      await user.clear(nameInput)
      await user.type(nameInput, 'Alexander')

      // Submit
      await user.click(screen.getByRole('button', { name: '確認' }))

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull()
      })

      // Updated name should appear
      await waitFor(() => {
        expect(screen.getByText('Alexander')).toBeTruthy()
        expect(screen.queryByText('Alex')).toBeNull()
      })
    })

    it('should validate name is required on edit submit', async () => {
      const user = userEvent.setup()
      render(<StaffAdmin />)

      // Wait for data
      const editButtons = await screen.findAllByLabelText('編輯')
      await user.click(editButtons[0]!)

      const dialog = screen.getByRole('dialog', { name: '編輯員工' })
      const nameInput = within(dialog).getByDisplayValue('Alex')
      await user.clear(nameInput)

      await user.click(screen.getByRole('button', { name: '確認' }))

      // Should show validation error
      await screen.findByText('請輸入員工姓名')
    })

    it('should clear name error when user starts typing', async () => {
      const user = userEvent.setup()
      render(<StaffAdmin />)

      // Open add modal and trigger validation error
      await user.click(screen.getByRole('button', { name: /新增員工/ }))
      await user.click(screen.getByRole('button', { name: '確認' }))
      await screen.findByText('請輸入員工姓名')

      // Start typing — error should clear
      const nameInput = screen.getByPlaceholderText('請輸入員工姓名')
      await user.type(nameInput, 'A')
      expect(screen.queryByText('請輸入員工姓名')).toBeNull()
    })

    it('should update employee with resignation date to set status inactive', async () => {
      const user = userEvent.setup()
      render(<StaffAdmin />)

      // Wait for data
      const editButtons = await screen.findAllByLabelText('編輯')
      await user.click(editButtons[1]!)

      // Set a resignation date using the labeled input
      const resignInput = screen.getByLabelText('離職日期')
      await user.type(resignInput, '2026-12-31')

      await user.click(screen.getByRole('button', { name: '確認' }))

      // Employee should be updated in mock service
      await waitFor(async () => {
        const updated = await getEmployeeRepo().findById('emp-002')
        expect(updated?.resignationDate).toBe('2026-12-31')
        expect(updated?.status).toBe('inactive')
      })
    })
  })

  describe('delete employee', () => {
    it('should show confirm modal when delete button is clicked', async () => {
      const user = userEvent.setup()
      render(<StaffAdmin />)

      // Wait for data
      const deleteButtons = await screen.findAllByLabelText('刪除')
      await user.click(deleteButtons[0]!)

      expect(screen.getByTestId('confirm-modal')).toBeTruthy()
    })

    it('should remove employee after confirming delete', async () => {
      const user = userEvent.setup()
      render(<StaffAdmin />)

      // Wait for data
      const deleteButtons = await screen.findAllByLabelText('刪除')

      const initialCount = (await getEmployeeRepo().findAll()).length
      await user.click(deleteButtons[0]!)

      // Confirm deletion
      const confirmModal = screen.getByTestId('confirm-modal')
      await user.click(within(confirmModal).getByText('確認'))

      await waitFor(async () => {
        expect((await getEmployeeRepo().findAll()).length).toBe(
          initialCount - 1,
        )
      })
    })

    it('should cancel delete and keep employee', async () => {
      const user = userEvent.setup()
      render(<StaffAdmin />)

      // Wait for data
      const deleteButtons = await screen.findAllByLabelText('刪除')

      const initialCount = (await getEmployeeRepo().findAll()).length
      await user.click(deleteButtons[0]!)

      // Cancel deletion
      const confirmModal = screen.getByTestId('confirm-modal')
      await user.click(within(confirmModal).getByText('取消'))

      expect((await getEmployeeRepo().findAll()).length).toBe(initialCount)
      expect(screen.queryByTestId('confirm-modal')).toBeNull()
    })
  })

  describe('form fields', () => {
    it('should change shift type via radio buttons', async () => {
      const user = userEvent.setup()
      render(<StaffAdmin />)
      await user.click(screen.getByRole('button', { name: /新增員工/ }))

      // Default should be regular
      const regularRadio = screen.getByLabelText('常日班')
      const shiftRadio = screen.getByLabelText('排班')
      expect((regularRadio as HTMLInputElement).checked).toBe(true)
      expect((shiftRadio as HTMLInputElement).checked).toBe(false)

      // Switch to shift type
      await user.click(shiftRadio)
      expect((shiftRadio as HTMLInputElement).checked).toBe(true)
      expect((regularRadio as HTMLInputElement).checked).toBe(false)
    })

    it('should toggle admin permission via Switch (not checkbox)', async () => {
      const user = userEvent.setup()
      render(<StaffAdmin />)
      await user.click(screen.getByRole('button', { name: /新增員工/ }))

      // Admin toggle must use a Switch (role="switch"), not a checkbox
      const adminSwitch = screen.getByRole('switch', { name: '管理員權限' })
      expect(adminSwitch.getAttribute('data-state')).toBe('unchecked')

      await user.click(adminSwitch)
      expect(adminSwitch.getAttribute('data-state')).toBe('checked')
    })

    it('should not have a checkbox for admin permission', async () => {
      const user = userEvent.setup()
      render(<StaffAdmin />)
      await user.click(screen.getByRole('button', { name: /新增員工/ }))

      // There should be no checkbox input for admin permission
      const checkboxes = screen.queryAllByRole('checkbox')
      expect(checkboxes.length).toBe(0)
    })

    it('should set hire date', async () => {
      const user = userEvent.setup()
      render(<StaffAdmin />)
      await user.click(screen.getByRole('button', { name: /新增員工/ }))

      const hireDateInput = screen.getByLabelText('入職日期')
      await user.type(hireDateInput, '2026-01-15')
      expect((hireDateInput as HTMLInputElement).value).toBe('2026-01-15')
    })

    it('should display dash for missing dates', async () => {
      render(<StaffAdmin />)
      // Most employees without resignation date should show "-"
      const dashes = await screen.findAllByText('-')
      expect(dashes.length).toBeGreaterThan(0)
    })
  })

  describe('avatar picker', () => {
    it('should render avatar grid in the add modal', async () => {
      const user = userEvent.setup()
      render(<StaffAdmin />)
      await user.click(screen.getByRole('button', { name: /新增員工/ }))

      // Avatar grid should contain animal avatar buttons
      const avatarButtons = screen.getAllByTestId('avatar-option')
      expect(avatarButtons.length).toBe(27) // All ANIMAL_AVATARS
    })

    it('should render avatar images at size 64', async () => {
      const user = userEvent.setup()
      render(<StaffAdmin />)
      await user.click(screen.getByRole('button', { name: /新增員工/ }))

      // Avatar images inside the picker must be 64px — not 28px
      const avatarImages = screen
        .getAllByTestId('avatar-image')
        // Filter to only avatar-option images (inside the picker grid)
        .filter(img => img.closest('[data-testid="avatar-option"]') !== null)
      expect(avatarImages.length).toBeGreaterThan(0)
      avatarImages.forEach(img => {
        expect((img as HTMLImageElement).style.width).toBe('64px')
        expect((img as HTMLImageElement).style.height).toBe('64px')
      })
    })

    it('should select avatar when clicked', async () => {
      const user = userEvent.setup()
      render(<StaffAdmin />)
      await user.click(screen.getByRole('button', { name: /新增員工/ }))

      const avatarButtons = screen.getAllByTestId('avatar-option')
      await user.click(avatarButtons[0]!)

      // Selected avatar should have visual indicator
      expect(avatarButtons[0]!.getAttribute('data-selected')).toBe('true')
    })
  })
})
