import { useTutorialStore } from '@/stores/tutorial-store'
import type { TutorialStatus } from '@/lib/tutorial/types'

// ─── useTutorial ─────────────────────────────────────────────────────────────

/**
 * Ergonomic hook that surfaces the most commonly used tutorial state and
 * actions from the underlying Zustand store.
 *
 * Selectors are granular to minimise re-renders — each field subscribes
 * to only the slice of state it depends on.
 *
 * @example
 * ```tsx
 * const { start, next, abort, activeTutorialId } = useTutorial()
 * ```
 */
export function useTutorial() {
  const activeTutorialId = useTutorialStore(s => s.activeTutorialId)
  const activeStepIndex = useTutorialStore(s => s.activeStepIndex)
  const isLauncherOpen = useTutorialStore(s => s.isLauncherOpen)

  const start = useTutorialStore(s => s.startTutorial)
  const abort = useTutorialStore(s => s.abortTutorial)
  const complete = useTutorialStore(s => s.completeTutorial)
  const next = useTutorialStore(s => s.advanceStep)
  const goTo = useTutorialStore(s => s.goToStep)
  const openLauncher = useTutorialStore(s => s.openLauncher)
  const closeLauncher = useTutorialStore(s => s.closeLauncher)
  const getProgress = useTutorialStore(s => s.getProgress)

  return {
    // ── Selectors ───────────────────────────────────────────────────────────
    activeTutorialId,
    activeStepIndex,
    isLauncherOpen,
    // ── Actions ─────────────────────────────────────────────────────────────
    start,
    abort,
    complete,
    next,
    goTo,
    openLauncher,
    closeLauncher,
    getProgress,
  } as const
}

// ─── useTutorialStatus ────────────────────────────────────────────────────────

/**
 * Returns the current {@link TutorialStatus} for the given tutorial.
 * Falls back to `'not-started'` when no progress entry exists.
 *
 * @example
 * ```tsx
 * const status = useTutorialStatus('onboarding-01')
 * // 'not-started' | 'in-progress' | 'completed' | 'skipped'
 * ```
 */
export function useTutorialStatus(tutorialId: string): TutorialStatus {
  return useTutorialStore(s => s.progress[tutorialId]?.status ?? 'not-started')
}
