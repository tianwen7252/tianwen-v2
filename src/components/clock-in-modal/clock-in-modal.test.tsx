import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Employee, Attendance } from '@/lib/schemas'
import { ClockInModal } from './clock-in-modal'
import type { ClockInAction } from './clock-in-modal'

// ─── Test Fixtures ──────────────────────────────────────────────────────────

const baseEmployee: Employee = {
  id: 'emp-001',
  name: 'Alex',
  avatar: 'images/aminals/doberman.png',
  status: 'active',
  shiftType: 'regular',
  employeeNo: 'E001',
  isAdmin: false,
  isDefaultOrderStaff: false,
  hireDate: '2024-01-15',
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

const adminEmployee: Employee = {
  ...baseEmployee,
  id: 'emp-admin',
  name: 'Admin Lee',
  isAdmin: true,
}

const baseAttendance: Attendance = {
  id: 'att-001',
  employeeId: 'emp-001',
  date: '2026-03-21',
  clockIn: new Date('2026-03-21T08:00:00').getTime(),
  type: 'regular',
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

const clockedOutAttendance: Attendance = {
  ...baseAttendance,
  clockOut: new Date('2026-03-21T17:00:00').getTime(),
}

const defaultProps = {
  open: true,
  employee: baseEmployee,
  action: 'clockIn' as ClockInAction,
  loading: false,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('ClockInModal', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-21T10:30:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return null when employee is null', () => {
    const { container } = render(
      <ClockInModal {...defaultProps} employee={null} />,
    )
    // ConfirmModal should not be rendered
    expect(container.innerHTML).toBe('')
  })

  it('should show correct title for clockIn action', () => {
    render(<ClockInModal {...defaultProps} action="clockIn" />)
    // Title appears twice: sr-only + visual
    expect(screen.getAllByText('確認 Alex 的上班打卡？')).toHaveLength(2)
  })

  it('should show correct title for clockOut action', () => {
    render(
      <ClockInModal
        {...defaultProps}
        action="clockOut"
        attendance={baseAttendance}
      />,
    )
    expect(screen.getAllByText('確認 Alex 的下班打卡？')).toHaveLength(2)
  })

  it('should show correct title for vacation action', () => {
    render(<ClockInModal {...defaultProps} action="vacation" />)
    expect(screen.getAllByText('確認 Alex 的休假打卡？')).toHaveLength(2)
  })

  it('should show correct title for cancelVacation action', () => {
    render(
      <ClockInModal
        {...defaultProps}
        action="cancelVacation"
        attendance={baseAttendance}
      />,
    )
    expect(screen.getAllByText('取消 Alex 的休假？')).toHaveLength(2)
  })

  it('should show employee name', () => {
    render(<ClockInModal {...defaultProps} />)
    // Name shown in modal card (distinct from title which also contains name)
    const nameElements = screen.getAllByText('Alex')
    expect(nameElements.length).toBeGreaterThanOrEqual(1)
  })

  it('should show employee avatar', () => {
    render(<ClockInModal {...defaultProps} />)
    const avatar = screen.getByAltText('avatar')
    expect(avatar).toBeTruthy()
    expect((avatar as HTMLImageElement).src).toContain(
      'images/aminals/doberman.png',
    )
  })

  it('should show admin label when employee.isAdmin is true', () => {
    render(<ClockInModal {...defaultProps} employee={adminEmployee} />)
    expect(screen.getByText('管理員')).toBeTruthy()
  })

  it('should not show admin label when employee.isAdmin is false', () => {
    render(<ClockInModal {...defaultProps} employee={baseEmployee} />)
    expect(screen.queryByText('管理員')).toBeNull()
  })

  it('should show re-clock-out hint when clockOut action and previous clockOut exists', () => {
    render(
      <ClockInModal
        {...defaultProps}
        action="clockOut"
        attendance={clockedOutAttendance}
      />,
    )
    expect(screen.getByText(/目前下班時間/)).toBeTruthy()
    expect(screen.getByText(/17:00/)).toBeTruthy()
  })

  it('should not show re-clock-out hint for clockIn action', () => {
    render(<ClockInModal {...defaultProps} action="clockIn" />)
    expect(screen.queryByText(/目前下班時間/)).toBeNull()
  })

  it('should show real-time clock format with AM/PM', () => {
    render(<ClockInModal {...defaultProps} action="clockIn" />)
    // System time is 10:30 AM
    expect(screen.getByText('10:30 AM')).toBeTruthy()
  })

  it('should update clock every second when modal is open', () => {
    render(<ClockInModal {...defaultProps} action="clockIn" />)
    expect(screen.getByText('10:30 AM')).toBeTruthy()

    // Advance both system time and timer by 1 second
    act(() => {
      vi.setSystemTime(new Date('2026-03-21T10:30:01'))
      vi.advanceTimersByTime(1000)
    })
    // Time display should remain consistent (same minute)
    expect(screen.getByText('10:30 AM')).toBeTruthy()

    // Advance system time and timers to next minute
    act(() => {
      vi.setSystemTime(new Date('2026-03-21T10:31:00'))
      vi.advanceTimersByTime(59 * 1000)
    })
    expect(screen.getByText('10:31 AM')).toBeTruthy()
  })

  it('should show vacation time label for vacation action', () => {
    render(<ClockInModal {...defaultProps} action="vacation" />)
    expect(screen.getByText('休假時間')).toBeTruthy()
  })

  it('should show vacation clock-in time for cancelVacation action', () => {
    render(
      <ClockInModal
        {...defaultProps}
        action="cancelVacation"
        attendance={baseAttendance}
      />,
    )
    expect(screen.getByText('休假打卡時間')).toBeTruthy()
    // Should show the attendance clockIn time formatted
    expect(screen.getByText('08:00 AM')).toBeTruthy()
  })

  it('should show shift type label', () => {
    render(<ClockInModal {...defaultProps} />)
    expect(screen.getByText('班別類型')).toBeTruthy()
    expect(screen.getByText('常日班')).toBeTruthy()
  })

  it('should show correct shift type for shift employees', () => {
    const shiftEmployee: Employee = { ...baseEmployee, shiftType: 'shift' }
    render(<ClockInModal {...defaultProps} employee={shiftEmployee} />)
    expect(screen.getByText('排班')).toBeTruthy()
  })

  it('should show correct confirm button text for each action', () => {
    const { rerender } = render(
      <ClockInModal {...defaultProps} action="clockIn" />,
    )
    expect(screen.getByText('確認打卡')).toBeTruthy()

    rerender(<ClockInModal {...defaultProps} action="clockOut" />)
    expect(screen.getByText('確認下班')).toBeTruthy()

    rerender(<ClockInModal {...defaultProps} action="vacation" />)
    expect(screen.getByText('確認休假')).toBeTruthy()

    rerender(<ClockInModal {...defaultProps} action="cancelVacation" />)
    expect(screen.getByText('確認取消')).toBeTruthy()
  })

  it('should call onConfirm when confirm button is clicked', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<ClockInModal {...defaultProps} onConfirm={onConfirm} />)
    await user.click(screen.getByText('確認打卡'))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('should call onCancel when cancel button is clicked', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<ClockInModal {...defaultProps} onCancel={onCancel} />)
    await user.click(screen.getByText('取消'))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('should not render content when open is false', () => {
    render(<ClockInModal {...defaultProps} open={false} />)
    expect(screen.queryByText('Alex')).toBeNull()
  })

  it('should show "?? : ??" when cancelVacation attendance has no clockIn', () => {
    const noClockInAttendance: Attendance = {
      ...baseAttendance,
      clockIn: undefined,
    }
    render(
      <ClockInModal
        {...defaultProps}
        action="cancelVacation"
        attendance={noClockInAttendance}
      />,
    )
    expect(screen.getByText('?? : ??')).toBeTruthy()
  })
})
