import type { TutorialDefinition, ChapterId } from '@/lib/tutorial/types'

// ─── Types ───────────────────────────────────────────────────────────────────

/** Async factory that lazily loads a TutorialDefinition. */
type DefinitionLoader = () => Promise<TutorialDefinition>

// ─── Registry ────────────────────────────────────────────────────────────────

/**
 * Maps tutorial id → lazy loader.
 * Add new tutorials here; each module is code-split at build time.
 */
export const TUTORIAL_REGISTRY: Readonly<Record<string, DefinitionLoader>> = {
  'first-setup': () => import('./first-setup').then(m => m.firstSetupTutorial),
  'order-basics': () =>
    import('./order-basics').then(m => m.orderBasicsTutorial),
}

// ─── Chapter mapping ─────────────────────────────────────────────────────────

/**
 * Maps chapter id → ordered list of tutorial ids belonging to that chapter.
 * This is the single source of truth consumed by chapter-meta.ts.
 */
export const CHAPTER_TUTORIALS: Readonly<Record<ChapterId, readonly string[]>> =
  {
    '00': ['first-setup'],
    '10': ['order-basics'],
    '20': [],
    '30': [],
    '40': [],
    '90': [],
  }
