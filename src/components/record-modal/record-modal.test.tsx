import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Employee, Attendance } from '@/lib/schemas'
import { RecordModal } from './record-modal'

// ─── Mock Services ──────────────────────────────────────────────────────────

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
  avatar: 'images/aminals/doberman.png',
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

const vacationAttendance: Attendance = {
  id: 'att-002',
  employeeId: 'emp-001',
  date: '2026-03-21',
  clockIn: new Date('2026-03-21T08:00:00').getTime(),
  type: 'paid_leave',
}

const defaultAddProps = {
  open: true,
  mode: 'add' as const,
  employee: testEmployee,
  date: '2026-03-21',
  onCancel: vi.fn(),
  onSuccess: vi.fn(),
}

const defaultEditProps = {
  open: true,
  mode: 'edit' as const,
  employee: testEmployee,
  date: '2026-03-21',
  record: testAttendance,
  onCancel: vi.fn(),
  onSuccess: vi.fn(),
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('RecordModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Add mode', () => {
    it('should render with correct title for add mode', () => {
      render(<RecordModal {...defaultAddProps} />)
      // Modal title appears twice: sr-only + visual
      expect(screen.getAllByText('新增打卡紀錄')).toHaveLength(2)
    })

    it('should show employee avatar and name', () => {
      render(<RecordModal {...defaultAddProps} />)
      const avatar = screen.getByAltText('avatar')
      expect(avatar).toBeTruthy()
      expect(screen.getByText('Alex')).toBeTruthy()
    })

    it('should show the date', () => {
      render(<RecordModal {...defaultAddProps} />)
      expect(screen.getByText('2026-03-21')).toBeTruthy()
    })

    it('should default to regular attendance type', () => {
      render(<RecordModal {...defaultAddProps} />)
      const regularBtn = screen.getByRole('button', { name: '一般' })
      // Regular button should have active styling (bg-primary)
      expect(regularBtn.className).toContain('bg-primary')
    })

    it('should have empty time inputs by default', () => {
      render(<RecordModal {...defaultAddProps} />)
      const clockInInput = screen.getByLabelText('上班時間')
      const clockOutInput = screen.getByLabelText('下班時間')
      expect((clockInInput as HTMLInputElement).value).toBe('')
      expect((clockOutInput as HTMLInputElement).value).toBe('')
    })
  })

  describe('Edit mode', () => {
    it('should render with correct title for edit mode', () => {
      render(<RecordModal {...defaultEditProps} />)
      expect(screen.getAllByText('編輯打卡紀錄')).toHaveLength(2)
    })

    it('should pre-fill time inputs with existing record values', () => {
      render(<RecordModal {...defaultEditProps} />)
      const clockInInput = screen.getByLabelText('上班時間')
      const clockOutInput = screen.getByLabelText('下班時間')
      expect((clockInInput as HTMLInputElement).value).toBe('08:00')
      expect((clockOutInput as HTMLInputElement).value).toBe('17:00')
    })

    it('should pre-fill vacation type when record is not regular', () => {
      render(<RecordModal {...defaultEditProps} record={vacationAttendance} />)
      const vacationBtn = screen.getByRole('button', { name: '休假' })
      expect(vacationBtn.className).toContain('bg-red-500')
    })

    it('should show delete button only in edit mode', () => {
      render(<RecordModal {...defaultEditProps} />)
      expect(screen.getByRole('button', { name: '刪除' })).toBeTruthy()
    })

    it('should not show delete button in add mode', () => {
      render(<RecordModal {...defaultAddProps} />)
      expect(screen.queryByRole('button', { name: '刪除' })).toBeNull()
    })
  })

  describe('Type toggle', () => {
    it('should toggle between regular and vacation types', async () => {
      const user = userEvent.setup()
      render(<RecordModal {...defaultAddProps} />)

      const vacationBtn = screen.getByRole('button', { name: '休假' })
      await user.click(vacationBtn)

      // Vacation button should now be active
      expect(vacationBtn.className).toContain('bg-red-500')

      // Regular button should be inactive
      const regularBtn = screen.getByRole('button', { name: '一般' })
      expect(regularBtn.className).toContain('bg-muted')
    })

    it('should disable clockOut input when vacation is selected', async () => {
      const user = userEvent.setup()
      render(<RecordModal {...defaultAddProps} />)

      const vacationBtn = screen.getByRole('button', { name: '休假' })
      await user.click(vacationBtn)

      const clockOutInput = screen.getByLabelText('下班時間')
      expect((clockOutInput as HTMLInputElement).disabled).toBe(true)
    })

    it('should re-enable clockOut input when switching back to regular', async () => {
      const user = userEvent.setup()
      render(<RecordModal {...defaultAddProps} />)

      // Switch to vacation
      await user.click(screen.getByRole('button', { name: '休假' }))
      // Switch back to regular
      await user.click(screen.getByRole('button', { name: '一般' }))

      const clockOutInput = screen.getByLabelText('下班時間')
      expect((clockOutInput as HTMLInputElement).disabled).toBe(false)
    })
  })

  describe('Validation', () => {
    it('should show validation error when clockOut is before clockIn', async () => {
      const user = userEvent.setup()
      render(<RecordModal {...defaultAddProps} />)

      const clockInInput = screen.getByLabelText('上班時間')
      const clockOutInput = screen.getByLabelText('下班時間')

      await user.clear(clockInInput)
      await user.type(clockInInput, '17:00')
      await user.clear(clockOutInput)
      await user.type(clockOutInput, '08:00')

      // Click save
      await user.click(screen.getByRole('button', { name: '儲存' }))

      await screen.findByText('下班時間必須晚於上班時間')
    })
  })

  describe('Save and callbacks', () => {
    it('should call onSuccess after successful save in add mode', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      render(<RecordModal {...defaultAddProps} onSuccess={onSuccess} />)

      const clockInInput = screen.getByLabelText('上班時間')
      await user.clear(clockInInput)
      await user.type(clockInInput, '08:00')

      await user.click(screen.getByRole('button', { name: '儲存' }))

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledOnce()
      })
    })

    it('should call onSuccess after successful save in edit mode', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      render(<RecordModal {...defaultEditProps} onSuccess={onSuccess} />)

      await user.click(screen.getByRole('button', { name: '儲存' }))

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledOnce()
      })
    })

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onCancel = vi.fn()
      render(<RecordModal {...defaultAddProps} onCancel={onCancel} />)

      await user.click(screen.getByRole('button', { name: '取消' }))

      expect(onCancel).toHaveBeenCalledOnce()
    })

    it('should call onSuccess after delete in edit mode', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      render(<RecordModal {...defaultEditProps} onSuccess={onSuccess} />)

      await user.click(screen.getByRole('button', { name: '刪除' }))

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledOnce()
      })
    })
  })

  describe('Shift badge', () => {
    it('should show shift badge when shiftNumber is provided', () => {
      render(<RecordModal {...defaultAddProps} shiftNumber={2} />)
      expect(screen.getByText('第 2 班')).toBeTruthy()
    })

    it('should not show shift badge when shiftNumber is not provided', () => {
      render(<RecordModal {...defaultAddProps} />)
      expect(screen.queryByText(/第.*班/)).toBeNull()
    })
  })

  describe('Edge cases', () => {
    it('should not render when open is false', () => {
      render(<RecordModal {...defaultAddProps} open={false} />)
      expect(screen.queryByText('新增打卡紀錄')).toBeNull()
    })

    it('should handle undefined record in edit mode gracefully', () => {
      const props = { ...defaultEditProps, record: undefined }
      render(<RecordModal {...props} />)
      // Should still render without crashing
      expect(screen.getAllByText('編輯打卡紀錄')).toHaveLength(2)
    })
  })
})
