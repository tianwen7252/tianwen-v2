import { create } from 'zustand'

/**
 * Tracks unsaved changes across the app. Settings sections (e.g.
 * ProductManagement) flag themselves dirty here so global UI like the
 * scroll-to-top button can prompt the user to save before they navigate
 * away or scroll past the save button.
 */

interface UnsavedChangesState {
  /** Map of section keys → dirty flag. */
  readonly dirty: Readonly<Record<string, boolean>>
}

interface UnsavedChangesActions {
  /** Set or clear the dirty flag for a section. */
  setDirty: (sectionKey: string, isDirty: boolean) => void
  /** Clear every section flag at once (e.g. after a successful save). */
  clearAll: () => void
}

type UnsavedChangesStore = UnsavedChangesState & UnsavedChangesActions

export const useUnsavedChangesStore = create<UnsavedChangesStore>(set => ({
  dirty: {},
  setDirty: (sectionKey, isDirty) =>
    set(state => {
      const current = state.dirty[sectionKey] ?? false
      if (current === isDirty) return state
      const next = { ...state.dirty }
      if (isDirty) {
        next[sectionKey] = true
      } else {
        delete next[sectionKey]
      }
      return { dirty: next }
    }),
  clearAll: () =>
    set(state =>
      Object.keys(state.dirty).length === 0 ? state : { dirty: {} },
    ),
}))

/** Convenience selector: true when any section reports unsaved changes. */
export const selectHasAnyUnsavedChanges = (
  state: UnsavedChangesStore,
): boolean => Object.values(state.dirty).some(Boolean)
