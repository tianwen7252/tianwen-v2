import { describe, it, expect, beforeEach } from 'vitest'
import {
  useUnsavedChangesStore,
  selectHasAnyUnsavedChanges,
} from './unsaved-changes-store'

describe('unsaved-changes-store', () => {
  beforeEach(() => {
    useUnsavedChangesStore.getState().clearAll()
  })

  it('starts with no dirty sections', () => {
    expect(useUnsavedChangesStore.getState().dirty).toEqual({})
    expect(selectHasAnyUnsavedChanges(useUnsavedChangesStore.getState())).toBe(
      false,
    )
  })

  it('sets a section as dirty', () => {
    useUnsavedChangesStore.getState().setDirty('product-management', true)
    expect(selectHasAnyUnsavedChanges(useUnsavedChangesStore.getState())).toBe(
      true,
    )
    expect(useUnsavedChangesStore.getState().dirty['product-management']).toBe(
      true,
    )
  })

  it('removes the entry when set to false (no leftover false flags)', () => {
    useUnsavedChangesStore.getState().setDirty('a', true)
    useUnsavedChangesStore.getState().setDirty('a', false)
    expect(useUnsavedChangesStore.getState().dirty).toEqual({})
  })

  it('does not produce a new state object when nothing changes', () => {
    const before = useUnsavedChangesStore.getState()
    useUnsavedChangesStore.getState().setDirty('a', false)
    const after = useUnsavedChangesStore.getState()
    expect(after).toBe(before)
  })

  it('reports any-dirty across multiple sections', () => {
    useUnsavedChangesStore.getState().setDirty('a', false)
    useUnsavedChangesStore.getState().setDirty('b', true)
    expect(selectHasAnyUnsavedChanges(useUnsavedChangesStore.getState())).toBe(
      true,
    )
    useUnsavedChangesStore.getState().setDirty('b', false)
    expect(selectHasAnyUnsavedChanges(useUnsavedChangesStore.getState())).toBe(
      false,
    )
  })

  it('clearAll wipes every section', () => {
    useUnsavedChangesStore.getState().setDirty('a', true)
    useUnsavedChangesStore.getState().setDirty('b', true)
    useUnsavedChangesStore.getState().clearAll()
    expect(useUnsavedChangesStore.getState().dirty).toEqual({})
  })
})
