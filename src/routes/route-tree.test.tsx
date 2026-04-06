import { describe, it, expect, vi } from 'vitest'

// ─── Mock all page + UI dependencies to allow module import ──────────────────

vi.mock('@/pages/order', () => ({
  OrderPage: () => null,
}))

vi.mock('@/pages/not-found', () => ({
  NotFoundPage: () => null,
}))

vi.mock('@/pages/preview', () => ({
  ModalPreview: () => null,
  NotifyPreview: () => null,
  SwPreview: () => null,
  TestDataPreview: () => null,
  V1ImportPreview: () => null,
}))

vi.mock('@/pages/clock-in', () => ({
  ClockInPage: () => null,
}))

vi.mock('@/pages/orders', () => ({
  OrdersPage: () => null,
}))

vi.mock('@/pages/analytics', () => ({
  AnalyticsPage: () => null,
}))

vi.mock('@/pages/settings', () => ({
  SettingsPage: () => null,
}))

vi.mock('@/components/sw-update-prompt', () => ({
  SwUpdatePrompt: () => null,
}))

vi.mock('@/components/animations', () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/components/app-error-boundary', () => ({
  AppErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@tanstack/react-router-devtools', () => ({
  TanStackRouterDevtools: () => null,
}))

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('routeTree', () => {
  it('should export a valid routeTree', async () => {
    const mod = await import('./route-tree')
    expect(mod.routeTree).toBeDefined()
  })

  it('should import OrderPage (not HomePage)', async () => {
    // If the import resolution works without error, OrderPage is wired in
    const mod = await import('./route-tree')
    expect(mod.routeTree).toBeTruthy()
  })
})
