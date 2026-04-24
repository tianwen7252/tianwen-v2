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
  'clock-in-basics': () => import('./clock-in').then(m => m.clockInTutorial),
  'admin-management': () =>
    import('./admin-management').then(m => m.adminManagementTutorial),
  'cloud-backup': () =>
    import('./cloud-backup').then(m => m.cloudBackupTutorial),
  troubleshooting: () =>
    import('./troubleshooting').then(m => m.troubleshootingTutorial),
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
    '20': ['clock-in-basics'],
    '30': ['admin-management'],
    '40': ['cloud-backup'],
    '90': ['troubleshooting'],
  }
