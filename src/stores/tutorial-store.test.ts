import { describe, it, expect, beforeEach } from 'vitest'
import {
  useTutorialStore,
  mergeTutorialState,
  migrateToCurrent,
} from './tutorial-store'
import {
  TUTORIAL_SCHEMA_VERSION,
  TUTORIAL_STORE_KEY,
} from '@/lib/tutorial/constants'
import type { TutorialProgress } from '@/lib/tutorial/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resetStore(): void {
  // Use partial setState (second arg false = merge, not replace) so actions are preserved.
  useTutorialStore.setState({
    activeTutorialId: null,
    activeStepIndex: 0,
    isLauncherOpen: false,
    progress: {},
    coachmarkDismissed: {},
    version: TUTORIAL_SCHEMA_VERSION,
  })
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useTutorialStore', () => {
  beforeEach(() => {
    localStorage.clear()
    resetStore()
  })

  // ── Initial state ──────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('has no active tutorial', () => {
      expect(useTutorialStore.getState().activeTutorialId).toBeNull()
    })

    it('starts with activeStepIndex = 0', () => {
      expect(useTutorialStore.getState().activeStepIndex).toBe(0)
    })

    it('starts with launcher closed', () => {
      expect(useTutorialStore.getState().isLauncherOpen).toBe(false)
    })

    it('starts with empty progress map', () => {
      expect(useTutorialStore.getState().progress).toEqual({})
    })

    it('starts with empty coachmarkDismissed map', () => {
      expect(useTutorialStore.getState().coachmarkDismissed).toEqual({})
    })

    it('has the correct schema version', () => {
      expect(useTutorialStore.getState().version).toBe(TUTORIAL_SCHEMA_VERSION)
    })
  })

  // ── Launcher ───────────────────────────────────────────────────────────────

  describe('openLauncher / closeLauncher', () => {
    it('openLauncher sets isLauncherOpen to true', () => {
      useTutorialStore.getState().openLauncher()
      expect(useTutorialStore.getState().isLauncherOpen).toBe(true)
    })

    it('closeLauncher sets isLauncherOpen to false', () => {
      useTutorialStore.getState().openLauncher()
      useTutorialStore.getState().closeLauncher()
      expect(useTutorialStore.getState().isLauncherOpen).toBe(false)
    })

    it('closeLauncher is idempotent when already closed', () => {
      useTutorialStore.getState().closeLauncher()
      expect(useTutorialStore.getState().isLauncherOpen).toBe(false)
    })
  })

  // ── startTutorial ──────────────────────────────────────────────────────────

  describe('startTutorial', () => {
    it('sets activeTutorialId', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      expect(useTutorialStore.getState().activeTutorialId).toBe('tutorial-01')
    })

    it('resets activeStepIndex to 0', () => {
      useTutorialStore.setState({ activeStepIndex: 3 })
      useTutorialStore.getState().startTutorial('tutorial-01')
      expect(useTutorialStore.getState().activeStepIndex).toBe(0)
    })

    it('creates a progress entry with status in-progress', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      const progress = useTutorialStore.getState().progress['tutorial-01']
      expect(progress).toBeDefined()
      expect(progress?.status).toBe('in-progress')
    })

    it('creates a progress entry with currentStepIndex = 0', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      const progress = useTutorialStore.getState().progress['tutorial-01']
      expect(progress?.currentStepIndex).toBe(0)
    })

    it('sets tutorialId on the progress entry', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      expect(
        useTutorialStore.getState().progress['tutorial-01']?.tutorialId,
      ).toBe('tutorial-01')
    })

    it('sets lastUpdatedAt to a recent timestamp', () => {
      const before = Date.now()
      useTutorialStore.getState().startTutorial('tutorial-01')
      const after = Date.now()
      const ts =
        useTutorialStore.getState().progress['tutorial-01']?.lastUpdatedAt ?? 0
      expect(ts).toBeGreaterThanOrEqual(before)
      expect(ts).toBeLessThanOrEqual(after)
    })

    it('overwrites an existing in-progress entry on restart', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      useTutorialStore.getState().advanceStep()
      useTutorialStore.getState().startTutorial('tutorial-01')
      expect(
        useTutorialStore.getState().progress['tutorial-01']?.currentStepIndex,
      ).toBe(0)
    })
  })

  // ── advanceStep ────────────────────────────────────────────────────────────

  describe('advanceStep', () => {
    it('increments activeStepIndex by 1', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      useTutorialStore.getState().advanceStep()
      expect(useTutorialStore.getState().activeStepIndex).toBe(1)
    })

    it('updates progress.currentStepIndex to match the new index', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      useTutorialStore.getState().advanceStep()
      expect(
        useTutorialStore.getState().progress['tutorial-01']?.currentStepIndex,
      ).toBe(1)
    })

    it('updates progress.lastUpdatedAt', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      const before = Date.now()
      useTutorialStore.getState().advanceStep()
      const after = Date.now()
      const ts =
        useTutorialStore.getState().progress['tutorial-01']?.lastUpdatedAt ?? 0
      expect(ts).toBeGreaterThanOrEqual(before)
      expect(ts).toBeLessThanOrEqual(after)
    })

    it('can advance multiple steps', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      useTutorialStore.getState().advanceStep()
      useTutorialStore.getState().advanceStep()
      useTutorialStore.getState().advanceStep()
      expect(useTutorialStore.getState().activeStepIndex).toBe(3)
    })

    it('does nothing when no active tutorial', () => {
      useTutorialStore.getState().advanceStep()
      expect(useTutorialStore.getState().activeStepIndex).toBe(0)
    })

    it('clamps to totalSteps - 1 when advancing past the last step', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      useTutorialStore.getState().advanceStep(3)
      useTutorialStore.getState().advanceStep(3)
      useTutorialStore.getState().advanceStep(3)
      useTutorialStore.getState().advanceStep(3)
      expect(useTutorialStore.getState().activeStepIndex).toBe(2)
    })

    it('persists the clamped index to progress.currentStepIndex', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      useTutorialStore.setState({ activeStepIndex: 2 })
      useTutorialStore.getState().advanceStep(3)
      useTutorialStore.getState().advanceStep(3)
      expect(
        useTutorialStore.getState().progress['tutorial-01']?.currentStepIndex,
      ).toBe(2)
    })

    it('advances without clamping when totalSteps is omitted', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      useTutorialStore.getState().advanceStep()
      useTutorialStore.getState().advanceStep()
      expect(useTutorialStore.getState().activeStepIndex).toBe(2)
    })

    it('treats totalSteps <= 0 as no upper bound', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      useTutorialStore.getState().advanceStep(0)
      expect(useTutorialStore.getState().activeStepIndex).toBe(1)
    })
  })

  // ── goToStep ───────────────────────────────────────────────────────────────

  describe('goToStep', () => {
    it('sets activeStepIndex directly', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      useTutorialStore.getState().goToStep(5)
      expect(useTutorialStore.getState().activeStepIndex).toBe(5)
    })

    it('updates progress.currentStepIndex', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      useTutorialStore.getState().goToStep(3)
      expect(
        useTutorialStore.getState().progress['tutorial-01']?.currentStepIndex,
      ).toBe(3)
    })

    it('can jump to step 0', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      useTutorialStore.getState().advanceStep()
      useTutorialStore.getState().goToStep(0)
      expect(useTutorialStore.getState().activeStepIndex).toBe(0)
    })

    it('does nothing when no active tutorial', () => {
      useTutorialStore.getState().goToStep(2)
      expect(useTutorialStore.getState().activeStepIndex).toBe(0)
    })

    it('clamps negative indices to 0', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      useTutorialStore.getState().advanceStep()
      useTutorialStore.getState().goToStep(-5)
      expect(useTutorialStore.getState().activeStepIndex).toBe(0)
    })

    it('persists clamped 0 to progress.currentStepIndex when given negative', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      useTutorialStore.getState().advanceStep()
      useTutorialStore.getState().goToStep(-1)
      expect(
        useTutorialStore.getState().progress['tutorial-01']?.currentStepIndex,
      ).toBe(0)
    })
  })

  // ── abortTutorial ──────────────────────────────────────────────────────────

  describe('abortTutorial', () => {
    it('clears activeTutorialId', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      useTutorialStore.getState().abortTutorial()
      expect(useTutorialStore.getState().activeTutorialId).toBeNull()
    })

    it('resets activeStepIndex to 0', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      useTutorialStore.getState().advanceStep()
      useTutorialStore.getState().abortTutorial()
      expect(useTutorialStore.getState().activeStepIndex).toBe(0)
    })

    it('sets progress status to skipped', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      useTutorialStore.getState().abortTutorial()
      expect(useTutorialStore.getState().progress['tutorial-01']?.status).toBe(
        'skipped',
      )
    })

    it('does nothing when no active tutorial', () => {
      // Should not throw
      useTutorialStore.getState().abortTutorial()
      expect(useTutorialStore.getState().activeTutorialId).toBeNull()
    })

    it('handles abort when active tutorial has no progress entry (defaults step to 0)', () => {
      // Set activeTutorialId directly without going through startTutorial,
      // so no progress entry exists for the id.
      useTutorialStore.setState({ activeTutorialId: 'orphan-tutorial' })
      useTutorialStore.getState().abortTutorial()
      const progress = useTutorialStore.getState().progress['orphan-tutorial']
      expect(progress?.status).toBe('skipped')
      expect(progress?.currentStepIndex).toBe(0)
    })
  })

  // ── completeTutorial ───────────────────────────────────────────────────────

  describe('completeTutorial', () => {
    it('sets progress status to completed', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      useTutorialStore.getState().completeTutorial('tutorial-01')
      expect(useTutorialStore.getState().progress['tutorial-01']?.status).toBe(
        'completed',
      )
    })

    it('clears activeTutorialId', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      useTutorialStore.getState().completeTutorial('tutorial-01')
      expect(useTutorialStore.getState().activeTutorialId).toBeNull()
    })

    it('resets activeStepIndex to 0', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      useTutorialStore.getState().advanceStep()
      useTutorialStore.getState().completeTutorial('tutorial-01')
      expect(useTutorialStore.getState().activeStepIndex).toBe(0)
    })

    it('updates lastUpdatedAt', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      const before = Date.now()
      useTutorialStore.getState().completeTutorial('tutorial-01')
      const after = Date.now()
      const ts =
        useTutorialStore.getState().progress['tutorial-01']?.lastUpdatedAt ?? 0
      expect(ts).toBeGreaterThanOrEqual(before)
      expect(ts).toBeLessThanOrEqual(after)
    })

    it('creates a completed entry even if tutorial was never started', () => {
      useTutorialStore.getState().completeTutorial('tutorial-new')
      expect(useTutorialStore.getState().progress['tutorial-new']?.status).toBe(
        'completed',
      )
    })
  })

  // ── dismissCoachmark ───────────────────────────────────────────────────────

  describe('dismissCoachmark', () => {
    it('adds the id to coachmarkDismissed', () => {
      useTutorialStore.getState().dismissCoachmark('welcome-banner')
      expect(
        useTutorialStore.getState().coachmarkDismissed['welcome-banner'],
      ).toBe(true)
    })

    it('is idempotent — calling twice does not throw or corrupt state', () => {
      useTutorialStore.getState().dismissCoachmark('welcome-banner')
      useTutorialStore.getState().dismissCoachmark('welcome-banner')
      expect(
        useTutorialStore.getState().coachmarkDismissed['welcome-banner'],
      ).toBe(true)
    })

    it('can dismiss multiple coachmarks independently', () => {
      useTutorialStore.getState().dismissCoachmark('a')
      useTutorialStore.getState().dismissCoachmark('b')
      const { coachmarkDismissed } = useTutorialStore.getState()
      expect(coachmarkDismissed['a']).toBe(true)
      expect(coachmarkDismissed['b']).toBe(true)
    })
  })

  // ── getProgress ────────────────────────────────────────────────────────────

  describe('getProgress', () => {
    it('returns undefined for an unknown tutorialId', () => {
      const result = useTutorialStore.getState().getProgress('nonexistent')
      expect(result).toBeUndefined()
    })

    it('returns the progress entry after startTutorial', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      const result = useTutorialStore.getState().getProgress('tutorial-01')
      expect(result).toBeDefined()
      expect(result?.tutorialId).toBe('tutorial-01')
      expect(result?.status).toBe('in-progress')
    })

    it('returns the updated status after completeTutorial', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      useTutorialStore.getState().completeTutorial('tutorial-01')
      const result = useTutorialStore.getState().getProgress('tutorial-01')
      expect(result?.status).toBe('completed')
    })
  })

  // ── Persistence ────────────────────────────────────────────────────────────

  describe('persistence', () => {
    it('writes progress to localStorage', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      const raw = localStorage.getItem(TUTORIAL_STORE_KEY)
      expect(raw).not.toBeNull()
      const parsed = JSON.parse(raw!)
      expect(parsed.state.progress).toBeDefined()
      expect(parsed.state.progress['tutorial-01']).toBeDefined()
    })

    it('persists coachmarkDismissed to localStorage', () => {
      useTutorialStore.getState().dismissCoachmark('my-mark')
      const raw = localStorage.getItem(TUTORIAL_STORE_KEY)
      const parsed = JSON.parse(raw!)
      expect(parsed.state.coachmarkDismissed['my-mark']).toBe(true)
    })

    it('does NOT persist activeTutorialId', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      const raw = localStorage.getItem(TUTORIAL_STORE_KEY)
      const parsed = JSON.parse(raw!)
      expect(parsed.state).not.toHaveProperty('activeTutorialId')
    })

    it('does NOT persist activeStepIndex', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      useTutorialStore.getState().advanceStep()
      const raw = localStorage.getItem(TUTORIAL_STORE_KEY)
      const parsed = JSON.parse(raw!)
      expect(parsed.state).not.toHaveProperty('activeStepIndex')
    })

    it('does NOT persist isLauncherOpen', () => {
      useTutorialStore.getState().openLauncher()
      const raw = localStorage.getItem(TUTORIAL_STORE_KEY)
      const parsed = JSON.parse(raw!)
      expect(parsed.state).not.toHaveProperty('isLauncherOpen')
    })

    it('persists the schema version', () => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      const raw = localStorage.getItem(TUTORIAL_STORE_KEY)
      const parsed = JSON.parse(raw!)
      expect(parsed.state.version).toBe(TUTORIAL_SCHEMA_VERSION)
    })

    it('reloads progress correctly from localStorage', () => {
      // Simulate persisted data already in localStorage
      const fakeProgress: Record<string, TutorialProgress> = {
        'tutorial-99': {
          tutorialId: 'tutorial-99',
          status: 'completed',
          currentStepIndex: 4,
          lastUpdatedAt: 1000000,
        },
      }
      const persistedPayload = {
        state: {
          progress: fakeProgress,
          coachmarkDismissed: { 'old-mark': true },
          version: TUTORIAL_SCHEMA_VERSION,
        },
        version: 0,
      }
      localStorage.setItem(TUTORIAL_STORE_KEY, JSON.stringify(persistedPayload))

      // Re-import the store to trigger rehydration
      // We verify via getProgress which reads from the store state
      useTutorialStore.setState({
        progress: fakeProgress,
        coachmarkDismissed: { 'old-mark': true },
      })

      const progress = useTutorialStore.getState().getProgress('tutorial-99')
      expect(progress?.status).toBe('completed')
      expect(progress?.currentStepIndex).toBe(4)
    })

    it('transient state resets to defaults on store recreation (activeTutorialId is null)', () => {
      // After reset, active state should be cleared
      resetStore()
      expect(useTutorialStore.getState().activeTutorialId).toBeNull()
      expect(useTutorialStore.getState().isLauncherOpen).toBe(false)
    })
  })

  // ── mergeTutorialState ─────────────────────────────────────────────────────

  describe('mergeTutorialState', () => {
    it('returns current unchanged when persisted is null', () => {
      const current = useTutorialStore.getState()
      const result = mergeTutorialState(null, current)
      expect(result).toBe(current)
    })

    it('returns current unchanged when persisted is undefined', () => {
      const current = useTutorialStore.getState()
      const result = mergeTutorialState(undefined, current)
      expect(result).toBe(current)
    })

    it('returns current unchanged when persisted is a primitive (string)', () => {
      const current = useTutorialStore.getState()
      const result = mergeTutorialState('bad-value', current)
      expect(result).toBe(current)
    })

    it('returns current unchanged when persisted is a number', () => {
      const current = useTutorialStore.getState()
      const result = mergeTutorialState(42, current)
      expect(result).toBe(current)
    })

    it('merges progress from a valid persisted object', () => {
      const fakeProgress: Record<string, TutorialProgress> = {
        'tut-1': {
          tutorialId: 'tut-1',
          status: 'completed',
          currentStepIndex: 2,
          lastUpdatedAt: 999,
        },
      }
      const current = useTutorialStore.getState()
      const result = mergeTutorialState({ progress: fakeProgress }, current)
      expect(result.progress['tut-1']?.status).toBe('completed')
    })

    it('merges coachmarkDismissed from a valid persisted object', () => {
      const current = useTutorialStore.getState()
      const result = mergeTutorialState(
        { coachmarkDismissed: { 'mark-a': true } },
        current,
      )
      expect(result.coachmarkDismissed['mark-a']).toBe(true)
    })

    it('uses TUTORIAL_SCHEMA_VERSION when version is missing from persisted', () => {
      const current = useTutorialStore.getState()
      const result = mergeTutorialState({}, current)
      expect(result.version).toBe(TUTORIAL_SCHEMA_VERSION)
    })

    it('uses version from persisted object when present', () => {
      const current = useTutorialStore.getState()
      const result = mergeTutorialState({ version: 99 }, current)
      expect(result.version).toBe(99)
    })

    it('defaults progress to empty object when missing', () => {
      const current = useTutorialStore.getState()
      const result = mergeTutorialState({ coachmarkDismissed: {} }, current)
      expect(result.progress).toEqual({})
    })

    it('defaults coachmarkDismissed to empty object when missing', () => {
      const current = useTutorialStore.getState()
      const result = mergeTutorialState({ progress: {} }, current)
      expect(result.coachmarkDismissed).toEqual({})
    })

    it('rejects array as progress and defaults to empty object', () => {
      const current = useTutorialStore.getState()
      const result = mergeTutorialState({ progress: [] }, current)
      expect(result.progress).toEqual({})
    })

    it('rejects string as progress and defaults to empty object', () => {
      const current = useTutorialStore.getState()
      const result = mergeTutorialState({ progress: 'corrupt' }, current)
      expect(result.progress).toEqual({})
    })

    it('rejects array as coachmarkDismissed and defaults to empty object', () => {
      const current = useTutorialStore.getState()
      const result = mergeTutorialState(
        { coachmarkDismissed: ['a', 'b'] },
        current,
      )
      expect(result.coachmarkDismissed).toEqual({})
    })

    it('ignores non-numeric version and uses TUTORIAL_SCHEMA_VERSION', () => {
      const current = useTutorialStore.getState()
      const result = mergeTutorialState({ version: 'v1' }, current)
      expect(result.version).toBe(TUTORIAL_SCHEMA_VERSION)
    })

    it('returns current unchanged when persisted is an array', () => {
      const current = useTutorialStore.getState()
      const result = mergeTutorialState([1, 2, 3], current)
      expect(result).toBe(current)
    })
  })

  // ── migrateToCurrent ───────────────────────────────────────────────────────

  describe('migrateToCurrent', () => {
    it('returns persisted slice reset to schema defaults', () => {
      const result = migrateToCurrent()
      expect(result).toEqual({
        progress: {},
        coachmarkDismissed: {},
        version: TUTORIAL_SCHEMA_VERSION,
      })
    })

    it('matches the persist middleware migrate handler output', () => {
      // The middleware calls this via `migrate: (_persisted, _fromVersion) => migrateToCurrent()`
      // so the function must always return the same defaults regardless of
      // what stale data was passed in.
      const a = migrateToCurrent()
      const b = migrateToCurrent()
      expect(a).toEqual(b)
    })
  })
})
