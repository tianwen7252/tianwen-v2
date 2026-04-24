import type { ChapterId } from './types'

// ─── Storage ─────────────────────────────────────────────────────────────────

/** localStorage key used by the zustand persist middleware for tutorial state. */
export const TUTORIAL_STORE_KEY = 'tutorial-store'

/** Schema version. Increment when persisted shape changes to trigger migration. */
export const TUTORIAL_SCHEMA_VERSION = 1

// ─── Timing ──────────────────────────────────────────────────────────────────

/** Maximum time (ms) to wait for a target selector to appear in the DOM. */
export const WAIT_FOR_SELECTOR_TIMEOUT_MS = 3000

// ─── Chapter ordering ────────────────────────────────────────────────────────

/** Canonical display order for tutorial chapters in the launcher. */
export const CHAPTER_ORDER: readonly ChapterId[] = [
  '00',
  '10',
  '20',
  '30',
  '40',
  '90',
] as const
