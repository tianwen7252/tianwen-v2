import { create } from 'zustand'

// ─── Types ───────────────────────────────────────────────────────────────────

type ErrorOverlayType = '404' | 'error' | null

/** Overlay kind used for self-registration — drives AppHeader visual state. */
export type OverlayKind = 'error' | 'init' | 'waiting'

/** Ref-counted active overlays so multiple instances are safe. */
interface ActiveOverlays {
  readonly error: number
  readonly init: number
  readonly waiting: number
}

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
  /** Custom message for the error overlay (null = use default from i18n) */
  readonly errorOverlayMessage: string | null
  /** Dev-only: force the waiting UI to display for testing */
  readonly forceWaitingUI: boolean
  /** Ref-counted currently mounted overlays (self-registered by overlay components) */
  readonly activeOverlays: ActiveOverlays
}

interface InitActions {
  setBootstrapDone: () => void
  setError: (msg: string) => void
  setShowInitUI: (show: boolean) => void
  setForceInitUI: (flag: boolean) => void
  setErrorOverlayType: (type: ErrorOverlayType, message?: string) => void
  setForceWaitingUI: (flag: boolean) => void
  pushActiveOverlay: (kind: OverlayKind) => void
  popActiveOverlay: (kind: OverlayKind) => void
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useInitStore = create<InitState & InitActions>((set, get) => ({
  bootstrapDone: false,
  showInitUI: false,
  shownAt: null,
  error: null,
  forceInitUI: false,
  errorOverlayType: null,
  errorOverlayMessage: null,
  forceWaitingUI: false,
  activeOverlays: { error: 0, init: 0, waiting: 0 },

  setBootstrapDone: () => set({ bootstrapDone: true }),

  setError: msg => set({ error: msg }),

  setShowInitUI: show => {
    const { shownAt } = get()
    if (show && shownAt === null) {
      set({ showInitUI: true, shownAt: Date.now() })
    } else {
      set({ showInitUI: show })
    }
  },

  setForceInitUI: flag => set({ forceInitUI: flag }),

  setErrorOverlayType: (type, message) =>
    set({
      errorOverlayType: type,
      errorOverlayMessage: type === null ? null : (message ?? null),
    }),

  setForceWaitingUI: flag => set({ forceWaitingUI: flag }),

  pushActiveOverlay: kind =>
    set(state => ({
      activeOverlays: {
        ...state.activeOverlays,
        [kind]: state.activeOverlays[kind] + 1,
      },
    })),

  popActiveOverlay: kind =>
    set(state => ({
      activeOverlays: {
        ...state.activeOverlays,
        [kind]: Math.max(0, state.activeOverlays[kind] - 1),
      },
    })),
}))
