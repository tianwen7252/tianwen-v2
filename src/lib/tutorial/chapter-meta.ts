import type { ChapterId } from './types'

// ─── Types ───────────────────────────────────────────────────────────────────

/** Metadata describing a tutorial chapter shown in the launcher index. */
export interface ChapterMeta {
  /** Matches the ChapterId key. */
  readonly id: ChapterId
  /** i18n key for the chapter title, e.g. 'tutorial.chapter.00.title'. */
  readonly titleKey: string
  /** i18n key for the chapter description, e.g. 'tutorial.chapter.00.description'. */
  readonly descriptionKey: string
  /** When true, only admins can access this chapter's tutorials. */
  readonly adminOnly: boolean
  /**
   * Ordered list of tutorial ids belonging to this chapter.
   * Empty until Story 5/6 populates the tutorial registry.
   */
  readonly tutorialIds: readonly string[]
}

// ─── Data ────────────────────────────────────────────────────────────────────

/**
 * Single source of truth for chapter metadata.
 * Story 5/6 only needs to add ids to `tutorialIds`.
 */
export const CHAPTER_META: Readonly<Record<ChapterId, ChapterMeta>> = {
  '00': {
    id: '00',
    titleKey: 'tutorial.chapter.00.title',
    descriptionKey: 'tutorial.chapter.00.description',
    adminOnly: false,
    tutorialIds: [],
  },
  '10': {
    id: '10',
    titleKey: 'tutorial.chapter.10.title',
    descriptionKey: 'tutorial.chapter.10.description',
    adminOnly: false,
    tutorialIds: [],
  },
  '20': {
    id: '20',
    titleKey: 'tutorial.chapter.20.title',
    descriptionKey: 'tutorial.chapter.20.description',
    adminOnly: false,
    tutorialIds: [],
  },
  '30': {
    id: '30',
    titleKey: 'tutorial.chapter.30.title',
    descriptionKey: 'tutorial.chapter.30.description',
    adminOnly: true,
    tutorialIds: [],
  },
  '40': {
    id: '40',
    titleKey: 'tutorial.chapter.40.title',
    descriptionKey: 'tutorial.chapter.40.description',
    adminOnly: true,
    tutorialIds: [],
  },
  '90': {
    id: '90',
    titleKey: 'tutorial.chapter.90.title',
    descriptionKey: 'tutorial.chapter.90.description',
    adminOnly: false,
    tutorialIds: [],
  },
} as const
