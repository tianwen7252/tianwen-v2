import type React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

// Mock the error-logger to prevent provider dependency in tests
vi.mock('@/lib/error-logger', () => ({
  logError: vi.fn(),
}))

// Mock init-store with a mutable state for cleanup race-condition tests
let mockErrorMessage: string | null = null
const mockSetErrorOverlayType = vi.fn(
  (_type: string | null, message?: string) => {
    mockErrorMessage = _type === null ? null : (message ?? null)
  },
)

vi.mock('@/stores/init-store', () => ({
  useInitStore: {
    getState: () => ({
      setErrorOverlayType: mockSetErrorOverlayType,
      get errorOverlayMessage() {
        return mockErrorMessage
      },
    }),
  },
}))

import { AppErrorBoundary } from './app-error-boundary'
import { logError } from '@/lib/error-logger'

// A component that always throws
function AlwaysThrows(): React.ReactNode {
  throw new Error('Always fails')
}

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    mockSetErrorOverlayType.mockClear()
    mockErrorMessage = null
    // Suppress React's uncaught-error console logging during intentional throws
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('should render children when no error occurs', () => {
    // Arrange
    render(
      <AppErrorBoundary>
        <div>Normal content</div>
      </AppErrorBoundary>,
    )

    // Assert
    expect(screen.getByText('Normal content')).toBeTruthy()
  })

  it('should trigger ErrorOverlay when a child component throws', () => {
    // Arrange + Act
    render(
      <AppErrorBoundary>
        <AlwaysThrows />
      </AppErrorBoundary>,
    )

    // Assert
    expect(mockSetErrorOverlayType).toHaveBeenCalledWith(
      'error',
      'Always fails',
    )
  })

  it('should persist error to DB via logError when a child throws', () => {
    // Arrange + Act
    render(
      <AppErrorBoundary>
        <AlwaysThrows />
      </AppErrorBoundary>,
    )

    // Assert
    expect(logError).toHaveBeenCalledWith(
      'Always fails',
      'ErrorBoundary',
      expect.any(String),
    )
  })

  it('should clear overlay on unmount when current message matches', () => {
    // Arrange
    const { unmount } = render(
      <AppErrorBoundary>
        <AlwaysThrows />
      </AppErrorBoundary>,
    )
    mockSetErrorOverlayType.mockClear()

    // Act
    unmount()

    // Assert — cleanup should clear because stored message still matches
    expect(mockSetErrorOverlayType).toHaveBeenCalledWith(null)
  })

  it('should NOT clear overlay on unmount when a different error was set externally', () => {
    // Arrange
    const { unmount } = render(
      <AppErrorBoundary>
        <AlwaysThrows />
      </AppErrorBoundary>,
    )
    // Simulate another source setting a different error message
    mockErrorMessage = 'Bootstrap failure: DB locked'
    mockSetErrorOverlayType.mockClear()

    // Act
    unmount()

    // Assert — cleanup should NOT touch the overlay (race prevention)
    expect(mockSetErrorOverlayType).not.toHaveBeenCalled()
  })
})
