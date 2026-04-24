import type { TutorialDefinition } from '@/lib/tutorial/types'

// ─── Chapter 30 — 管理功能 ────────────────────────────────────────────────────

/**
 * Interactive tutorial for Chapter 30 (管理功能).
 * Walks admin users through the settings page: system info, staff admin,
 * and product management.
 */
export const adminManagementTutorial: TutorialDefinition = {
  id: 'admin-management',
  chapter: '30',
  titleKey: 'tutorial.adminManagement.title',
  descriptionKey: 'tutorial.adminManagement.description',
  adminOnly: true,
  estimatedSeconds: 90,
  steps: [
    {
      id: 'overview',
      titleKey: 'tutorial.adminManagement.steps.overview.title',
      bodyKey: 'tutorial.adminManagement.steps.overview.body',
      // Centered overview card — no anchor needed
    },
    {
      id: 'openSettings',
      titleKey: 'tutorial.adminManagement.steps.openSettings.title',
      bodyKey: 'tutorial.adminManagement.steps.openSettings.body',
      target: 'header.nav.settings',
      placement: 'bottom',
      // No route — the settings nav item is reachable from any page
    },
    {
      id: 'systemInfo',
      titleKey: 'tutorial.adminManagement.steps.systemInfo.title',
      bodyKey: 'tutorial.adminManagement.steps.systemInfo.body',
      target: 'settings.systemInfo',
      placement: 'bottom',
      route: '/settings/system-info',
    },
    {
      id: 'staffAdmin',
      titleKey: 'tutorial.adminManagement.steps.staffAdmin.title',
      bodyKey: 'tutorial.adminManagement.steps.staffAdmin.body',
      target: 'settings.staffAdmin',
      placement: 'bottom',
      route: '/settings/staff-admin',
    },
    {
      id: 'productManagement',
      titleKey: 'tutorial.adminManagement.steps.productManagement.title',
      bodyKey: 'tutorial.adminManagement.steps.productManagement.body',
      target: 'settings.productManagement',
      placement: 'bottom',
      route: '/settings/product-management',
    },
    {
      id: 'done',
      titleKey: 'tutorial.adminManagement.steps.done.title',
      bodyKey: 'tutorial.adminManagement.steps.done.body',
      // Centered completion card — no anchor needed
    },
  ],
} as const
