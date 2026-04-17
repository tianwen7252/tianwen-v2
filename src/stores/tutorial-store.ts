import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  TUTORIAL_SCHEMA_VERSION,
  TUTORIAL_STORE_KEY,
} from '@/lib/tutorial/constants'
import type { TutorialProgress, TutorialStatus } from '@/lib/tutorial/types'

// ─── State & Actions ─────────────────────────────────────────────────────────

interface TutorialState {
  /** Id of the currently running tutorial, or null when none is active. */
  readonly activeTutorialId: string | null
  /** Zero-based index of the currently visible step. */
  readonly activeStepIndex: number
  /** Whether the tutorial launcher panel is open. */
  readonly isLauncherOpen: boolean
  /** Persisted per-tutorial progress keyed by tutorialId. */
  readonly progress: Readonly<Record<string, TutorialProgress>>
  /** Coachmark ids that have been dismissed by the user. */
  readonly coachmarkDismissed: Readonly<Record<string, true>>
  /** Persisted schema version — used for future migrations. */
  readonly version: number
}

interface TutorialActions {
  /** Opens the tutorial launcher panel. */
  openLauncher: () => void
  /** Closes the tutorial launcher panel. */
  closeLauncher: () => void
  /** Starts a tutorial from the beginning. Creates/resets its progress entry. */
  startTutorial: (tutorialId: string) => void
  /** Aborts the active tutorial, marking its progress as skipped. */
  abortTutorial: () => void
  /** Marks a tutorial as completed and clears the active state. */
  completeTutorial: (tutorialId: string) => void
  /**
   * Advances the active step index by one and updates persisted progress.
   * When `totalSteps` is provided, the next index is clamped to
   * `totalSteps - 1` so it cannot escalate past the last valid step.
   */
  advanceStep: (totalSteps?: number) => void
  /**
   * Jumps directly to the specified step index and updates persisted progress.
   * Negative indices are clamped to 0; the upper bound is the caller's
   * responsibility since the store has no knowledge of a tutorial's step count.
   */
  goToStep: (index: number) => void
  /** Records a coachmark dismissal — idempotent. */
  dismissCoachmark: (id: string) => void
  /** Returns the progress entry for the given tutorial, or undefined. */
  getProgress: (tutorialId: string) => TutorialProgress | undefined
}

// ─── Merge helper (exported for testing) ─────────────────────────────────────

/**
 * Merges persisted state from localStorage into the current in-memory state.
 * Returns `current` unchanged when `persisted` is null, undefined, or not an object.
 * Exported so unit tests can directly exercise both branches without needing
 * full middleware rehydration.
 */
export function mergeTutorialState(
  persisted: unknown,
  current: TutorialState & TutorialActions,
): TutorialState & TutorialActions {
  if (!persisted || typeof persisted !== 'object' || Array.isArray(persisted)) {
    return current
  }
  const safe = persisted as Partial<TutorialState>
  return {
    ...current,
    progress: isPlainObject(safe.progress) ? safe.progress : {},
    coachmarkDismissed: isPlainObject(safe.coachmarkDismissed)
      ? safe.coachmarkDismissed
      : {},
    version:
      typeof safe.version === 'number' ? safe.version : TUTORIAL_SCHEMA_VERSION,
  }
}

function isPlainObject<T>(
  value: unknown,
): value is Readonly<Record<string, T>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeProgress(
  tutorialId: string,
  status: TutorialStatus,
  currentStepIndex: number,
): TutorialProgress {
  return {
    tutorialId,
    status,
    currentStepIndex,
    lastUpdatedAt: Date.now(),
  }
}

const DEFAULT_TRANSIENT: Pick<
  TutorialState,
  'activeTutorialId' | 'activeStepIndex' | 'isLauncherOpen'
> = {
  activeTutorialId: null,
  activeStepIndex: 0,
  isLauncherOpen: false,
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useTutorialStore = create<TutorialState & TutorialActions>()(
  persist(
    (set, get) => ({
      // ── Transient (not persisted) ────────────────────────────────────────
      ...DEFAULT_TRANSIENT,

      // ── Persisted ───────────────────────────────────────────────────────
      progress: {},
      coachmarkDismissed: {},
      version: TUTORIAL_SCHEMA_VERSION,

      // ── Actions ─────────────────────────────────────────────────────────

      openLauncher: () => set({ isLauncherOpen: true }),

      closeLauncher: () => set({ isLauncherOpen: false }),

      startTutorial: tutorialId => {
        set(state => ({
          activeTutorialId: tutorialId,
          activeStepIndex: 0,
          progress: {
            ...state.progress,
            [tutorialId]: makeProgress(tutorialId, 'in-progress', 0),
          },
        }))
      },

      abortTutorial: () => {
        const { activeTutorialId, progress } = get()
        if (!activeTutorialId) return
        set({
          activeTutorialId: null,
          activeStepIndex: 0,
          progress: {
            ...progress,
            [activeTutorialId]: makeProgress(
              activeTutorialId,
              'skipped',
              progress[activeTutorialId]?.currentStepIndex ?? 0,
            ),
          },
        })
      },

      completeTutorial: tutorialId => {
        set(state => ({
          activeTutorialId: null,
          activeStepIndex: 0,
          progress: {
            ...state.progress,
            [tutorialId]: makeProgress(
              tutorialId,
              'completed',
              state.progress[tutorialId]?.currentStepIndex ?? 0,
            ),
          },
        }))
      },

      advanceStep: totalSteps => {
        const { activeTutorialId, activeStepIndex, progress } = get()
        if (!activeTutorialId) return
        const raw = activeStepIndex + 1
        const upperBound =
          typeof totalSteps === 'number' && totalSteps > 0
            ? totalSteps - 1
            : raw
        const nextIndex = Math.max(0, Math.min(raw, upperBound))
        set({
          activeStepIndex: nextIndex,
          progress: {
            ...progress,
            [activeTutorialId]: makeProgress(
              activeTutorialId,
              'in-progress',
              nextIndex,
            ),
          },
        })
      },

      goToStep: index => {
        const { activeTutorialId, progress } = get()
        if (!activeTutorialId) return
        const safeIndex = Math.max(0, index)
        set({
          activeStepIndex: safeIndex,
          progress: {
            ...progress,
            [activeTutorialId]: makeProgress(
              activeTutorialId,
              'in-progress',
              safeIndex,
            ),
          },
        })
      },

      dismissCoachmark: id => {
        set(state => ({
          coachmarkDismissed: { ...state.coachmarkDismissed, [id]: true },
        }))
      },

      getProgress: tutorialId => get().progress[tutorialId],
    }),
    {
      name: TUTORIAL_STORE_KEY,
      version: TUTORIAL_SCHEMA_VERSION,

      // Only persist non-transient fields.
      partialize: state => ({
        progress: state.progress,
        coachmarkDismissed: state.coachmarkDismissed,
        version: state.version,
      }),

      // Reset persisted state when schema version changes — fresh installs and
      // future migrations both fall through to the defaults in the store
      // initializer.
      migrate: (_persisted, _fromVersion) => migrateToCurrent(),

      // Handle unknown persisted shape gracefully — never throw.
      merge: (persisted, current) =>
        mergeTutorialState(
          persisted,
          current as TutorialState & TutorialActions,
        ),
    },
  ),
)

/**
 * Returns the persisted slice reset to schema defaults.
 * Called by zustand's persist middleware when the stored version is older
 * than TUTORIAL_SCHEMA_VERSION. Exported for direct unit testing.
 */
export function migrateToCurrent(): Pick<
  TutorialState,
  'progress' | 'coachmarkDismissed' | 'version'
> {
  return {
    progress: {},
    coachmarkDismissed: {},
    version: TUTORIAL_SCHEMA_VERSION,
  }
}
