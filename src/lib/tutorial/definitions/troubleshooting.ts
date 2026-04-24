import type { TutorialDefinition } from '@/lib/tutorial/types'

// ─── Chapter 90 — 疑難排解 ────────────────────────────────────────────────────

/**
 * Interactive tutorial for Chapter 90 (疑難排解).
 * All steps are narrative and centered — no UI elements to highlight.
 * Content drawn from docs/user-guide/90-疑難排解.md.
 */
export const troubleshootingTutorial: TutorialDefinition = {
  id: 'troubleshooting',
  chapter: '90',
  titleKey: 'tutorial.troubleshooting.title',
  descriptionKey: 'tutorial.troubleshooting.description',
  adminOnly: false,
  estimatedSeconds: 60,
  steps: [
    {
      id: 'overview',
      titleKey: 'tutorial.troubleshooting.steps.overview.title',
      bodyKey: 'tutorial.troubleshooting.steps.overview.body',
      // Centered — narrative intro
    },
    {
      id: 'stuckOnLoading',
      titleKey: 'tutorial.troubleshooting.steps.stuckOnLoading.title',
      bodyKey: 'tutorial.troubleshooting.steps.stuckOnLoading.body',
      // Centered — describes an overlay state; cannot be highlighted live
    },
    {
      id: 'backupFailed',
      titleKey: 'tutorial.troubleshooting.steps.backupFailed.title',
      bodyKey: 'tutorial.troubleshooting.steps.backupFailed.body',
      // Centered — error state guidance; no dedicated UI target
    },
    {
      id: 'clockInIssue',
      titleKey: 'tutorial.troubleshooting.steps.clockInIssue.title',
      bodyKey: 'tutorial.troubleshooting.steps.clockInIssue.body',
      // Centered — describes a remediation step
    },
    {
      id: 'orderIssue',
      titleKey: 'tutorial.troubleshooting.steps.orderIssue.title',
      bodyKey: 'tutorial.troubleshooting.steps.orderIssue.body',
      // Centered — describes a remediation step
    },
    {
      id: 'reportProblem',
      titleKey: 'tutorial.troubleshooting.steps.reportProblem.title',
      bodyKey: 'tutorial.troubleshooting.steps.reportProblem.body',
      // Centered — general guidance; no specific UI target
    },
    {
      id: 'done',
      titleKey: 'tutorial.troubleshooting.steps.done.title',
      bodyKey: 'tutorial.troubleshooting.steps.done.body',
      // Centered — completion card for chapter consistency
    },
  ],
} as const
