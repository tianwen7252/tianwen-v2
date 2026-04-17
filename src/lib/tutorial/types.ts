// ─── Chapter IDs ─────────────────────────────────────────────────────────────

/** Identifier for tutorial chapters, mapped to onboarding sections. */
export type ChapterId = '00' | '10' | '20' | '30' | '40' | '90'

// ─── Status & Phase ──────────────────────────────────────────────────────────

/** Lifecycle status of a single tutorial. */
export type TutorialStatus =
  | 'not-started'
  | 'in-progress'
  | 'completed'
  | 'skipped'

/**
 * Phase of the tutorial runner UI overlay.
 * Defined here (Story 1) for centralized type reference; consumed in Story 3.
 */
export type RunnerPhase =
  | 'idle'
  | 'navigating'
  | 'waiting-for-target'
  | 'visible'
  | 'transitioning-out'

// ─── Step ────────────────────────────────────────────────────────────────────

/** A single step within a tutorial, describing what the user should see/do. */
export interface TutorialStep {
  /** Unique step identifier within its tutorial. */
  readonly id: string
  /** i18n key for the step title. */
  readonly titleKey: string
  /** i18n key for the step body content. */
  readonly bodyKey: string
  /**
   * Value of `data-tutorial-id` on the target DOM element.
   * When undefined the step renders as a centered modal with no anchor.
   */
  readonly target?: string
  /** App route to navigate to before showing this step. */
  readonly route?: string
  /** Preferred tooltip placement relative to the target element. */
  readonly placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  /** When true, the user can interact with the target element during the step. */
  readonly allowInteraction?: boolean
  /**
   * Anchor into the documentation, e.g.
   * `'10-點餐操作.md#編輯已送出訂單'`
   */
  readonly docsAnchor?: string
  /** Optional access restrictions for this step. */
  readonly requires?: {
    readonly admin?: boolean
  }
}

// ─── Definition ──────────────────────────────────────────────────────────────

/** Full definition of a tutorial, including its steps and metadata. */
export interface TutorialDefinition {
  /** Unique identifier for this tutorial. */
  readonly id: string
  /** Chapter this tutorial belongs to. */
  readonly chapter: ChapterId
  /** i18n key for the tutorial title shown in the launcher. */
  readonly titleKey: string
  /** i18n key for the tutorial description shown in the launcher. */
  readonly descriptionKey: string
  /** When true, only admin users can access this tutorial. */
  readonly adminOnly: boolean
  /** Estimated time to complete in seconds (used for display only). */
  readonly estimatedSeconds: number
  /** Ordered list of steps. */
  readonly steps: readonly TutorialStep[]
}

// ─── Progress ────────────────────────────────────────────────────────────────

/** Persisted progress record for a single tutorial. */
export interface TutorialProgress {
  /** Matches the corresponding `TutorialDefinition.id`. */
  readonly tutorialId: string
  /** Current completion status. */
  readonly status: TutorialStatus
  /** Zero-based index of the current step. */
  readonly currentStepIndex: number
  /** Unix timestamp (ms) of the most recent update. */
  readonly lastUpdatedAt: number
}
