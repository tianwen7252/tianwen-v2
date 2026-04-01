/**
 * Tests for EmployeeRow component.
 * Covers Google account linking tag display, link/unlink button visibility.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmployeeRow } from './employee-row'
import type { Employee } from '@/lib/schemas'

// Mock AvatarImage to simplify testing
vi.mock('@/components/avatar-image', () => ({
  AvatarImage: ({ size }: { size?: number }) => (
    <img
      data-testid="avatar-image"
      style={{ width: size, height: size }}
      alt="avatar"
    />
  ),
}))

// Mock RippleButton to render as a regular button for testing
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

// ─── Test helpers ────────────────────────────────────────────────────────────

function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 'emp-001',
    name: 'Alex',
    employeeNo: 'E001',
    isAdmin: false,
    shiftType: 'regular',
    status: 'active',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    ...overrides,
  }
}

function renderInTable(ui: React.ReactElement) {
  return render(
    <table>
      <tbody>{ui}</tbody>
    </table>,
  )
}

const defaultRowProps = {
  isCurrentUserAdmin: false,
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onLinkGoogle: vi.fn(),
  onUnlinkGoogle: vi.fn(),
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('EmployeeRow', () => {
  // ─── Basic rendering ───────────────────────────────────────────────────────

  describe('basic rendering', () => {
    it('renders employee name', () => {
      const employee = makeEmployee({ name: 'Alex' })
      renderInTable(
        <EmployeeRow employee={employee} {...defaultRowProps} />,
      )
      expect(screen.getByText('Alex')).toBeTruthy()
    })

    it('renders employee number', () => {
      const employee = makeEmployee({ employeeNo: 'E001' })
      renderInTable(
        <EmployeeRow employee={employee} {...defaultRowProps} />,
      )
      expect(screen.getByText('E001')).toBeTruthy()
    })

    it('shows admin tag when employee is admin', () => {
      const employee = makeEmployee({ isAdmin: true })
      renderInTable(
        <EmployeeRow employee={employee} {...defaultRowProps} />,
      )
      expect(screen.getByText('管理員')).toBeTruthy()
    })

    it('does not show admin tag when employee is not admin', () => {
      const employee = makeEmployee({ isAdmin: false })
      renderInTable(
        <EmployeeRow employee={employee} {...defaultRowProps} />,
      )
      expect(screen.queryByText('管理員')).toBeNull()
    })

    it('shows resigned tag when employee is inactive', () => {
      const employee = makeEmployee({ status: 'inactive' })
      renderInTable(
        <EmployeeRow employee={employee} {...defaultRowProps} />,
      )
      expect(screen.getByText('已離職')).toBeTruthy()
    })
  })

  // ─── Google linked tag ─────────────────────────────────────────────────────

  describe('Google linked tag', () => {
    it('shows "已連結Google" tag when googleSub is set', () => {
      const employee = makeEmployee({
        googleSub: '112232479673923380065',
        googleEmail: 'alex@gmail.com',
      })
      renderInTable(
        <EmployeeRow employee={employee} {...defaultRowProps} />,
      )
      expect(screen.getByText('已連結Google')).toBeTruthy()
    })

    it('does not show "已連結Google" tag when googleSub is undefined', () => {
      const employee = makeEmployee({ googleSub: undefined })
      renderInTable(
        <EmployeeRow employee={employee} {...defaultRowProps} />,
      )
      expect(screen.queryByText('已連結Google')).toBeNull()
    })

    it('shows "已連結Google" tag below the admin tag', () => {
      const employee = makeEmployee({
        isAdmin: true,
        googleSub: 'sub-123',
      })
      renderInTable(
        <EmployeeRow employee={employee} {...defaultRowProps} />,
      )
      const adminTag = screen.getByText('管理員')
      const googleTag = screen.getByText('已連結Google')
      expect(adminTag).toBeTruthy()
      expect(googleTag).toBeTruthy()
      // Google tag should appear after admin tag in DOM order (separate lines)
      const container = adminTag.closest('td')!
      const tags = container.querySelectorAll('span')
      const adminIndex = Array.from(tags).indexOf(adminTag.closest('span')!)
      const googleIndex = Array.from(tags).indexOf(googleTag.closest('span')!)
      expect(googleIndex).toBeGreaterThan(adminIndex)
    })
  })

  // ─── Link Google button ────────────────────────────────────────────────────

  describe('Link Google button', () => {
    it('shows link button when current user is admin and employee not linked', () => {
      const employee = makeEmployee({ googleSub: undefined })
      renderInTable(
        <EmployeeRow
          employee={employee}
          {...defaultRowProps}
          isCurrentUserAdmin={true}
        />,
      )
      expect(screen.getByText('連結Google')).toBeTruthy()
    })

    it('does not show link button when current user is not admin', () => {
      const employee = makeEmployee({ googleSub: undefined })
      renderInTable(
        <EmployeeRow
          employee={employee}
          {...defaultRowProps}
          isCurrentUserAdmin={false}
        />,
      )
      expect(screen.queryByText('連結Google')).toBeNull()
    })

    it('calls onLinkGoogle with employee when link button is clicked', async () => {
      const user = userEvent.setup()
      const onLinkGoogle = vi.fn()
      const employee = makeEmployee({ id: 'emp-001', googleSub: undefined })
      renderInTable(
        <EmployeeRow
          employee={employee}
          {...defaultRowProps}
          isCurrentUserAdmin={true}
          onLinkGoogle={onLinkGoogle}
        />,
      )

      await user.click(screen.getByText('連結Google'))

      expect(onLinkGoogle).toHaveBeenCalledWith(employee)
    })

    it('hides link button when employee already has googleSub linked', () => {
      const employee = makeEmployee({
        googleSub: 'already-bound-sub',
      })
      renderInTable(
        <EmployeeRow
          employee={employee}
          {...defaultRowProps}
          isCurrentUserAdmin={true}
        />,
      )
      expect(screen.queryByText('連結Google')).toBeNull()
    })
  })

  // ─── Unlink Google button ──────────────────────────────────────────────────

  describe('Unlink Google button', () => {
    it('shows unlink button when admin and employee is linked', () => {
      const employee = makeEmployee({ googleSub: 'sub-123' })
      renderInTable(
        <EmployeeRow
          employee={employee}
          {...defaultRowProps}
          isCurrentUserAdmin={true}
        />,
      )
      expect(screen.getByText('取消連結')).toBeTruthy()
    })

    it('does not show unlink button when not admin', () => {
      const employee = makeEmployee({ googleSub: 'sub-123' })
      renderInTable(
        <EmployeeRow
          employee={employee}
          {...defaultRowProps}
          isCurrentUserAdmin={false}
        />,
      )
      expect(screen.queryByText('取消連結')).toBeNull()
    })

    it('does not show unlink button when employee is not linked', () => {
      const employee = makeEmployee({ googleSub: undefined })
      renderInTable(
        <EmployeeRow
          employee={employee}
          {...defaultRowProps}
          isCurrentUserAdmin={true}
        />,
      )
      expect(screen.queryByText('取消連結')).toBeNull()
    })

    it('calls onUnlinkGoogle with employee when unlink button is clicked', async () => {
      const user = userEvent.setup()
      const onUnlinkGoogle = vi.fn()
      const employee = makeEmployee({ googleSub: 'sub-123' })
      renderInTable(
        <EmployeeRow
          employee={employee}
          {...defaultRowProps}
          isCurrentUserAdmin={true}
          onUnlinkGoogle={onUnlinkGoogle}
        />,
      )

      await user.click(screen.getByText('取消連結'))

      expect(onUnlinkGoogle).toHaveBeenCalledWith(employee)
    })
  })

  // ─── Edit / Delete buttons ─────────────────────────────────────────────────

  describe('edit and delete buttons', () => {
    it('edit and delete buttons are always visible', () => {
      const employee = makeEmployee()
      renderInTable(
        <EmployeeRow employee={employee} {...defaultRowProps} />,
      )
      expect(screen.getByLabelText('編輯')).toBeTruthy()
      expect(screen.getByLabelText('刪除')).toBeTruthy()
    })

    it('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      const employee = makeEmployee()
      renderInTable(
        <EmployeeRow
          employee={employee}
          {...defaultRowProps}
          onEdit={onEdit}
        />,
      )

      await user.click(screen.getByLabelText('編輯'))

      expect(onEdit).toHaveBeenCalledWith(employee)
    })

    it('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup()
      const onDelete = vi.fn()
      const employee = makeEmployee()
      renderInTable(
        <EmployeeRow
          employee={employee}
          {...defaultRowProps}
          onDelete={onDelete}
        />,
      )

      await user.click(screen.getByLabelText('刪除'))

      expect(onDelete).toHaveBeenCalledWith(employee)
    })
  })
})
