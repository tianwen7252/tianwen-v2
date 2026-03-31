import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'

// Mock the sonner library to avoid DOM side effects in unit tests
vi.mock('sonner', () => ({
  Toaster: (props: Record<string, unknown>) => (
    <div data-testid="sonner-toaster" data-props={JSON.stringify(props)} />
  ),
  toast: {
    custom: vi.fn(),
  },
}))

describe('Toaster', () => {
  it('should render the sonner Toaster component', async () => {
    const { Toaster } = await import('./sonner')
    const { container } = render(<Toaster />)
    const toaster = container.querySelector('[data-testid="sonner-toaster"]')
    expect(toaster).toBeTruthy()
  })

  it('should use top-right position by default', async () => {
    const { Toaster } = await import('./sonner')
    const { container } = render(<Toaster />)
    const toaster = container.querySelector('[data-testid="sonner-toaster"]')
    const props = JSON.parse(toaster?.getAttribute('data-props') ?? '{}')
    expect(props.position).toBe('top-right')
  })

  it('should use 3000ms duration by default', async () => {
    const { Toaster } = await import('./sonner')
    const { container } = render(<Toaster />)
    const toaster = container.querySelector('[data-testid="sonner-toaster"]')
    const props = JSON.parse(toaster?.getAttribute('data-props') ?? '{}')
    expect(props.duration).toBe(3000)
  })

  it('should allow overriding position', async () => {
    const { Toaster } = await import('./sonner')
    const { container } = render(<Toaster position="bottom-center" />)
    const toaster = container.querySelector('[data-testid="sonner-toaster"]')
    const props = JSON.parse(toaster?.getAttribute('data-props') ?? '{}')
    expect(props.position).toBe('bottom-center')
  })

  it('should allow overriding duration', async () => {
    const { Toaster } = await import('./sonner')
    const { container } = render(<Toaster duration={5000} />)
    const toaster = container.querySelector('[data-testid="sonner-toaster"]')
    const props = JSON.parse(toaster?.getAttribute('data-props') ?? '{}')
    expect(props.duration).toBe(5000)
  })

  it('should set unstyled toastOptions', async () => {
    const { Toaster } = await import('./sonner')
    const { container } = render(<Toaster />)
    const toaster = container.querySelector('[data-testid="sonner-toaster"]')
    const props = JSON.parse(toaster?.getAttribute('data-props') ?? '{}')
    expect(props.toastOptions).toBeDefined()
    expect(props.toastOptions.unstyled).toBe(true)
  })
})

describe('notify', () => {
  it('should call toast.custom for success', async () => {
    const { toast } = await import('sonner')
    const { notify } = await import('./sonner')
    notify.success('test message')
    expect(toast.custom).toHaveBeenCalled()
  })

  it('should call toast.custom for error', async () => {
    const { toast } = await import('sonner')
    const { notify } = await import('./sonner')
    notify.error('error message')
    expect(toast.custom).toHaveBeenCalled()
  })
})
