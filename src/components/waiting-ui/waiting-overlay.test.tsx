import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WaitingOverlay } from './waiting-overlay'

// Mock WaitingCanvas since WebGL is not available in test
vi.mock('./waiting-canvas', () => ({
  WaitingCanvas: () => <div data-testid="waiting-canvas" />,
}))

afterEach(() => {
  cleanup()
})

describe('WaitingOverlay', () => {
  it('should render the WaitingCanvas background', () => {
    render(<WaitingOverlay title="Test" message="msg" />)
    expect(screen.getByTestId('waiting-canvas')).toBeTruthy()
  })

  it('should display title and message', () => {
    render(<WaitingOverlay title="請旋轉" message="橫向操作" />)
    expect(screen.getByText('請旋轉')).toBeTruthy()
    expect(screen.getByText('橫向操作')).toBeTruthy()
  })

  it('should show back button when onClose is provided', async () => {
    const onClose = vi.fn()
    render(<WaitingOverlay title="T" message="M" onClose={onClose} />)
    const btn = screen.getByLabelText('Back')
    expect(btn).toBeTruthy()
    const user = userEvent.setup()
    await user.click(btn)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('should NOT show back button when onClose is not provided', () => {
    render(<WaitingOverlay title="T" message="M" />)
    expect(screen.queryByLabelText('Back')).toBeNull()
  })
})
