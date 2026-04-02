import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SwUpdatePrompt } from './sw-update-prompt'
import { useSwUpdate } from '@/hooks/use-sw-update'

const mockUpdateApp = vi.fn()
const mockDismissPrompt = vi.fn()

const mockNotify = vi.hoisted(() => ({
  info: vi.fn(),
}))

vi.mock('@/hooks/use-sw-update', () => ({
  useSwUpdate: vi.fn(() => ({
    needRefresh: false,
    offlineReady: false,
    updateApp: mockUpdateApp,
    dismissPrompt: mockDismissPrompt,
  })),
}))

vi.mock('@/components/ui/sonner', () => ({
  notify: mockNotify,
}))

const mockUseSwUpdate = vi.mocked(useSwUpdate)

describe('SwUpdatePrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSwUpdate.mockReturnValue({
      needRefresh: false,
      offlineReady: false,
      updateApp: mockUpdateApp,
      dismissPrompt: mockDismissPrompt,
    })
  })

  it('should render nothing when no update and not offline ready', () => {
    const { container } = render(<SwUpdatePrompt />)
    // ConfirmModal with open=false renders nothing visible
    expect(container.textContent).toBe('')
  })

  it('should show ConfirmModal with update title when needRefresh is true', () => {
    mockUseSwUpdate.mockReturnValue({
      needRefresh: true,
      offlineReady: false,
      updateApp: mockUpdateApp,
      dismissPrompt: mockDismissPrompt,
    })

    render(<SwUpdatePrompt />)

    // ConfirmModal renders title in multiple places; use getAllByText
    const titles = screen.getAllByText('有新版本可用')
    expect(titles.length).toBeGreaterThan(0)
  })

  it('should show "更新" and "稍後" buttons in ConfirmModal', () => {
    mockUseSwUpdate.mockReturnValue({
      needRefresh: true,
      offlineReady: false,
      updateApp: mockUpdateApp,
      dismissPrompt: mockDismissPrompt,
    })

    render(<SwUpdatePrompt />)

    expect(screen.getByText('更新')).toBeDefined()
    expect(screen.getByText('稍後')).toBeDefined()
  })

  it('should call notify.info when offlineReady is true', () => {
    mockUseSwUpdate.mockReturnValue({
      needRefresh: false,
      offlineReady: true,
      updateApp: mockUpdateApp,
      dismissPrompt: mockDismissPrompt,
    })

    render(<SwUpdatePrompt />)

    expect(mockNotify.info).toHaveBeenCalledWith('已可離線使用', {
      position: 'top-center',
    })
    expect(mockDismissPrompt).toHaveBeenCalled()
  })

  it('should call updateApp when clicking "更新"', async () => {
    const user = userEvent.setup()

    mockUseSwUpdate.mockReturnValue({
      needRefresh: true,
      offlineReady: false,
      updateApp: mockUpdateApp,
      dismissPrompt: mockDismissPrompt,
    })

    render(<SwUpdatePrompt />)

    await user.click(screen.getByText('更新'))

    expect(mockUpdateApp).toHaveBeenCalledOnce()
  })

  it('should call dismissPrompt when clicking "稍後"', async () => {
    const user = userEvent.setup()

    mockUseSwUpdate.mockReturnValue({
      needRefresh: true,
      offlineReady: false,
      updateApp: mockUpdateApp,
      dismissPrompt: mockDismissPrompt,
    })

    render(<SwUpdatePrompt />)

    await user.click(screen.getByText('稍後'))

    expect(mockDismissPrompt).toHaveBeenCalledOnce()
  })
})
