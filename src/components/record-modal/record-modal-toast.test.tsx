import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Employee, Attendance } from '@/lib/schemas'
import { RecordModal } from './record-modal'

// Mock notify to capture toast calls
const mockNotify = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}))

vi.mock('@/components/ui/sonner', () => ({
  notify: mockNotify,
}))

// Mock API
vi.mock('@/lib/repositories', () => ({
  getAttendanceRepo: () => ({
    create: vi.fn(async () => ({
      id: 'att-new',
      employeeId: 'emp-001',
      date: '2026-03-21',
      clockIn: 1742536800000,
      clockOut: 1742569200000,
      type: 'regular',
    })),
    update: vi.fn(async () => ({
      id: 'att-001',
      employeeId: 'emp-001',
      date: '2026-03-21',
      clockIn: 1742536800000,
      clockOut: 1742569200000,
      type: 'regular',
    })),
    remove: vi.fn(async () => true),
  }),
}))

// ─── Test Fixtures ──────────────────────────────────────────────────────────

const testEmployee: Employee = {
  id: 'emp-001',
  name: 'Alex',
  avatar: 'images/aminals/1308845.png',
  status: 'active',
  shiftType: 'regular',
  employeeNo: 'E001',
  isAdmin: false,
  hireDate: '2024-01-15',
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

const testAttendance: Attendance = {
  id: 'att-001',
  employeeId: 'emp-001',
  date: '2026-03-21',
  clockIn: new Date('2026-03-21T08:00:00').getTime(),
  clockOut: new Date('2026-03-21T17:00:00').getTime(),
  type: 'regular',
}

describe('RecordModal — Toast Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show success toast after adding a record', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    render(
      <RecordModal
        open={true}
        mode="add"
        employee={testEmployee}
        date="2026-03-21"
        onCancel={vi.fn()}
        onSuccess={onSuccess}
      />,
    )

    const clockInInput = screen.getByLabelText('上班時間')
    await user.clear(clockInInput)
    await user.type(clockInInput, '08:00')

    await user.click(screen.getByRole('button', { name: '儲存' }))

    await waitFor(() => {
      expect(mockNotify.success).toHaveBeenCalledWith('出勤記錄已新增')
    })
  })

  it('should show success toast after updating a record', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    render(
      <RecordModal
        open={true}
        mode="edit"
        employee={testEmployee}
        date="2026-03-21"
        record={testAttendance}
        onCancel={vi.fn()}
        onSuccess={onSuccess}
      />,
    )

    await user.click(screen.getByRole('button', { name: '儲存' }))

    await waitFor(() => {
      expect(mockNotify.success).toHaveBeenCalledWith('出勤記錄已更新')
    })
  })

  it('should show success toast after deleting a record', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    render(
      <RecordModal
        open={true}
        mode="edit"
        employee={testEmployee}
        date="2026-03-21"
        record={testAttendance}
        onCancel={vi.fn()}
        onSuccess={onSuccess}
      />,
    )

    await user.click(screen.getByRole('button', { name: '刪除' }))

    await waitFor(() => {
      expect(mockNotify.success).toHaveBeenCalledWith('出勤記錄已刪除')
    })
  })

  it('should NOT show toast when form validation fails', async () => {
    const user = userEvent.setup()
    render(
      <RecordModal
        open={true}
        mode="add"
        employee={testEmployee}
        date="2026-03-21"
        onCancel={vi.fn()}
        onSuccess={vi.fn()}
      />,
    )

    const clockInInput = screen.getByLabelText('上班時間')
    const clockOutInput = screen.getByLabelText('下班時間')

    await user.clear(clockInInput)
    await user.type(clockInInput, '17:00')
    await user.clear(clockOutInput)
    await user.type(clockOutInput, '08:00')

    await user.click(screen.getByRole('button', { name: '儲存' }))

    // Validation error should prevent toast
    expect(mockNotify.success).not.toHaveBeenCalled()
  })

  it('should NOT show toast when cancel is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <RecordModal
        open={true}
        mode="add"
        employee={testEmployee}
        date="2026-03-21"
        onCancel={onCancel}
        onSuccess={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: '取消' }))

    expect(mockNotify.success).not.toHaveBeenCalled()
  })
})
