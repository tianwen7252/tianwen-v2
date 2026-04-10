import { create } from 'zustand'

// ─── Types ───────────────────────────────────────────────────────────────────

type ErrorOverlayType = '404' | '500' | 'error' | null

interface InitState {
  /** Whether the database bootstrap has completed successfully */
  readonly bootstrapDone: boolean
  /** Whether the init UI overlay is currently visible */
  readonly showInitUI: boolean
  /** Timestamp (ms) when the init UI was first shown — used for minimum display duration */
  readonly shownAt: number | null
  /** Error message if bootstrap failed (null = no error) */
  readonly error: string | null
  /** Dev-only: force the init UI to display for testing */
  readonly forceInitUI: boolean
  /** Active error overlay type (null = hidden) */
  readonly errorOverlayType: ErrorOverlayType
  /** Dev-only: force the waiting UI to display for testing */
  readonly forceWaitingUI: boolean
}

interface InitActions {
  setBootstrapDone: () => void
  setError: (msg: string) => void
  setShowInitUI: (show: boolean) => void
  setForceInitUI: (flag: boolean) => void
  setErrorOverlayType: (type: ErrorOverlayType) => void
  setForceWaitingUI: (flag: boolean) => void
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useInitStore = create<InitState & InitActions>((set, get) => ({
  bootstrapDone: false,
  showInitUI: false,
  shownAt: null,
  error: null,
  forceInitUI: false,
  errorOverlayType: null,
  forceWaitingUI: false,

  setBootstrapDone: () => set({ bootstrapDone: true }),

  setError: msg => set({ error: msg }),

  setShowInitUI: show => {
    const { shownAt } = get()
    if (show && shownAt === null) {
      // First time showing — record timestamp
      set({ showInitUI: true, shownAt: Date.now() })
    } else {
      // Hide or already shown before — don't update shownAt
      set({ showInitUI: show })
    }
  },

  setForceInitUI: flag => set({ forceInitUI: flag }),

  setErrorOverlayType: type => set({ errorOverlayType: type }),

  setForceWaitingUI: flag => set({ forceWaitingUI: flag }),
}))
