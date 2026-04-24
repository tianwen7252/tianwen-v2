import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { useTutorialStore } from '@/stores/tutorial-store'
import type { TutorialDefinition } from '@/lib/tutorial/types'

// ─── Module mocks ─────────────────────────────────────────────────────────────

const mockLoadTutorial = vi.fn<(id: string) => Promise<TutorialDefinition>>()
vi.mock('@/lib/tutorial/load-tutorial', () => ({
  loadTutorial: (id: string) => mockLoadTutorial(id),
}))

// Mock TutorialRunner so we can assert it's rendered with the right tutorial.
const mockTutorialRunner = vi.fn(
  ({ tutorial }: { tutorial: TutorialDefinition }) => (
    <div data-testid="tutorial-runner" data-tutorial-id={tutorial.id} />
  ),
)
vi.mock('./tutorial-runner', () => ({
  TutorialRunner: (props: { tutorial: TutorialDefinition }) =>
    mockTutorialRunner(props),
}))

const mockLogError = vi.fn()
vi.mock('@/lib/error-logger', () => ({
  logError: (...args: unknown[]) => mockLogError(...args),
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTutorial(id = 'onboarding-01'): TutorialDefinition {
  return {
    id,
    chapter: '00',
    titleKey: 'tutorial.title',
    descriptionKey: 'tutorial.desc',
    adminOnly: false,
    estimatedSeconds: 60,
    steps: [{ id: 'step-0', titleKey: 't0', bodyKey: 'b0' }],
  }
}

async function importHost() {
  const mod = await import('./tutorial-host')
  return mod.TutorialHost
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('TutorialHost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    useTutorialStore.getState().abortTutorial()
    cleanup()
  })

  it('renders null when there is no active tutorial', async () => {
    // Ensure no active tutorial
    useTutorialStore.setState({ activeTutorialId: null })

    const TutorialHost = await importHost()
    const { container } = render(<TutorialHost />)

    expect(container.firstChild).toBeNull()
  })

  it('loads the tutorial definition when activeTutorialId is set', async () => {
    const tutorial = makeTutorial('onboarding-01')
    mockLoadTutorial.mockResolvedValue(tutorial)

    const TutorialHost = await importHost()
    render(<TutorialHost />)

    // Activate the tutorial after mount
    useTutorialStore.getState().startTutorial('onboarding-01')

    await waitFor(() => {
      expect(mockLoadTutorial).toHaveBeenCalledWith('onboarding-01')
    })
  })

  it('renders TutorialRunner with the loaded tutorial definition', async () => {
    const tutorial = makeTutorial('onboarding-01')
    mockLoadTutorial.mockResolvedValue(tutorial)

    useTutorialStore.getState().startTutorial('onboarding-01')

    const TutorialHost = await importHost()
    render(<TutorialHost />)

    await waitFor(() => {
      expect(screen.getByTestId('tutorial-runner')).toBeTruthy()
    })
    expect(
      screen.getByTestId('tutorial-runner').getAttribute('data-tutorial-id'),
    ).toBe('onboarding-01')
  })

  it('cancels stale loads if activeTutorialId changes mid-load', async () => {
    const tutorial1 = makeTutorial('tutorial-1')
    const tutorial2 = makeTutorial('tutorial-2')

    let resolve1: (t: TutorialDefinition) => void = () => {}
    const stalePromise = new Promise<TutorialDefinition>(resolve => {
      resolve1 = resolve
    })

    mockLoadTutorial
      .mockImplementationOnce(() => stalePromise)
      .mockResolvedValueOnce(tutorial2)

    useTutorialStore.getState().startTutorial('tutorial-1')

    const TutorialHost = await importHost()
    render(<TutorialHost />)

    // Switch to a different tutorial before the first load completes
    useTutorialStore.getState().startTutorial('tutorial-2')

    // Resolve the stale promise — should NOT update state
    resolve1(tutorial1)

    await waitFor(() => {
      expect(screen.getByTestId('tutorial-runner')).toBeTruthy()
    })

    // Should show tutorial-2, not tutorial-1
    expect(
      screen.getByTestId('tutorial-runner').getAttribute('data-tutorial-id'),
    ).toBe('tutorial-2')
  })

  it('calls logError when loadTutorial throws', async () => {
    mockLoadTutorial.mockRejectedValue(new Error('Tutorial not found'))

    useTutorialStore.getState().startTutorial('bad-id')

    const TutorialHost = await importHost()
    render(<TutorialHost />)

    await waitFor(() => {
      expect(mockLogError).toHaveBeenCalled()
    })
  })

  it('clears the tutorial when activeTutorialId becomes null', async () => {
    const tutorial = makeTutorial('onboarding-01')
    mockLoadTutorial.mockResolvedValue(tutorial)

    useTutorialStore.getState().startTutorial('onboarding-01')

    const TutorialHost = await importHost()
    const { container } = render(<TutorialHost />)

    await waitFor(() => {
      expect(screen.getByTestId('tutorial-runner')).toBeTruthy()
    })

    // Abort the tutorial
    useTutorialStore.getState().abortTutorial()

    await waitFor(() => {
      expect(container.firstChild).toBeNull()
    })
  })
})
