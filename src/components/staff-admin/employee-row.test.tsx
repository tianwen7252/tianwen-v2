/**
 * Tests for EmployeeRow component.
 * Covers Google account binding tag display and bind button visibility.
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

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('EmployeeRow', () => {
  // ─── Basic rendering ───────────────────────────────────────────────────────

  describe('basic rendering', () => {
    it('renders employee name', () => {
      const employee = makeEmployee({ name: 'Alex' })
      renderInTable(
        <EmployeeRow
          employee={employee}
          isCurrentUserAdmin={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onBindGoogle={vi.fn()}
        />,
      )
      expect(screen.getByText('Alex')).toBeTruthy()
    })

    it('renders employee number', () => {
      const employee = makeEmployee({ employeeNo: 'E001' })
      renderInTable(
        <EmployeeRow
          employee={employee}
          isCurrentUserAdmin={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onBindGoogle={vi.fn()}
        />,
      )
      expect(screen.getByText('E001')).toBeTruthy()
    })

    it('shows admin tag when employee is admin', () => {
      const employee = makeEmployee({ isAdmin: true })
      renderInTable(
        <EmployeeRow
          employee={employee}
          isCurrentUserAdmin={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onBindGoogle={vi.fn()}
        />,
      )
      expect(screen.getByText('管理員')).toBeTruthy()
    })

    it('does not show admin tag when employee is not admin', () => {
      const employee = makeEmployee({ isAdmin: false })
      renderInTable(
        <EmployeeRow
          employee={employee}
          isCurrentUserAdmin={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onBindGoogle={vi.fn()}
        />,
      )
      expect(screen.queryByText('管理員')).toBeNull()
    })

    it('shows resigned tag when employee is inactive', () => {
      const employee = makeEmployee({ status: 'inactive' })
      renderInTable(
        <EmployeeRow
          employee={employee}
          isCurrentUserAdmin={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onBindGoogle={vi.fn()}
        />,
      )
      expect(screen.getByText('已離職')).toBeTruthy()
    })
  })

  // ─── Google bound tag ──────────────────────────────────────────────────────

  describe('Google bound tag', () => {
    it('shows "已綁定Google" tag when googleSub is set', () => {
      const employee = makeEmployee({
        googleSub: '112232479673923380065',
        googleEmail: 'alex@gmail.com',
      })
      renderInTable(
        <EmployeeRow
          employee={employee}
          isCurrentUserAdmin={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onBindGoogle={vi.fn()}
        />,
      )
      expect(screen.getByText('已綁定Google')).toBeTruthy()
    })

    it('does not show "已綁定Google" tag when googleSub is undefined', () => {
      const employee = makeEmployee({ googleSub: undefined })
      renderInTable(
        <EmployeeRow
          employee={employee}
          isCurrentUserAdmin={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onBindGoogle={vi.fn()}
        />,
      )
      expect(screen.queryByText('已綁定Google')).toBeNull()
    })

    it('shows "已綁定Google" tag below the admin tag', () => {
      const employee = makeEmployee({
        isAdmin: true,
        googleSub: 'sub-123',
      })
      renderInTable(
        <EmployeeRow
          employee={employee}
          isCurrentUserAdmin={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onBindGoogle={vi.fn()}
        />,
      )
      const adminTag = screen.getByText('管理員')
      const googleTag = screen.getByText('已綁定Google')
      // Both should be visible
      expect(adminTag).toBeTruthy()
      expect(googleTag).toBeTruthy()
    })
  })

  // ─── Bind Google button ────────────────────────────────────────────────────

  describe('Bind Google button', () => {
    it('shows bind button when current user is admin', () => {
      const employee = makeEmployee({ googleSub: undefined })
      renderInTable(
        <EmployeeRow
          employee={employee}
          isCurrentUserAdmin={true}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onBindGoogle={vi.fn()}
        />,
      )
      expect(screen.getByText('綁定Google')).toBeTruthy()
    })

    it('does not show bind button when current user is not admin', () => {
      const employee = makeEmployee({ googleSub: undefined })
      renderInTable(
        <EmployeeRow
          employee={employee}
          isCurrentUserAdmin={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onBindGoogle={vi.fn()}
        />,
      )
      expect(screen.queryByText('綁定Google')).toBeNull()
    })

    it('calls onBindGoogle with employee id when bind button is clicked', async () => {
      const user = userEvent.setup()
      const onBindGoogle = vi.fn()
      const employee = makeEmployee({ id: 'emp-001', googleSub: undefined })
      renderInTable(
        <EmployeeRow
          employee={employee}
          isCurrentUserAdmin={true}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onBindGoogle={onBindGoogle}
        />,
      )

      await user.click(screen.getByText('綁定Google'))

      expect(onBindGoogle).toHaveBeenCalledWith('emp-001')
    })

    it('hides bind button when employee already has googleSub bound', () => {
      const employee = makeEmployee({
        googleSub: 'already-bound-sub',
      })
      renderInTable(
        <EmployeeRow
          employee={employee}
          isCurrentUserAdmin={true}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onBindGoogle={vi.fn()}
        />,
      )
      // When already bound, no bind button
      expect(screen.queryByText('綁定Google')).toBeNull()
    })

    it('edit and delete buttons are always visible', () => {
      const employee = makeEmployee()
      renderInTable(
        <EmployeeRow
          employee={employee}
          isCurrentUserAdmin={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onBindGoogle={vi.fn()}
        />,
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
          isCurrentUserAdmin={false}
          onEdit={onEdit}
          onDelete={vi.fn()}
          onBindGoogle={vi.fn()}
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
          isCurrentUserAdmin={false}
          onEdit={vi.fn()}
          onDelete={onDelete}
          onBindGoogle={vi.fn()}
        />,
      )

      await user.click(screen.getByLabelText('刪除'))

      expect(onDelete).toHaveBeenCalledWith(employee)
    })
  })
})
