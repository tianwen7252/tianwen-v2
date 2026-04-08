import { describe, it, expect, beforeEach } from 'vitest'
import { useInitStore } from './init-store'

describe('useInitStore', () => {
  beforeEach(() => {
    useInitStore.setState({
      bootstrapDone: false,
      showInitUI: false,
      shownAt: null,
      error: null,
      forceInitUI: false,
    })
  })

  it('should have correct initial state', () => {
    const state = useInitStore.getState()
    expect(state.bootstrapDone).toBe(false)
    expect(state.showInitUI).toBe(false)
    expect(state.shownAt).toBeNull()
    expect(state.error).toBeNull()
    expect(state.forceInitUI).toBe(false)
  })

  it('setBootstrapDone should mark bootstrap as complete', () => {
    useInitStore.getState().setBootstrapDone()
    const state = useInitStore.getState()
    expect(state.bootstrapDone).toBe(true)
  })

  it('setError should store error message', () => {
    useInitStore.getState().setError('OPFS locked')
    const state = useInitStore.getState()
    expect(state.error).toBe('OPFS locked')
  })

  it('setShowInitUI(true) should set showInitUI and record shownAt timestamp', () => {
    const before = Date.now()
    useInitStore.getState().setShowInitUI(true)
    const after = Date.now()
    const state = useInitStore.getState()
    expect(state.showInitUI).toBe(true)
    expect(state.shownAt).toBeGreaterThanOrEqual(before)
    expect(state.shownAt).toBeLessThanOrEqual(after)
  })

  it('setShowInitUI(false) should clear showInitUI but keep shownAt', () => {
    useInitStore.getState().setShowInitUI(true)
    const { shownAt } = useInitStore.getState()
    useInitStore.getState().setShowInitUI(false)
    const state = useInitStore.getState()
    expect(state.showInitUI).toBe(false)
    expect(state.shownAt).toBe(shownAt)
  })

  it('setShowInitUI(true) called twice should not update shownAt', () => {
    useInitStore.getState().setShowInitUI(true)
    const { shownAt: first } = useInitStore.getState()
    useInitStore.getState().setShowInitUI(true)
    const { shownAt: second } = useInitStore.getState()
    expect(second).toBe(first)
  })

  it('setForceInitUI should toggle forceInitUI flag', () => {
    useInitStore.getState().setForceInitUI(true)
    expect(useInitStore.getState().forceInitUI).toBe(true)
    useInitStore.getState().setForceInitUI(false)
    expect(useInitStore.getState().forceInitUI).toBe(false)
  })

  it('should not mutate previous state references', () => {
    const before = useInitStore.getState()
    useInitStore.getState().setBootstrapDone()
    const after = useInitStore.getState()
    expect(before).not.toBe(after)
    expect(before.bootstrapDone).toBe(false)
    expect(after.bootstrapDone).toBe(true)
  })
})
