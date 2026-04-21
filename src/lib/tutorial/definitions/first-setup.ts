import type { TutorialDefinition } from '@/lib/tutorial/types'

// ─── Chapter 00 — 首次設定 ────────────────────────────────────────────────────

/**
 * Interactive tutorial for Chapter 00 (首次設定).
 * Walks the user through the navigation bar, key pages, user menu,
 * and the tutorial launcher itself.
 */
export const firstSetupTutorial: TutorialDefinition = {
  id: 'first-setup',
  chapter: '00',
  titleKey: 'tutorial.firstSetup.title',
  descriptionKey: 'tutorial.firstSetup.description',
  adminOnly: false,
  estimatedSeconds: 90,
  steps: [
    {
      id: 'welcome',
      titleKey: 'tutorial.firstSetup.steps.welcome.title',
      bodyKey: 'tutorial.firstSetup.steps.welcome.body',
      // Centered welcome card — no anchor needed
    },
    {
      id: 'nav-bar',
      titleKey: 'tutorial.firstSetup.steps.navBar.title',
      bodyKey: 'tutorial.firstSetup.steps.navBar.body',
      target: 'header.nav.home',
      placement: 'bottom',
      docsAnchor: '00-首次設定.md#認識導覽列',
    },
    {
      id: 'home-page',
      titleKey: 'tutorial.firstSetup.steps.homePage.title',
      bodyKey: 'tutorial.firstSetup.steps.homePage.body',
      target: 'header.nav.home',
      placement: 'bottom',
    },
    {
      id: 'clock-in',
      titleKey: 'tutorial.firstSetup.steps.clockIn.title',
      bodyKey: 'tutorial.firstSetup.steps.clockIn.body',
      target: 'header.nav.clockIn',
      placement: 'bottom',
    },
    {
      id: 'orders',
      titleKey: 'tutorial.firstSetup.steps.orders.title',
      bodyKey: 'tutorial.firstSetup.steps.orders.body',
      target: 'header.nav.orders',
      placement: 'bottom',
    },
    {
      id: 'analytics',
      titleKey: 'tutorial.firstSetup.steps.analytics.title',
      bodyKey: 'tutorial.firstSetup.steps.analytics.body',
      target: 'header.nav.analytics',
      placement: 'bottom',
    },
    {
      id: 'settings',
      titleKey: 'tutorial.firstSetup.steps.settings.title',
      bodyKey: 'tutorial.firstSetup.steps.settings.body',
      target: 'header.nav.settings',
      placement: 'bottom',
    },
    {
      id: 'user-menu',
      titleKey: 'tutorial.firstSetup.steps.userMenu.title',
      bodyKey: 'tutorial.firstSetup.steps.userMenu.body',
      target: 'header.userMenu',
      placement: 'bottom',
      docsAnchor: '00-首次設定.md#右上角選單',
    },
    {
      id: 'tutorial-launcher',
      titleKey: 'tutorial.firstSetup.steps.tutorialLauncher.title',
      bodyKey: 'tutorial.firstSetup.steps.tutorialLauncher.body',
      target: 'header.tutorialLauncher',
      placement: 'bottom',
    },
    {
      id: 'done',
      titleKey: 'tutorial.firstSetup.steps.done.title',
      bodyKey: 'tutorial.firstSetup.steps.done.body',
      // Centered completion card — no anchor needed
    },
  ],
} as const
