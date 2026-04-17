import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTutorialStore } from '@/stores/tutorial-store'
import { useTutorial, useTutorialStatus } from './use-tutorial'
import { TUTORIAL_SCHEMA_VERSION } from '@/lib/tutorial/constants'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resetStore(): void {
  useTutorialStore.setState({
    activeTutorialId: null,
    activeStepIndex: 0,
    isLauncherOpen: false,
    progress: {},
    coachmarkDismissed: {},
    version: TUTORIAL_SCHEMA_VERSION,
  })
}

// ─── useTutorial ─────────────────────────────────────────────────────────────

describe('useTutorial', () => {
  beforeEach(() => {
    localStorage.clear()
    resetStore()
  })

  it('returns activeTutorialId from the store', () => {
    const { result } = renderHook(() => useTutorial())
    expect(result.current.activeTutorialId).toBeNull()
  })

  it('returns activeStepIndex from the store', () => {
    const { result } = renderHook(() => useTutorial())
    expect(result.current.activeStepIndex).toBe(0)
  })

  it('returns isLauncherOpen from the store', () => {
    const { result } = renderHook(() => useTutorial())
    expect(result.current.isLauncherOpen).toBe(false)
  })

  it('exposes a start action that starts a tutorial', () => {
    const { result } = renderHook(() => useTutorial())
    act(() => {
      result.current.start('tutorial-01')
    })
    expect(useTutorialStore.getState().activeTutorialId).toBe('tutorial-01')
  })

  it('exposes an abort action that aborts the active tutorial', () => {
    useTutorialStore.getState().startTutorial('tutorial-01')
    const { result } = renderHook(() => useTutorial())
    act(() => {
      result.current.abort()
    })
    expect(useTutorialStore.getState().activeTutorialId).toBeNull()
    expect(useTutorialStore.getState().progress['tutorial-01']?.status).toBe(
      'skipped',
    )
  })

  it('exposes a complete action that completes a tutorial', () => {
    useTutorialStore.getState().startTutorial('tutorial-01')
    const { result } = renderHook(() => useTutorial())
    act(() => {
      result.current.complete('tutorial-01')
    })
    expect(useTutorialStore.getState().progress['tutorial-01']?.status).toBe(
      'completed',
    )
  })

  it('exposes a next action that advances the step', () => {
    useTutorialStore.getState().startTutorial('tutorial-01')
    const { result } = renderHook(() => useTutorial())
    act(() => {
      result.current.next()
    })
    expect(useTutorialStore.getState().activeStepIndex).toBe(1)
  })

  it('exposes a goTo action that jumps to a step', () => {
    useTutorialStore.getState().startTutorial('tutorial-01')
    const { result } = renderHook(() => useTutorial())
    act(() => {
      result.current.goTo(4)
    })
    expect(useTutorialStore.getState().activeStepIndex).toBe(4)
  })

  it('exposes openLauncher that opens the launcher', () => {
    const { result } = renderHook(() => useTutorial())
    act(() => {
      result.current.openLauncher()
    })
    expect(useTutorialStore.getState().isLauncherOpen).toBe(true)
  })

  it('exposes closeLauncher that closes the launcher', () => {
    useTutorialStore.getState().openLauncher()
    const { result } = renderHook(() => useTutorial())
    act(() => {
      result.current.closeLauncher()
    })
    expect(useTutorialStore.getState().isLauncherOpen).toBe(false)
  })

  it('exposes getProgress that returns undefined for unknown id', () => {
    const { result } = renderHook(() => useTutorial())
    expect(result.current.getProgress('nonexistent')).toBeUndefined()
  })

  it('exposes getProgress that returns progress after start', () => {
    useTutorialStore.getState().startTutorial('tutorial-01')
    const { result } = renderHook(() => useTutorial())
    const progress = result.current.getProgress('tutorial-01')
    expect(progress?.status).toBe('in-progress')
  })

  it('all returned fields are present', () => {
    const { result } = renderHook(() => useTutorial())
    const keys = Object.keys(result.current)
    expect(keys).toContain('activeTutorialId')
    expect(keys).toContain('activeStepIndex')
    expect(keys).toContain('isLauncherOpen')
    expect(keys).toContain('start')
    expect(keys).toContain('abort')
    expect(keys).toContain('complete')
    expect(keys).toContain('next')
    expect(keys).toContain('goTo')
    expect(keys).toContain('openLauncher')
    expect(keys).toContain('closeLauncher')
    expect(keys).toContain('getProgress')
  })

  it('activeTutorialId updates reactively when startTutorial is called', () => {
    const { result, rerender } = renderHook(() => useTutorial())
    expect(result.current.activeTutorialId).toBeNull()
    act(() => {
      useTutorialStore.getState().startTutorial('tutorial-01')
    })
    rerender()
    expect(result.current.activeTutorialId).toBe('tutorial-01')
  })
})

// ─── useTutorialStatus ────────────────────────────────────────────────────────

describe('useTutorialStatus', () => {
  beforeEach(() => {
    localStorage.clear()
    resetStore()
  })

  it('returns not-started for an unknown tutorialId', () => {
    const { result } = renderHook(() => useTutorialStatus('unknown-tutorial'))
    expect(result.current).toBe('not-started')
  })

  it('returns in-progress after startTutorial', () => {
    act(() => {
      useTutorialStore.getState().startTutorial('tutorial-01')
    })
    const { result } = renderHook(() => useTutorialStatus('tutorial-01'))
    expect(result.current).toBe('in-progress')
  })

  it('returns completed after completeTutorial', () => {
    act(() => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      useTutorialStore.getState().completeTutorial('tutorial-01')
    })
    const { result } = renderHook(() => useTutorialStatus('tutorial-01'))
    expect(result.current).toBe('completed')
  })

  it('returns skipped after abortTutorial', () => {
    act(() => {
      useTutorialStore.getState().startTutorial('tutorial-01')
      useTutorialStore.getState().abortTutorial()
    })
    const { result } = renderHook(() => useTutorialStatus('tutorial-01'))
    expect(result.current).toBe('skipped')
  })

  it('reactively updates when store changes', () => {
    const { result, rerender } = renderHook(() =>
      useTutorialStatus('tutorial-01'),
    )
    expect(result.current).toBe('not-started')

    act(() => {
      useTutorialStore.getState().startTutorial('tutorial-01')
    })
    rerender()
    expect(result.current).toBe('in-progress')
  })
})
