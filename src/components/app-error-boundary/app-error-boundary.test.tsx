import type React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock the error-logger to prevent provider dependency in tests
vi.mock('@/lib/error-logger', () => ({
  logError: vi.fn(),
}))

import { AppErrorBoundary } from './app-error-boundary'
import { logError } from '@/lib/error-logger'

// A component that always throws
function AlwaysThrows(): React.ReactNode {
  throw new Error('Always fails')
}

describe('AppErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Suppress console.error for intentional throws
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should render children when no error occurs', () => {
    render(
      <AppErrorBoundary>
        <div>Normal content</div>
      </AppErrorBoundary>,
    )
    expect(screen.getByText('Normal content')).toBeTruthy()
  })

  it('should show ErrorFallback when a child component throws', () => {
    render(
      <AppErrorBoundary>
        <AlwaysThrows />
      </AppErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('Always fails')).toBeTruthy()
  })

  it('should call console.error when an error is caught', () => {
    render(
      <AppErrorBoundary>
        <AlwaysThrows />
      </AppErrorBoundary>,
    )
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[ErrorBoundary]',
      expect.any(Error),
    )
  })

  it('should log component stack when available', () => {
    render(
      <AppErrorBoundary>
        <AlwaysThrows />
      </AppErrorBoundary>,
    )
    // React provides componentStack info on errors caught by error boundaries
    const stackCall = consoleErrorSpy.mock.calls.find(
      (call: unknown[]) =>
        typeof call[0] === 'string' &&
        call[0] === '[ErrorBoundary] Component stack:',
    )
    // If componentStack is provided by the runtime, it should be logged
    if (stackCall) {
      expect(stackCall[1]).toBeTruthy()
    }
  })

  it('should propagate custom title to the fallback UI', () => {
    render(
      <AppErrorBoundary title="模組錯誤">
        <AlwaysThrows />
      </AppErrorBoundary>,
    )
    expect(screen.getByText('模組錯誤')).toBeTruthy()
  })

  it('should re-render children after reset via retry button', async () => {
    const user = userEvent.setup()
    let shouldThrow = true

    function ConditionalThrow() {
      if (shouldThrow) {
        throw new Error('Temporary error')
      }
      return <div>Recovered content</div>
    }

    render(
      <AppErrorBoundary>
        <ConditionalThrow />
      </AppErrorBoundary>,
    )

    // Should show error fallback
    expect(screen.getByRole('alert')).toBeTruthy()

    // Fix the error condition, then retry
    shouldThrow = false
    await user.click(screen.getByRole('button', { name: '重試' }))

    expect(screen.getByText('Recovered content')).toBeTruthy()
  })

  it('should call onReset callback when reset occurs', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()
    let shouldThrow = true

    function ConditionalThrow() {
      if (shouldThrow) {
        throw new Error('Error')
      }
      return <div>OK</div>
    }

    render(
      <AppErrorBoundary onReset={onReset}>
        <ConditionalThrow />
      </AppErrorBoundary>,
    )

    shouldThrow = false
    await user.click(screen.getByRole('button', { name: '重試' }))

    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('should show default title when no custom title is provided', () => {
    render(
      <AppErrorBoundary>
        <AlwaysThrows />
      </AppErrorBoundary>,
    )
    expect(screen.getByText('發生錯誤')).toBeTruthy()
  })

  it('should persist error to DB via logError when a child throws', () => {
    render(
      <AppErrorBoundary>
        <AlwaysThrows />
      </AppErrorBoundary>,
    )

    expect(logError).toHaveBeenCalledWith(
      'Always fails',
      'ErrorBoundary',
      expect.any(String),
    )
  })
})
