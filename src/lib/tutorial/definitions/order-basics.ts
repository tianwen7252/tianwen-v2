import type { TutorialDefinition } from '@/lib/tutorial/types'

// ─── Chapter 10 — 點餐操作 ────────────────────────────────────────────────────

/**
 * Interactive tutorial for Chapter 10 (點餐操作).
 * Walks the user through the full order flow: selecting products,
 * adjusting quantities, adding notes, applying discounts, and submitting.
 */
export const orderBasicsTutorial: TutorialDefinition = {
  id: 'order-basics',
  chapter: '10',
  titleKey: 'tutorial.order.title',
  descriptionKey: 'tutorial.order.description',
  adminOnly: false,
  estimatedSeconds: 120,
  steps: [
    {
      id: 'overview',
      titleKey: 'tutorial.order.steps.overview.title',
      bodyKey: 'tutorial.order.steps.overview.body',
      route: '/',
      // Centered overview card — no single anchor
    },
    {
      id: 'category-tabs',
      titleKey: 'tutorial.order.steps.categoryTabs.title',
      bodyKey: 'tutorial.order.steps.categoryTabs.body',
      target: 'order.categoryTabs',
      placement: 'bottom',
      route: '/',
    },
    {
      id: 'select-product',
      titleKey: 'tutorial.order.steps.selectProduct.title',
      bodyKey: 'tutorial.order.steps.selectProduct.body',
      target: 'order.productGrid',
      placement: 'right',
      route: '/',
    },
    {
      id: 'order-panel',
      titleKey: 'tutorial.order.steps.orderPanel.title',
      bodyKey: 'tutorial.order.steps.orderPanel.body',
      target: 'order.summary',
      placement: 'left',
      route: '/',
    },
    {
      id: 'adjust-quantity',
      titleKey: 'tutorial.order.steps.adjustQuantity.title',
      bodyKey: 'tutorial.order.steps.adjustQuantity.body',
      target: 'order.summary',
      placement: 'left',
      route: '/',
    },
    {
      id: 'note-tags',
      titleKey: 'tutorial.order.steps.noteTags.title',
      bodyKey: 'tutorial.order.steps.noteTags.body',
      route: '/',
      // target intentionally undefined: tags only visible after item is added
    },
    {
      id: 'discount',
      titleKey: 'tutorial.order.steps.discount.title',
      bodyKey: 'tutorial.order.steps.discount.body',
      // Centered — there is no dedicated discount section in the live UI;
      // discounts are entered via the calculator as negative-amount items.
      route: '/',
      docsAnchor: '10-點餐操作.md#折扣處理',
    },
    {
      id: 'calculator',
      titleKey: 'tutorial.order.steps.calculator.title',
      bodyKey: 'tutorial.order.steps.calculator.body',
      route: '/',
      // Centered — calculator toggle button has no stable anchor separate from productGrid
    },
    {
      id: 'submit',
      titleKey: 'tutorial.order.steps.submit.title',
      bodyKey: 'tutorial.order.steps.submit.body',
      target: 'order.submit',
      placement: 'top',
      route: '/',
    },
    {
      id: 'recent-orders',
      titleKey: 'tutorial.order.steps.recentOrders.title',
      bodyKey: 'tutorial.order.steps.recentOrders.body',
      target: 'order.panelTabs',
      placement: 'left',
      route: '/',
    },
    {
      id: 'edit-order',
      titleKey: 'tutorial.order.steps.editOrder.title',
      bodyKey: 'tutorial.order.steps.editOrder.body',
      route: '/',
      // Centered — swipe interaction cannot be highlighted while static
    },
    {
      id: 'done',
      titleKey: 'tutorial.order.steps.done.title',
      bodyKey: 'tutorial.order.steps.done.body',
      route: '/',
      // Centered completion card
    },
  ],
} as const
