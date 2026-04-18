import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import type { TutorialDefinition } from '@/lib/tutorial/types'
import { useTutorialStore } from '@/stores/tutorial-store'

// ─── Module mocks ─────────────────────────────────────────────────────────────

// Mock floating-ui so StepPopover renders without real DOM geometry.
vi.mock('@floating-ui/react', () => ({
  useFloating: vi.fn(() => ({
    refs: {
      setReference: vi.fn(),
      setFloating: vi.fn(),
      floating: { current: null },
    },
    floatingStyles: { position: 'absolute', top: '0px', left: '0px' },
    middlewareData: {},
    placement: 'bottom',
    context: {},
  })),
  offset: vi.fn(() => ({})),
  flip: vi.fn(() => ({})),
  shift: vi.fn(() => ({})),
  autoPlacement: vi.fn(() => ({})),
  autoUpdate: vi.fn(),
}))

const mockNavigate = vi.fn()
let mockPathname = '/'

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ navigate: mockNavigate }),
  useRouterState: ({
    select,
  }: {
    select: (s: { location: { pathname: string } }) => string
  }) => select({ location: { pathname: mockPathname } }),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock wait-for-selector so we control resolution in tests.
const mockWaitForSelector =
  vi.fn<(selector: string, opts?: object) => Promise<Element>>()
vi.mock('@/lib/tutorial/wait-for-selector', () => ({
  waitForSelector: (selector: string, opts?: object) =>
    mockWaitForSelector(selector, opts),
}))

// Mock logError so we can assert it gets called.
const mockLogError = vi.fn()
vi.mock('@/lib/error-logger', () => ({
  logError: (...args: unknown[]) => mockLogError(...args),
}))

// Mock notify — runner surfaces a toast on target-not-found fallbacks.
const mockNotifyError = vi.fn()
vi.mock('@/components/ui/sonner', () => ({
  notify: {
    error: (...args: unknown[]) => mockNotifyError(...args),
    success: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

// Mock resolve-step so we control the action per test.
const mockResolveStep = vi.fn()
vi.mock('@/lib/tutorial/resolve-step', () => ({
  resolveStep: (...args: unknown[]) => mockResolveStep(...args),
}))

// Mock useAnchorRect — return null by default (centered mode).
// useAnchorRect can return null or a rect object; we control it per-test.
// Using unknown[] overload to avoid vitest generic constraint issues.
const mockUseAnchorRect = vi.fn()
vi.mock('@/hooks/use-anchor-rect', () => ({
  useAnchorRect: (el: Element | null) => mockUseAnchorRect(el),
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTutorial(stepCount = 3): TutorialDefinition {
  return {
    id: 'onboarding-01',
    chapter: '00',
    titleKey: 'tutorial.onboarding01.title',
    descriptionKey: 'tutorial.onboarding01.desc',
    adminOnly: false,
    estimatedSeconds: 120,
    steps: Array.from({ length: stepCount }, (_, i) => ({
      id: `step-${i}`,
      titleKey: `step.${i}.title`,
      bodyKey: `step.${i}.body`,
    })),
  }
}

async function importRunner() {
  const mod = await import('./tutorial-runner')
  return mod.TutorialRunner
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('TutorialRunner', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockPathname = '/'
    // Default: show-centered so the popover renders without waiting.
    mockResolveStep.mockReturnValue({ kind: 'show-centered' })
    // Start the tutorial so the store has an active tutorial.
    useTutorialStore.getState().startTutorial('onboarding-01')
  })

  afterEach(() => {
    useTutorialStore.getState().abortTutorial()
    cleanup()
  })

  it('renders the step popover in centered mode when step has no target', async () => {
    mockResolveStep.mockReturnValue({ kind: 'show-centered' })
    const TutorialRunner = await importRunner()
    const tutorial = makeTutorial(3)

    render(<TutorialRunner tutorial={tutorial} />)

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy()
    })
    // Centered — popover has aria-label from titleKey
    expect(screen.getByRole('dialog').getAttribute('aria-label')).toBe(
      'step.0.title',
    )
  })

  it('renders popover anchored when step target exists in DOM', async () => {
    // Add a target element to the DOM
    const anchor = document.createElement('div')
    anchor.setAttribute('data-tutorial-id', 'my-target')
    document.body.appendChild(anchor)

    mockResolveStep.mockReturnValue({
      kind: 'show-anchored',
      selector: '[data-tutorial-id="my-target"]',
    })
    mockUseAnchorRect.mockReturnValue({
      x: 10,
      y: 20,
      width: 100,
      height: 40,
      top: 20,
      left: 10,
      right: 110,
      bottom: 60,
    })

    const TutorialRunner = await importRunner()
    const tutorial = makeTutorial(3)

    render(<TutorialRunner tutorial={tutorial} />)

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy()
    })

    document.body.removeChild(anchor)
  })

  it('advances to next step when next button is clicked', async () => {
    mockResolveStep.mockReturnValue({ kind: 'show-centered' })
    const TutorialRunner = await importRunner()
    const tutorial = makeTutorial(3)

    render(<TutorialRunner tutorial={tutorial} />)

    await waitFor(() => screen.getByRole('dialog'))

    const store = useTutorialStore.getState()
    const initialIndex = store.activeStepIndex

    // Click the "next" button (label = 'tutorial.runner.next' since t is passthrough)
    fireEvent.click(screen.getByText('tutorial.runner.next'))

    await waitFor(() => {
      expect(useTutorialStore.getState().activeStepIndex).toBe(initialIndex + 1)
    })
  })

  it('goes back to previous step when prev button is clicked', async () => {
    mockResolveStep.mockReturnValue({ kind: 'show-centered' })
    const TutorialRunner = await importRunner()
    const tutorial = makeTutorial(3)

    // Start at step 1 so prev is available
    useTutorialStore.getState().goToStep(1)

    render(<TutorialRunner tutorial={tutorial} />)

    await waitFor(() => screen.getByRole('dialog'))

    fireEvent.click(screen.getByText('tutorial.runner.prev'))

    await waitFor(() => {
      expect(useTutorialStore.getState().activeStepIndex).toBe(0)
    })
  })

  it('completes the tutorial on next click at the last step', async () => {
    mockResolveStep.mockReturnValue({ kind: 'show-centered' })
    const TutorialRunner = await importRunner()
    const tutorial = makeTutorial(3)

    // Jump to the last step (index 2)
    useTutorialStore.getState().goToStep(2)

    render(<TutorialRunner tutorial={tutorial} />)

    await waitFor(() => screen.getByRole('dialog'))

    // Last step shows "finish" label
    fireEvent.click(screen.getByText('tutorial.runner.finish'))

    await waitFor(() => {
      const state = useTutorialStore.getState()
      expect(state.activeTutorialId).toBeNull()
      expect(state.progress['onboarding-01']?.status).toBe('completed')
    })
  })

  it('aborts the tutorial when skip button is clicked', async () => {
    mockResolveStep.mockReturnValue({ kind: 'show-centered' })
    const TutorialRunner = await importRunner()
    const tutorial = makeTutorial(3)

    render(<TutorialRunner tutorial={tutorial} />)

    await waitFor(() => screen.getByRole('dialog'))

    fireEvent.click(screen.getByText('tutorial.runner.skip'))

    await waitFor(() => {
      expect(useTutorialStore.getState().activeTutorialId).toBeNull()
      expect(
        useTutorialStore.getState().progress['onboarding-01']?.status,
      ).toBe('skipped')
    })
  })

  it('aborts the tutorial when Escape key is pressed', async () => {
    mockResolveStep.mockReturnValue({ kind: 'show-centered' })
    const TutorialRunner = await importRunner()
    const tutorial = makeTutorial(3)

    render(<TutorialRunner tutorial={tutorial} />)

    await waitFor(() => screen.getByRole('dialog'))

    fireEvent.keyDown(window, { key: 'Escape' })

    await waitFor(() => {
      expect(useTutorialStore.getState().activeTutorialId).toBeNull()
    })
  })

  it('falls back to centered when waitForSelector times out and calls logError', async () => {
    mockResolveStep.mockReturnValue({
      kind: 'wait-for-target',
      selector: '[data-tutorial-id="ghost"]',
      timeoutMs: 100,
    })
    mockWaitForSelector.mockRejectedValue(new Error('Timeout'))

    const TutorialRunner = await importRunner()
    const tutorial = makeTutorial(3)

    render(<TutorialRunner tutorial={tutorial} />)

    // Popover should eventually render (in fallback centered mode).
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy()
    })

    expect(mockLogError).toHaveBeenCalled()
  })

  it('cancels pending waitForSelector when the step changes', async () => {
    let rejectFn: (err: Error) => void = () => {}
    const pendingPromise = new Promise<Element>((_, reject) => {
      rejectFn = reject
    })
    mockWaitForSelector.mockReturnValue(pendingPromise)
    mockResolveStep.mockReturnValue({
      kind: 'wait-for-target',
      selector: '[data-tutorial-id="slow"]',
      timeoutMs: 5000,
    })

    const TutorialRunner = await importRunner()
    const tutorial = makeTutorial(3)

    render(<TutorialRunner tutorial={tutorial} />)

    // Change step — this should cancel the pending wait via AbortController.
    useTutorialStore.getState().goToStep(1)

    // Let React re-render.
    await waitFor(() => {
      // The old reject should not cause an unhandled rejection after step change.
      rejectFn(new Error('Aborted'))
    })

    // No logError should have been called since the abort is expected.
    // (the promise rejection is ignored on cleanup)
    expect(mockLogError).not.toHaveBeenCalled()
  })

  it('falls back to centered popover when resolveStep throws synchronously', async () => {
    // Authoring error: invalid target bubbles up as a throw. The runner must
    // catch it, log it, and render a centered popover instead of crashing.
    mockResolveStep.mockImplementation(() => {
      throw new Error('Invalid tutorial anchor id')
    })

    const TutorialRunner = await importRunner()
    const tutorial = makeTutorial(1)

    const { container } = render(<TutorialRunner tutorial={tutorial} />)

    await waitFor(() => {
      // Title of the first step is rendered via the StepPopover.
      expect(screen.getByText('step.0.title')).toBeTruthy()
    })

    expect(mockLogError).toHaveBeenCalledWith(
      expect.stringContaining('resolveStep threw'),
      'TutorialRunner.resolveStep',
    )
    expect(container).toBeTruthy()
  })
})
