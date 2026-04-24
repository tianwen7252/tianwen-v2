import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTutorialStore } from '@/stores/tutorial-store'
import { useCoachmarkDismiss } from './use-coachmark-dismiss'

// ─── Setup ────────────────────────────────────────────────────────────────────

function resetStore() {
  useTutorialStore.setState({
    coachmarkDismissed: {},
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useCoachmarkDismiss', () => {
  beforeEach(() => {
    resetStore()
  })

  it('returns dismissed: false for an unknown id', () => {
    const { result } = renderHook(() =>
      useCoachmarkDismiss('coachmark.unknown'),
    )
    expect(result.current.dismissed).toBe(false)
  })

  it('returns dismissed: true after dismiss() is called', () => {
    const { result } = renderHook(() =>
      useCoachmarkDismiss('coachmark.recentOrders.swipeToEdit'),
    )
    expect(result.current.dismissed).toBe(false)

    act(() => {
      result.current.dismiss()
    })

    expect(result.current.dismissed).toBe(true)
  })

  it('multiple coachmarks stay independent', () => {
    const { result: resultA } = renderHook(() =>
      useCoachmarkDismiss('coachmark.a'),
    )
    const { result: resultB } = renderHook(() =>
      useCoachmarkDismiss('coachmark.b'),
    )

    act(() => {
      resultA.current.dismiss()
    })

    expect(resultA.current.dismissed).toBe(true)
    expect(resultB.current.dismissed).toBe(false)
  })

  it('persists across hook remounts (zustand store carries the state)', () => {
    const id = 'coachmark.persistTest'

    // First mount — dismiss
    const { result, unmount } = renderHook(() => useCoachmarkDismiss(id))
    act(() => {
      result.current.dismiss()
    })
    unmount()

    // Second mount — state should still be dismissed
    const { result: result2 } = renderHook(() => useCoachmarkDismiss(id))
    expect(result2.current.dismissed).toBe(true)
  })

  it('dismiss is idempotent — calling twice does not change the result', () => {
    const { result } = renderHook(() =>
      useCoachmarkDismiss('coachmark.idempotent'),
    )

    act(() => {
      result.current.dismiss()
      result.current.dismiss()
    })

    expect(result.current.dismissed).toBe(true)
  })
})
