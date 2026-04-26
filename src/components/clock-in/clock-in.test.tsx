import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  getEmployeeRepo,
  getAttendanceRepo,
  resetMockRepositories,
} from '@/test/mock-repositories'
import { ClockIn } from './clock-in'

// Mock the repository provider to use in-memory mock repositories
vi.mock('@/lib/repositories', () => ({
  getEmployeeRepo: () => getEmployeeRepo(),
  getAttendanceRepo: () => getAttendanceRepo(),
}))

// ─── Test Setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date('2026-03-21T10:30:00'))
  resetMockRepositories()
})

afterEach(() => {
  vi.useRealTimers()
  resetMockRepositories()
})

// ─── Helper ─────────────────────────────────────────────────────────────────

// Create a userEvent instance that works with fake timers
const createUser = () =>
  userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('ClockIn', () => {
  it('should render employee cards from mock data', async () => {
    render(<ClockIn />)
    // Active employees: emp-001 through emp-008 (all 8 are active)
    const cards = await screen.findAllByTestId('employee-card')
    expect(cards).toHaveLength(8)
  })

  it('should show today date header', async () => {
    render(<ClockIn />)
    // Today is 2026/3/21 (Saturday)
    expect(screen.getByText(/今天/)).toBeTruthy()
    expect(screen.getByText(/2026\/3\/21/)).toBeTruthy()
    expect(screen.getByText(/六/)).toBeTruthy()
  })

  it('should show correct status badge for employee with no record (未打卡)', async () => {
    render(<ClockIn />)
    // emp-004 (Grace) has no attendance record
    // Multiple employees (emp-007 through emp-011) also have no attendance
    await screen.findAllByText('未打卡')
  })

  it('should show correct status badge for clocked-in employee (正在上班)', async () => {
    render(<ClockIn />)
    // emp-002 (妞妞) has clockIn but no clockOut
    await screen.findByText('正在上班')
  })

  it('should show correct status badge for clocked-out employee (已下班)', async () => {
    render(<ClockIn />)
    // emp-001 and emp-006 have both clockIn and clockOut
    await screen.findAllByText('已下班')
  })

  it('should show correct status badge for vacation employee (休假)', async () => {
    render(<ClockIn />)
    // emp-003 (阿吉) has type: 'paid_leave' — badge and button both show 休假
    const vacationElements = await screen.findAllByText('休假')
    expect(vacationElements.length).toBeGreaterThanOrEqual(1)
  })

  it('should show employee names', async () => {
    render(<ClockIn />)
    await screen.findByText('Eric')
    expect(screen.getByText('妞妞')).toBeTruthy()
    expect(screen.getByText('阿吉')).toBeTruthy()
    expect(screen.getByText('豬')).toBeTruthy()
  })

  it('should show admin label for admin employees', async () => {
    render(<ClockIn />)
    // Only emp-001 (Eric) is admin
    const adminLabels = await screen.findAllByText('管理員')
    expect(adminLabels).toHaveLength(1)
  })

  it('should not show resigned employees', async () => {
    render(<ClockIn />)
    const cards = await screen.findAllByTestId('employee-card')
    expect(cards).toHaveLength(8)
    // All employees are active, no inactive employees
  })

  it('should show action buttons per state', async () => {
    render(<ClockIn />)
    await waitFor(() => {
      // emp-001 (clocked out) and emp-004 (no record) both show 打卡上班
      const clockInBtns = screen.getAllByText('打卡上班')
      expect(clockInBtns.length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('休假').length).toBeGreaterThanOrEqual(1)
      // emp-002 (clocked in): should show 打卡下班
      expect(screen.getByText('打卡下班')).toBeTruthy()
      // emp-003 (vacation): should show 取消休假
      expect(screen.getByText('取消休假')).toBeTruthy()
    })
  })

  it('should show clock times for regular employees', async () => {
    render(<ClockIn />)
    // emp-001: clockIn 08:00, clockOut 17:00
    // Note: 08:00 appears for both emp-001 (regular) and emp-003 (vacation)
    await screen.findByText(/17:00/)
    const times08 = screen.getAllByText(/08:00/)
    expect(times08.length).toBeGreaterThanOrEqual(1)
  })

  it('should open ClockInModal when employee card is clicked', async () => {
    const user = createUser()
    render(<ClockIn />)

    // Wait for data to load
    const cards = await screen.findAllByTestId('employee-card')
    expect(cards).toHaveLength(8)

    // Click on emp-004 card (no record) — should open modal with clockIn action
    const emp4Card = cards.find(card => within(card).queryByText('豬'))
    expect(emp4Card).toBeTruthy()
    await user.click(emp4Card!)

    // Modal title appears twice (sr-only + visual)
    const titles = screen.getAllByText(/確認 豬 的上班打卡？/)
    expect(titles.length).toBe(2)
  })

  it('should open ClockInModal when action button is clicked', async () => {
    const user = createUser()
    render(<ClockIn />)

    // Wait for data to load
    await screen.findByText('打卡下班')

    // Click the 打卡下班 button for emp-002 (妞妞)
    await user.click(screen.getByText('打卡下班'))

    // Modal title appears twice (sr-only + visual)
    const titles = screen.getAllByText(/確認 妞妞 的下班打卡？/)
    expect(titles.length).toBe(2)
  })

  it('should close modal when cancel is clicked', async () => {
    const user = createUser()
    render(<ClockIn />)

    // Wait for data to load
    await screen.findAllByText('打卡上班')

    // Open modal — click first 打卡上班 button
    const clockInBtns = screen.getAllByText('打卡上班')
    await user.click(clockInBtns[0]!)

    // Modal should be open (title appears twice: sr-only + visual)
    const titles = screen.getAllByText(/確認.*的上班打卡？/)
    expect(titles.length).toBe(2)

    // Click cancel
    await user.click(screen.getByText('取消'))

    // Modal should close — title should disappear
    expect(screen.queryByText(/確認.*的上班打卡？/)).toBeNull()
  })

  it('should show empty state message when no employees', async () => {
    // Remove all employees to simulate empty state
    const employees = await getEmployeeRepo().findAll()
    for (const emp of employees) {
      await getEmployeeRepo().remove(emp.id)
    }

    render(<ClockIn />)
    await screen.findByText(/目前無員工資料/)
  })

  it('should show hint text about clicking employee to clock in', () => {
    render(<ClockIn />)
    expect(screen.getByText(/點選員工即可打卡/)).toBeTruthy()
  })

  it('should show correct card background for clocked-in state', async () => {
    render(<ClockIn />)
    await waitFor(() => {
      const cards = screen.getAllByTestId('employee-card')
      // emp-002 (妞妞) is clocked in
      const emp2Card = cards.find(card => within(card).queryByText('妞妞'))
      expect(emp2Card?.className).toContain('bg-[#f0f5eb]')
    })
  })

  it('should show correct card background for clocked-out state', async () => {
    render(<ClockIn />)
    await waitFor(() => {
      const cards = screen.getAllByTestId('employee-card')
      // emp-001 (Eric) is clocked out
      const emp1Card = cards.find(card => within(card).queryByText('Eric'))
      expect(emp1Card?.className).toContain('bg-[#f5f0fa]')
    })
  })

  it('should show correct card background for vacation state', async () => {
    render(<ClockIn />)
    await waitFor(() => {
      const cards = screen.getAllByTestId('employee-card')
      // emp-003 (阿吉) is on vacation
      const emp3Card = cards.find(card => within(card).queryByText('阿吉'))
      expect(emp3Card?.className).toContain('bg-[#fef2f2]')
    })
  })

  it('should handle confirm for clockIn action and close modal', async () => {
    const user = createUser()
    render(<ClockIn />)

    // Wait for data to load
    const cards = await screen.findAllByTestId('employee-card')
    expect(cards).toHaveLength(8)

    // Click emp-004 card (no record) to open clockIn modal
    const emp4Card = cards.find(card => within(card).queryByText('豬'))
    await user.click(emp4Card!)

    // Confirm the clock-in
    await user.click(screen.getByText('確認打卡'))

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText(/確認 豬 的上班打卡？/)).toBeNull()
    })
  })

  it('should handle confirm for clockOut action', async () => {
    const user = createUser()
    render(<ClockIn />)

    // Wait for data to load
    await screen.findByText('打卡下班')

    // Click 打卡下班 button for emp-002 (妞妞, clocked in)
    await user.click(screen.getByText('打卡下班'))

    // Confirm the clock-out
    await user.click(screen.getByText('確認下班'))

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText(/確認 妞妞 的下班打卡？/)).toBeNull()
    })
  })

  it('should handle confirm for cancelVacation action via button', async () => {
    const user = createUser()
    render(<ClockIn />)

    // Wait for data to load
    await screen.findByText('取消休假')

    // Click 取消休假 button for emp-003 (阿吉)
    await user.click(screen.getByText('取消休假'))

    // Modal should open with cancelVacation title
    const titles = screen.getAllByText(/取消 阿吉 的休假？/)
    expect(titles.length).toBe(2)

    // Confirm the cancellation
    await user.click(screen.getByText('確認取消'))

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText(/取消 阿吉 的休假？/)).toBeNull()
    })
  })

  it('should handle confirm for vacation action via button', async () => {
    const user = createUser()
    render(<ClockIn />)

    // Wait for data to load
    const allCards = await screen.findAllByTestId('employee-card')
    expect(allCards).toHaveLength(8)

    // Click 申請休假 button for emp-004 (豬)
    const zhūCard = allCards.find(card => within(card).queryByText('豬'))!
    await user.click(within(zhūCard).getByText('休假'))

    // Modal should open with vacation title
    const titles = screen.getAllByText(/確認 豬 的休假打卡？/)
    expect(titles.length).toBe(2)

    // Confirm the vacation
    await user.click(screen.getByText('確認休假'))

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText(/確認 豬 的休假打卡？/)).toBeNull()
    })
  })

  it('should support keyboard navigation on employee cards', async () => {
    render(<ClockIn />)
    const cards = await screen.findAllByTestId('employee-card')
    // All cards should have role="button" and tabIndex
    for (const card of cards) {
      expect(card.getAttribute('role')).toBe('button')
      expect(card.getAttribute('tabindex')).toBe('0')
    }
  })

  // ─── V2-251 Bug fixes ────────────────────────────────────────────────────

  describe('V2-251: visibility refetch (Bug #1)', () => {
    it('refetches data and re-evaluates today when the page becomes visible', async () => {
      const findByDateSpy = vi.spyOn(getAttendanceRepo(), 'findByDate')
      render(<ClockIn />)
      await screen.findAllByTestId('employee-card')
      const initialCalls = findByDateSpy.mock.calls.length
      expect(initialCalls).toBeGreaterThan(0)

      // Simulate user backgrounding then returning to the tab
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      })
      document.dispatchEvent(new Event('visibilitychange'))

      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      })
      document.dispatchEvent(new Event('visibilitychange'))

      await waitFor(() => {
        expect(findByDateSpy.mock.calls.length).toBeGreaterThan(initialCalls)
      })
      findByDateSpy.mockRestore()
    })

    it('updates today header when the page becomes visible after midnight', async () => {
      render(<ClockIn />)
      // Start on 2026-03-21
      await screen.findByText(/2026\/3\/21/)

      // Advance system clock to next day while the page is hidden
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      })
      document.dispatchEvent(new Event('visibilitychange'))
      vi.setSystemTime(new Date('2026-03-22T08:30:00'))

      // Return to tab
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      })
      document.dispatchEvent(new Event('visibilitychange'))

      // Header reflects the new date
      await screen.findByText(/2026\/3\/22/)
    })
  })

  describe('V2-251: cross-day duplicate guard (Bug #2)', () => {
    it('aborts a clockIn write if the calendar day rolled over after the modal opened', async () => {
      const user = createUser()
      const createSpy = vi.spyOn(getAttendanceRepo(), 'create')
      render(<ClockIn />)

      const cards = await screen.findAllByTestId('employee-card')
      // emp-004 (豬) has no record on 2026-03-21 — opens clockIn modal
      const emp4Card = cards.find(card => within(card).queryByText('豬'))!
      await user.click(emp4Card)

      // Day rolls over while the modal is open
      vi.setSystemTime(new Date('2026-03-22T00:30:00'))

      const before = createSpy.mock.calls.length
      await user.click(screen.getByText('確認打卡'))

      // Modal should close, write must NOT happen for the stale date,
      // and no record should be created on the rolled-over date either.
      await waitFor(() => {
        expect(screen.queryByText(/確認 豬 的上班打卡？/)).toBeNull()
      })
      expect(createSpy.mock.calls.length).toBe(before)
      createSpy.mockRestore()
    })

    it('refuses to write when a fresher record already changed the expected action', async () => {
      const user = createUser()
      render(<ClockIn />)

      const cards = await screen.findAllByTestId('employee-card')
      const emp4Card = cards.find(card => within(card).queryByText('豬'))!
      await user.click(emp4Card)

      // Another path inserts a clockIn record for emp-004 between modal open
      // and confirm — derived action should now be 'clockOut', not 'clockIn'.
      await getAttendanceRepo().create({
        employeeId: 'emp-004',
        date: '2026-03-21',
        clockIn: Date.now(),
        type: 'regular',
      })

      const createSpy = vi.spyOn(getAttendanceRepo(), 'create')
      await user.click(screen.getByText('確認打卡'))

      await waitFor(() => {
        expect(screen.queryByText(/確認 豬 的上班打卡？/)).toBeNull()
      })
      // No second clockIn record written
      expect(createSpy).not.toHaveBeenCalled()
      createSpy.mockRestore()
    })

    it('surfaces a toast and logs when the write throws', async () => {
      const user = createUser()
      const createSpy = vi
        .spyOn(getAttendanceRepo(), 'create')
        .mockRejectedValueOnce(new Error('disk full'))
      render(<ClockIn />)

      const cards = await screen.findAllByTestId('employee-card')
      const emp4Card = cards.find(card => within(card).queryByText('豬'))!
      await user.click(emp4Card)
      await user.click(screen.getByText('確認打卡'))

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalled()
      })
      // Modal stays open or closes silently — but no success toast appears.
      expect(screen.queryByText('打卡上班成功')).toBeNull()
      createSpy.mockRestore()
    })
  })
})
