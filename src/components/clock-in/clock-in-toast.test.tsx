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

// Mock notify to capture toast calls
const mockNotify = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}))

vi.mock('@/components/ui/sonner', () => ({
  notify: mockNotify,
}))

describe('ClockIn — Toast Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetMockRepositories()
  })

  afterEach(() => {
    resetMockRepositories()
  })

  it('should show success toast after clock-in', async () => {
    const user = userEvent.setup()
    render(<ClockIn />)

    // Wait for data to load
    const cards = await screen.findAllByTestId('employee-card')
    expect(cards).toHaveLength(8)

    // Click employee card with no record (emp-004 - 豬)
    const emp4Card = cards.find(card => within(card).queryByText('豬'))
    await user.click(emp4Card!)

    // Confirm clock-in
    await user.click(screen.getByText('確認打卡'))

    await waitFor(() => {
      expect(mockNotify.success).toHaveBeenCalledWith('打卡上班成功')
    })
  })

  it('should show success toast after clock-out', async () => {
    const user = userEvent.setup()
    render(<ClockIn />)

    // Wait for data to load
    await screen.findByText('打卡下班')

    // Click 打卡下班 button for emp-002 (clocked in)
    await user.click(screen.getByText('打卡下班'))

    // Confirm clock-out
    await user.click(screen.getByText('確認下班'))

    await waitFor(() => {
      expect(mockNotify.success).toHaveBeenCalledWith('打卡下班成功')
    })
  })

  it('should show success toast after vacation', async () => {
    const user = userEvent.setup()
    render(<ClockIn />)

    // Wait for data to load
    const allCards = await screen.findAllByTestId('employee-card')
    expect(allCards).toHaveLength(8)

    // Click 申請休假 button for emp-004 (豬)
    const graceCard = allCards.find(card => within(card).queryByText('豬'))!
    await user.click(within(graceCard).getByText('休假'))

    // Confirm vacation
    await user.click(screen.getByText('確認休假'))

    await waitFor(() => {
      expect(mockNotify.success).toHaveBeenCalledWith('休假申請成功')
    })
  })

  it('should show success toast after cancel vacation', async () => {
    const user = userEvent.setup()
    render(<ClockIn />)

    // Wait for data to load
    await screen.findByText('取消休假')

    // Click 取消休假 button for emp-003
    await user.click(screen.getByText('取消休假'))

    // Confirm cancel vacation
    await user.click(screen.getByText('確認取消'))

    await waitFor(() => {
      expect(mockNotify.success).toHaveBeenCalledWith('已取消休假')
    })
  })

  it('should NOT show toast when modal is cancelled', async () => {
    const user = userEvent.setup()
    render(<ClockIn />)

    // Wait for data to load
    await screen.findAllByText('打卡上班')

    // Open modal
    const clockInBtns = screen.getAllByText('打卡上班')
    await user.click(clockInBtns[0]!)

    // Cancel
    await user.click(screen.getByText('取消'))

    expect(mockNotify.success).not.toHaveBeenCalled()
  })
})
