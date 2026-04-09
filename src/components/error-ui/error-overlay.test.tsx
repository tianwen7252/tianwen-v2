import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock ErrorCanvas since WebGL is not available in test
vi.mock('./error-canvas', () => ({
  ErrorCanvas: () => <div data-testid="error-canvas" />,
}))

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'error.notFound': '找不到頁面',
        'error.serverError': '伺服器錯誤',
        'error.title': '發生錯誤',
        'error.backHome': '返回首頁',
      }
      return map[key] ?? key
    },
  }),
}))

describe('ErrorOverlay', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    cleanup()
  })

  async function renderOverlay(
    props: {
      type?: '404' | '500' | 'error'
      message?: string
      onClose?: () => void
    } = {},
  ) {
    const { ErrorOverlay } = await import('./error-overlay')
    return render(<ErrorOverlay type={props.type ?? '404'} {...props} />)
  }

  it('should render the ErrorCanvas background', async () => {
    await renderOverlay()
    expect(screen.getByTestId('error-canvas')).toBeTruthy()
  })

  it('should display 404 content by default', async () => {
    await renderOverlay({ type: '404' })
    expect(screen.getByText('404')).toBeTruthy()
    expect(screen.getByText('找不到頁面')).toBeTruthy()
  })

  it('should display 500 content', async () => {
    await renderOverlay({ type: '500' })
    expect(screen.getByText('500')).toBeTruthy()
    expect(screen.getByText('伺服器錯誤')).toBeTruthy()
  })

  it('should display error content with custom message', async () => {
    await renderOverlay({ type: 'error', message: '自訂錯誤訊息' })
    expect(screen.getByText('Error')).toBeTruthy()
    expect(screen.getByText('自訂錯誤訊息')).toBeTruthy()
  })

  it('should show back button when onClose is provided', async () => {
    const onClose = vi.fn()
    await renderOverlay({ onClose })
    const btn = screen.getByLabelText('Back')
    expect(btn).toBeTruthy()
    const user = userEvent.setup()
    await user.click(btn)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('should NOT show back button when onClose is not provided', async () => {
    await renderOverlay()
    expect(screen.queryByLabelText('Back')).toBeNull()
  })
})
