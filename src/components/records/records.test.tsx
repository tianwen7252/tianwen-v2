import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Employee, Attendance } from '@/lib/schemas'

// ─── Mock Services ──────────────────────────────────────────────────────────

const mockEmployees: Employee[] = [
  {
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
  },
  {
    id: 'emp-002',
    name: 'Mia',
    avatar: 'images/aminals/780258.png',
    status: 'active',
    shiftType: 'regular',
    employeeNo: 'E002',
    isAdmin: false,
    hireDate: '2024-03-01',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

const mockAttendances: Attendance[] = [
  {
    id: 'att-001',
    employeeId: 'emp-001',
    date: '2026-03-21',
    clockIn: new Date('2026-03-21T08:00:00').getTime(),
    clockOut: new Date('2026-03-21T17:00:00').getTime(),
    type: 'regular',
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
      date: '2026-03-21',
      clockIn: 1742536800000,
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

  it('should render search input', () => {
    render(<Records />)
    expect(screen.getByPlaceholderText('搜尋員工姓名')).toBeTruthy()
  })

  it('should filter employees by search', async () => {
    const user = userEvent.setup()
    render(<Records />)

    // Wait for data to load
    await screen.findByText('Alex')

    const searchInput = screen.getByPlaceholderText('搜尋員工姓名')
    await user.type(searchInput, 'Alex')

    // Should still show Alex in the header
    expect(screen.getByText('Alex')).toBeTruthy()
    // Mia should be filtered out (not in employee headers)
    // The name may still appear elsewhere, but not in table headers
    expect(screen.queryByText('Mia')).toBeNull()
  })

  it('should render year select with options', () => {
    render(<Records />)
    const yearSelect = screen.getByDisplayValue(/年/)
    expect(yearSelect).toBeTruthy()
  })

  it('should render month select with options', () => {
    render(<Records />)
    const monthSelect = screen.getByDisplayValue(/月/)
    expect(monthSelect).toBeTruthy()
  })

  it('should update data when year select changes', async () => {
    const user = userEvent.setup()
    render(<Records />)

    const yearSelect = screen.getByDisplayValue(/年/)
    await user.selectOptions(yearSelect, '2025')

    // Data should refresh (service is called)
    expect(mockRepos.attendanceRepo.findByMonth).toHaveBeenCalled()
  })

  it('should update data when month select changes', async () => {
    const user = userEvent.setup()
    render(<Records />)

    const monthSelect = screen.getByDisplayValue(/月/)
    await user.selectOptions(monthSelect, '1')

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
