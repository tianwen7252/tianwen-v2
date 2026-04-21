import type { TutorialDefinition } from '@/lib/tutorial/types'

// ─── Chapter 40 — 雲端備份 ────────────────────────────────────────────────────

/**
 * Interactive tutorial for Chapter 40 (雲端備份).
 * Walks admin users through the cloud backup page: manual backup,
 * backup history, schedule, and V1 import.
 *
 * Security note: No step body references credentials, bucket names,
 * or access keys. All backup setup language uses general terms only.
 */
export const cloudBackupTutorial: TutorialDefinition = {
  id: 'cloud-backup',
  chapter: '40',
  titleKey: 'tutorial.cloudBackup.title',
  descriptionKey: 'tutorial.cloudBackup.description',
  adminOnly: true,
  estimatedSeconds: 90,
  steps: [
    {
      id: 'overview',
      titleKey: 'tutorial.cloudBackup.steps.overview.title',
      bodyKey: 'tutorial.cloudBackup.steps.overview.body',
      // Centered overview card — no anchor needed
    },
    {
      id: 'openBackupTab',
      titleKey: 'tutorial.cloudBackup.steps.openBackupTab.title',
      bodyKey: 'tutorial.cloudBackup.steps.openBackupTab.body',
      target: 'header.nav.settings',
      placement: 'bottom',
      // No route — navigate from anywhere to settings then backup tab
    },
    {
      id: 'manualBackup',
      titleKey: 'tutorial.cloudBackup.steps.manualBackup.title',
      bodyKey: 'tutorial.cloudBackup.steps.manualBackup.body',
      target: 'settings.cloudBackup.actions',
      placement: 'bottom',
      route: '/settings/cloud-backup',
    },
    {
      id: 'backupHistory',
      titleKey: 'tutorial.cloudBackup.steps.backupHistory.title',
      bodyKey: 'tutorial.cloudBackup.steps.backupHistory.body',
      target: 'settings.cloudBackup.history',
      placement: 'top',
      route: '/settings/cloud-backup',
    },
    {
      id: 'schedule',
      titleKey: 'tutorial.cloudBackup.steps.schedule.title',
      bodyKey: 'tutorial.cloudBackup.steps.schedule.body',
      route: '/settings/cloud-backup',
      // Centered — schedule selector is inside the actions card; no separate anchor
    },
    {
      id: 'v1Import',
      titleKey: 'tutorial.cloudBackup.steps.v1Import.title',
      bodyKey: 'tutorial.cloudBackup.steps.v1Import.body',
      target: 'settings.cloudBackup.v1Import',
      placement: 'top',
      route: '/settings/cloud-backup',
    },
    {
      id: 'done',
      titleKey: 'tutorial.cloudBackup.steps.done.title',
      bodyKey: 'tutorial.cloudBackup.steps.done.body',
      // Centered completion card — no anchor needed
    },
  ],
} as const
