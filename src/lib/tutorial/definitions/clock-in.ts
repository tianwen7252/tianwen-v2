import type { TutorialDefinition } from '@/lib/tutorial/types'

// ─── Chapter 20 — 打卡與出勤 ──────────────────────────────────────────────────

/**
 * Interactive tutorial for Chapter 20 (打卡與出勤).
 * Walks the user through the clock-in page, finding their card,
 * and completing the clock-in/out flow.
 */
export const clockInTutorial: TutorialDefinition = {
  id: 'clock-in-basics',
  chapter: '20',
  titleKey: 'tutorial.clockIn.title',
  descriptionKey: 'tutorial.clockIn.description',
  adminOnly: false,
  estimatedSeconds: 60,
  steps: [
    {
      id: 'overview',
      titleKey: 'tutorial.clockIn.steps.overview.title',
      bodyKey: 'tutorial.clockIn.steps.overview.body',
      // Centered overview card — no anchor needed
    },
    {
      id: 'page',
      titleKey: 'tutorial.clockIn.steps.page.title',
      bodyKey: 'tutorial.clockIn.steps.page.body',
      target: 'clockIn.page',
      placement: 'bottom',
      route: '/clock-in',
    },
    {
      id: 'cardList',
      titleKey: 'tutorial.clockIn.steps.cardList.title',
      bodyKey: 'tutorial.clockIn.steps.cardList.body',
      target: 'clockIn.employeeCardList',
      placement: 'bottom',
      route: '/clock-in',
    },
    {
      id: 'clockInAction',
      titleKey: 'tutorial.clockIn.steps.clockInAction.title',
      bodyKey: 'tutorial.clockIn.steps.clockInAction.body',
      route: '/clock-in',
      // Centered — confirmation modal cannot be pre-opened for highlight
    },
    {
      id: 'clockOut',
      titleKey: 'tutorial.clockIn.steps.clockOut.title',
      bodyKey: 'tutorial.clockIn.steps.clockOut.body',
      route: '/clock-in',
      // Centered — state depends on whether the user has already clocked in
    },
    {
      id: 'done',
      titleKey: 'tutorial.clockIn.steps.done.title',
      bodyKey: 'tutorial.clockIn.steps.done.body',
      // Centered completion card — no anchor needed
    },
  ],
} as const
