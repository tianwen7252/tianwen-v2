import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Employee, Attendance } from '@/lib/schemas'

// ─── Mock Services ──────────────────────────────────────────────────────────

const mockEmployees: Employee[] = [
  {
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
  },
  {
    id: 'emp-002',
    name: 'Mia',
    avatar: 'images/aminals/puppy.png',
    status: 'active',
    shiftType: 'regular',
    employeeNo: 'E002',
    isAdmin: false,
    isDefaultOrderStaff: false,
    hireDate: '2024-03-01',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

// Use today's date so the attendance appears in the default (current month) view
const todayStr = new Date().toISOString().slice(0, 10)

const mockAttendances: Attendance[] = [
  {
    id: 'att-001',
    employeeId: 'emp-001',
    date: todayStr,
    clockIn: new Date(`${todayStr}T08:00:00`).getTime(),
    clockOut: new Date(`${todayStr}T17:00:00`).getTime(),
    type: 'regular',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

const mockRepos = vi.hoisted(() => ({
  employeeRepo: {
    findByStatus: vi.fn(async () => [] as Employee[]),
  },
  attendanceRepo: {
    findByMonth: vi.fn(async () => [] as Attendance[]),
    create: vi.fn(async () => ({
      id: 'att-new',
      employeeId: 'emp-001',
      date: todayStr,
      clockIn: new Date(`${todayStr}T08:00:00`).getTime(),
      type: 'regular' as const,
    })),
    update: vi.fn(async () => undefined),
    remove: vi.fn(async () => true),
  },
}))

vi.mock('@/lib/repositories', () => ({
  getEmployeeRepo: () => mockRepos.employeeRepo,
  getAttendanceRepo: () => mockRepos.attendanceRepo,
}))

// Import after mocks
import { Records } from './records'

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Records', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRepos.employeeRepo.findByStatus.mockResolvedValue(mockEmployees)
    mockRepos.attendanceRepo.findByMonth.mockResolvedValue(mockAttendances)
  })

  it('should render the title', () => {
    render(<Records />)
    expect(screen.getByText('員工考勤狀況')).toBeTruthy()
  })

  it('should render table view by default', () => {
    render(<Records />)
    // Table view button should be active
    const tableBtn = screen.getByRole('button', { name: /表格/ })
    expect(tableBtn.className).toContain('bg-card')
  })

  it('should toggle between table and calendar views', async () => {
    const user = userEvent.setup()
    render(<Records />)

    // Switch to calendar
    const calendarBtn = screen.getByRole('button', { name: /月曆/ })
    await user.click(calendarBtn)
    expect(calendarBtn.className).toContain('bg-card')

    // Calendar view should show weekday headers
    expect(screen.getByText('週日')).toBeTruthy()

    // Switch back to table
    const tableBtn = screen.getByRole('button', { name: /表格/ })
    await user.click(tableBtn)
    expect(tableBtn.className).toContain('bg-card')
  })

  it('should render employee select with "全部員工" default', () => {
    render(<Records />)
    expect(screen.getByText('全部員工')).toBeTruthy()
  })

  it('should render year and month selects', () => {
    render(<Records />)
    // shadcn Select renders trigger buttons with text values
    const triggers = screen.getAllByRole('combobox')
    expect(triggers.length).toBeGreaterThanOrEqual(3)
  })

  it('should fetch attendance data on mount', () => {
    render(<Records />)
    expect(mockRepos.attendanceRepo.findByMonth).toHaveBeenCalled()
  })

  it('should render "今天" button', () => {
    render(<Records />)
    expect(screen.getByRole('button', { name: '今天' })).toBeTruthy()
  })

  it('should show hint text about editing', () => {
    render(<Records />)
    expect(screen.getByText('點擊儲存格即可直接編輯打卡時間')).toBeTruthy()
  })

  it('should open RecordModal when cell interaction triggers add', async () => {
    const user = userEvent.setup()
    render(<Records />)

    // Wait for data to load
    const emptyCells = await screen.findAllByText('未打卡')

    // Click on an empty "未打卡" cell to trigger add
    await user.click(emptyCells[0]!)
    // RecordModal should appear with add title
    expect(screen.getAllByText('新增打卡紀錄')).toHaveLength(2)
  })

  it('should open RecordModal when cell interaction triggers edit', async () => {
    const user = userEvent.setup()
    render(<Records />)

    // Wait for data to load
    const timeRange = await screen.findByText('08:00 - 17:00')

    // Click on an attendance card to trigger edit
    await user.click(timeRange)
    expect(screen.getAllByText('編輯打卡紀錄')).toHaveLength(2)
  })

  // Font size compliance tests — project rule: no text-sm or smaller
  it('should not use text-sm or smaller on filter bar or hint elements', () => {
    const { container } = render(<Records />)
    const allElements = container.querySelectorAll('*')
    const forbidden = [
      'text-sm',
      'text-xs',
      'text-[10px]',
      'text-[11px]',
      'text-[12px]',
      'text-[13px]',
    ]
    allElements.forEach(el => {
      const cls = el.className ?? ''
      forbidden.forEach(f => {
        expect(
          cls,
          `Element has forbidden font class "${f}": ${cls}`,
        ).not.toContain(f)
      })
    })
  })

  it('should not use font-semibold on any rendered element in Records', () => {
    const { container } = render(<Records />)
    const allElements = container.querySelectorAll('*')
    allElements.forEach(el => {
      const cls = el.className ?? ''
      expect(
        cls,
        `Element has forbidden class "font-semibold": ${cls}`,
      ).not.toContain('font-semibold')
    })
  })
})
