import { create } from 'zustand'

// ─── Types ───────────────────────────────────────────────────────────────────

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
}

interface InitActions {
  setBootstrapDone: () => void
  setError: (msg: string) => void
  setShowInitUI: (show: boolean) => void
  setForceInitUI: (flag: boolean) => void
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useInitStore = create<InitState & InitActions>((set, get) => ({
  bootstrapDone: false,
  showInitUI: false,
  shownAt: null,
  error: null,
  forceInitUI: false,

  setBootstrapDone: () => set({ bootstrapDone: true }),

  setError: (msg) => set({ error: msg }),

  setShowInitUI: (show) => {
    const { shownAt } = get()
    if (show && shownAt === null) {
      // First time showing — record timestamp
      set({ showInitUI: true, shownAt: Date.now() })
    } else {
      // Hide or already shown before — don't update shownAt
      set({ showInitUI: show })
    }
  },

  setForceInitUI: (flag) => set({ forceInitUI: flag }),
}))
