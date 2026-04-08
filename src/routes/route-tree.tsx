import { lazy, Suspense, useEffect } from 'react'
import {
  createRootRoute,
  createRoute,
  Outlet,
  Link,
  useRouterState,
} from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { OrderPage } from '@/pages/order'
import { SwUpdatePrompt } from '@/components/sw-update-prompt'
import { PageTransition } from '@/components/animations'
import { AppErrorBoundary } from '@/components/app-error-boundary'
import { ScrollToTop } from '@/components/ui/scroll-to-top'
import { AppHeader } from '@/components/header/app-header'
import { cn } from '@/lib/cn'
import { useAutoBackup } from '@/hooks/use-auto-backup'
import { useInitStore } from '@/stores/init-store'
import { InitOverlay } from '@/components/init-ui'
import { DatabaseLockedScreen } from '@/components/database-locked'

// Lazy-loaded pages — each becomes a separate chunk
const NotFoundPage = lazy(() =>
  import('@/pages/not-found').then((m) => ({ default: m.NotFoundPage })),
)
const ClockInPage = lazy(() =>
  import('@/pages/clock-in').then((m) => ({ default: m.ClockInPage })),
)
const SettingsPage = lazy(() =>
  import('@/pages/settings').then((m) => ({ default: m.SettingsPage })),
)
const OrdersPage = lazy(() =>
  import('@/pages/orders').then((m) => ({ default: m.OrdersPage })),
)
const AnalyticsPage = lazy(() =>
  import('@/pages/analytics').then((m) => ({ default: m.AnalyticsPage })),
)
// Settings sub-pages — eagerly imported (users tab through all of them, avoids Suspense flash)
import { SystemInfo } from '@/components/settings/system-info'
import { CloudBackup } from '@/components/settings/cloud-backup'
import { Records } from '@/components/records'
import { StaffAdmin } from '@/components/staff-admin'
import { ProductManagement } from '@/components/settings/product-management'
// Dev preview pages — lazy-loaded (dev-only, no flash since PageTransition key uses top-level route)
const ModalPreview = lazy(() =>
  import('@/pages/preview').then((m) => ({ default: m.ModalPreview })),
)
const NotifyPreview = lazy(() =>
  import('@/pages/preview').then((m) => ({ default: m.NotifyPreview })),
)
const SwPreview = lazy(() =>
  import('@/pages/preview').then((m) => ({ default: m.SwPreview })),
)
const TestDataPreview = lazy(() =>
  import('@/pages/preview').then((m) => ({ default: m.TestDataPreview })),
)
const V1ImportPreview = lazy(() =>
  import('@/pages/preview').then((m) => ({ default: m.V1ImportPreview })),
)
const InitUiPreview = lazy(() =>
  import('@/pages/preview').then((m) => ({ default: m.InitUiPreview })),
)

// Root layout with navigation
const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

function RootLayout() {
  const { t } = useTranslation()
  // Use pathname as key to trigger re-mount animation on route changes
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  // Init store — gate content on bootstrap status
  const bootstrapDone = useInitStore((s) => s.bootstrapDone)
  const showInitUI = useInitStore((s) => s.showInitUI)
  const initError = useInitStore((s) => s.error)
  const forceInitUI = useInitStore((s) => s.forceInitUI)

  const shouldShowOverlay = showInitUI || forceInitUI
  // Header stays clickable in dev forceInitUI mode
  const headerDisabled = !bootstrapDone && !initError
  const isReady = bootstrapDone && !shouldShowOverlay && !initError

  // Auto backup — disabled in DEV mode, gated on ready
  useAutoBackup({ enabled: !import.meta.env.DEV && isReady })

  // Escape key dismisses forceInitUI (dev testing)
  useEffect(() => {
    if (!forceInitUI) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') useInitStore.getState().setForceInitUI(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [forceInitUI])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader disabled={headerDisabled} overlayActive={shouldShowOverlay} />

      {/* Main content — gated on init status */}
      <main>
        {initError ? (
          <DatabaseLockedScreen />
        ) : shouldShowOverlay ? (
          <InitOverlay
            onClose={
              forceInitUI
                ? () => useInitStore.getState().setForceInitUI(false)
                : undefined
            }
          />
        ) : isReady ? (
          <AppErrorBoundary title={t('error.appError')}>
            <Suspense>
              <PageTransition key={pathname.split('/').slice(0, 2).join('/')}>
                <Outlet />
              </PageTransition>
            </Suspense>
          </AppErrorBoundary>
        ) : null}
      </main>

      {/* Only show extras when app is ready */}
      {isReady && (
        <>
          {pathname !== '/' && <ScrollToTop />}
          <SwUpdatePrompt />
        </>
      )}
    </div>
  )
}

// Routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: OrderPage,
})

// Dev layout route — tab navigation for component previews
const devRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dev',
  component: DevLayout,
})

const DEV_TABS = [
  { path: '/dev/modal', label: 'Modal' },
  { path: '/dev/notify', label: 'Notify' },
  { path: '/dev/sw', label: 'SW Update' },
  { path: '/dev/test-data', label: 'Test Data' },
  { path: '/dev/v1-import', label: 'V1 Import' },
  { path: '/dev/init-ui', label: 'Info UI' },
] as const

function DevLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  // Redirect /dev to /dev/modal (default tab)
  useEffect(() => {
    if (pathname === '/dev' || pathname === '/dev/') {
      window.history.replaceState(null, '', '/dev/modal')
    }
  }, [pathname])

  return (
    <div>
      {/* Tab navigation */}
      <div className="border-b border-border bg-card px-6">
        <div className="flex gap-1">
          {DEV_TABS.map((tab) => {
            const isActive =
              pathname === tab.path || pathname.startsWith(`${tab.path}/`)
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  'border-b-2 px-4 py-3 text-base transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-6">
        <Outlet />
      </div>
    </div>
  )
}

// Dev index — redirect to modal (handled by DevLayout useEffect)
const devIndexRoute = createRoute({
  getParentRoute: () => devRoute,
  path: '/',
  component: () => null,
})

const devModalRoute = createRoute({
  getParentRoute: () => devRoute,
  path: '/modal',
  component: ModalPreview,
})

const devNotifyRoute = createRoute({
  getParentRoute: () => devRoute,
  path: '/notify',
  component: NotifyPreview,
})

const devSwRoute = createRoute({
  getParentRoute: () => devRoute,
  path: '/sw',
  component: SwPreview,
})

const devTestDataRoute = createRoute({
  getParentRoute: () => devRoute,
  path: '/test-data',
  component: TestDataPreview,
})

const devV1ImportRoute = createRoute({
  getParentRoute: () => devRoute,
  path: '/v1-import',
  component: V1ImportPreview,
})

const devInitUiRoute = createRoute({
  getParentRoute: () => devRoute,
  path: '/init-ui',
  component: InitUiPreview,
})

// Clock-in standalone page
const clockInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clock-in',
  component: ClockInPage,
})

// Orders history page
const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders',
  component: OrdersPage,
})

// Analytics page
const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analytics',
  component: AnalyticsPage,
})

// Settings layout — tab navigation with nested child routes
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
})

// Settings child routes
const settingsIndexRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/',
  component: () => {
    // Default: redirect handled by SettingsPage layout
    return null
  },
})

const settingsSystemInfoRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/system-info',
  component: SystemInfo,
  validateSearch: (search: Record<string, unknown>) => ({
    errorPage:
      typeof search.errorPage === 'number' && search.errorPage >= 1
        ? search.errorPage
        : 1,
  }),
})

const settingsCloudBackupRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/cloud-backup',
  component: CloudBackup,
  validateSearch: (search: Record<string, unknown>) => ({
    backupPage:
      typeof search.backupPage === 'number' && search.backupPage >= 1
        ? search.backupPage
        : 1,
  }),
})

const settingsRecordsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/records',
  component: Records,
})

const settingsStaffAdminRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/staff-admin',
  component: StaffAdmin,
})

const settingsProductManagementRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/product-management',
  component: ProductManagement,
})

// Build the route tree
export const routeTree = rootRoute.addChildren([
  indexRoute,
  ordersRoute,
  analyticsRoute,
  clockInRoute,
  settingsRoute.addChildren([
    settingsIndexRoute,
    settingsSystemInfoRoute,
    settingsCloudBackupRoute,
    settingsRecordsRoute,
    settingsStaffAdminRoute,
    settingsProductManagementRoute,
  ]),
  devRoute.addChildren([
    devIndexRoute,
    devModalRoute,
    devNotifyRoute,
    devSwRoute,
    devTestDataRoute,
    devV1ImportRoute,
    devInitUiRoute,
  ]),
])
