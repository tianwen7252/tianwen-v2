import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { TutorialErrorBoundary } from './tutorial-error-boundary'

vi.mock('@/lib/error-logger', () => ({
  logError: vi.fn(),
}))

import { logError } from '@/lib/error-logger'

describe('TutorialErrorBoundary', () => {
  beforeEach(() => {
    vi.mocked(logError).mockClear()
    // Silence React's expected error log when a child throws inside a boundary.
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when they do not throw', () => {
    const { getByText } = render(
      <TutorialErrorBoundary>
        <div>healthy child</div>
      </TutorialErrorBoundary>,
    )
    expect(getByText('healthy child')).toBeTruthy()
  })

  it('renders nothing and logs when a child throws', () => {
    function Explode(): never {
      throw new Error('tutorial broke')
    }

    const { container } = render(
      <TutorialErrorBoundary>
        <Explode />
      </TutorialErrorBoundary>,
    )

    // Fallback renders null, so the boundary's subtree is empty.
    expect(container.textContent).toBe('')
    expect(logError).toHaveBeenCalledWith(
      'tutorial broke',
      'TutorialErrorBoundary',
      expect.any(String),
    )
  })

  it('logs non-Error throws as their string representation', () => {
    function ExplodeString(): never {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw 'plain-string-error'
    }

    render(
      <TutorialErrorBoundary>
        <ExplodeString />
      </TutorialErrorBoundary>,
    )

    expect(logError).toHaveBeenCalledWith(
      'plain-string-error',
      'TutorialErrorBoundary',
      undefined,
    )
  })
})
