import { lazy, Suspense, useEffect, useSyncExternalStore } from 'react'
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
import { ErrorOverlay } from '@/components/error-ui'
import { WaitingOverlay } from '@/components/waiting-ui'

// ─── Portrait detection (SSR-safe via useSyncExternalStore) ─────────────────

const portraitQuery =
  typeof window !== 'undefined'
    ? window.matchMedia('(orientation: portrait)')
    : null

function subscribePortrait(cb: () => void) {
  portraitQuery?.addEventListener('change', cb)
  return () => portraitQuery?.removeEventListener('change', cb)
}

function getPortrait() {
  return portraitQuery?.matches ?? false
}

function getPortraitServer() {
  return false
}

// Lazy-loaded pages — each becomes a separate chunk
const NotFoundPage = lazy(() =>
  import('@/pages/not-found').then(m => ({ default: m.NotFoundPage })),
)
const ClockInPage = lazy(() =>
  import('@/pages/clock-in').then(m => ({ default: m.ClockInPage })),
)
const SettingsPage = lazy(() =>
  import('@/pages/settings').then(m => ({ default: m.SettingsPage })),
)
const OrdersPage = lazy(() =>
  import('@/pages/orders').then(m => ({ default: m.OrdersPage })),
)
const AnalyticsPage = lazy(() =>
  import('@/pages/analytics').then(m => ({ default: m.AnalyticsPage })),
)
// Settings sub-pages — eagerly imported (users tab through all of them, avoids Suspense flash)
import { SystemInfo } from '@/components/settings/system-info'
import { CloudBackup } from '@/components/settings/cloud-backup'
import { Records } from '@/components/records'
import { StaffAdmin } from '@/components/staff-admin'
import { ProductManagement } from '@/components/settings/product-management'
import { CheckoutRecords } from '@/components/settings/checkout-records'
// Dev preview pages — lazy-loaded (dev-only, no flash since PageTransition key uses top-level route)
const ModalPreview = lazy(() =>
  import('@/pages/preview').then(m => ({ default: m.ModalPreview })),
)
const NotifyPreview = lazy(() =>
  import('@/pages/preview').then(m => ({ default: m.NotifyPreview })),
)
const SwPreview = lazy(() =>
  import('@/pages/preview').then(m => ({ default: m.SwPreview })),
)
const TestDataPreview = lazy(() =>
  import('@/pages/preview').then(m => ({ default: m.TestDataPreview })),
)
const V1ImportPreview = lazy(() =>
  import('@/pages/preview').then(m => ({ default: m.V1ImportPreview })),
)
const InitUiPreview = lazy(() =>
  import('@/pages/preview').then(m => ({ default: m.InitUiPreview })),
)

// Root layout with navigation
const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

function RootLayout() {
  const { t } = useTranslation()
  // Use pathname as key to trigger re-mount animation on route changes
  const pathname = useRouterState({ select: s => s.location.pathname })

  // Init store — gate content on bootstrap status
  const bootstrapDone = useInitStore(s => s.bootstrapDone)
  const showInitUI = useInitStore(s => s.showInitUI)
  const initError = useInitStore(s => s.error)
  const forceInitUI = useInitStore(s => s.forceInitUI)

  const errorOverlayType = useInitStore(s => s.errorOverlayType)
  const errorOverlayMessage = useInitStore(s => s.errorOverlayMessage)
  const forceWaitingUI = useInitStore(s => s.forceWaitingUI)
  const activeOverlays = useInitStore(s => s.activeOverlays)

  // Portrait orientation detection
  const isPortrait = useSyncExternalStore(
    subscribePortrait,
    getPortrait,
    getPortraitServer,
  )

  const shouldShowOverlay = showInitUI || forceInitUI
  const shouldShowErrorOverlay = errorOverlayType !== null
  const shouldShowWaiting = isPortrait || forceWaitingUI

  // Header visual state is driven by actually-mounted overlays (via
  // activeOverlays ref count), so any overlay — regardless of who renders
  // it (RootLayout, NotFoundPage, etc.) — will update the header correctly.
  const anyOverlayActive =
    activeOverlays.error > 0 ||
    activeOverlays.init > 0 ||
    activeOverlays.waiting > 0
  // Error overlay does NOT block header; init/waiting do (except in dev).
  const blockingOverlayActive =
    activeOverlays.init > 0 || activeOverlays.waiting > 0
  const headerDisabled =
    (!bootstrapDone && !initError) ||
    (blockingOverlayActive && !import.meta.env.DEV)
  const isReady = bootstrapDone && !shouldShowOverlay && !initError

  // Auto backup — disabled in DEV mode, gated on ready
  useAutoBackup({ enabled: !import.meta.env.DEV && isReady })

  // Bootstrap error → trigger ErrorOverlay
  useEffect(() => {
    if (initError) {
      useInitStore.getState().setErrorOverlayType('error', initError)
    }
  }, [initError])

  // Escape key dismisses forced overlays (dev testing)
  useEffect(() => {
    if (!forceInitUI && !shouldShowErrorOverlay && !forceWaitingUI) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (forceInitUI) useInitStore.getState().setForceInitUI(false)
        if (shouldShowErrorOverlay)
          useInitStore.getState().setErrorOverlayType(null)
        if (forceWaitingUI) useInitStore.getState().setForceWaitingUI(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [forceInitUI, shouldShowErrorOverlay, forceWaitingUI])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader disabled={headerDisabled} overlayActive={anyOverlayActive} />

      {/* Main content — gated on init status */}
      <main>
        {shouldShowOverlay ? (
          <InitOverlay
            onClose={
              forceInitUI
                ? () => useInitStore.getState().setForceInitUI(false)
                : undefined
            }
          />
        ) : isReady ? (
          <AppErrorBoundary>
            <Suspense>
              <PageTransition key={pathname.split('/').slice(0, 2).join('/')}>
                <Outlet />
              </PageTransition>
            </Suspense>
          </AppErrorBoundary>
        ) : null}
      </main>

      {/* Error overlay — renders on top of everything when active */}
      {shouldShowErrorOverlay && (
        <ErrorOverlay
          type={errorOverlayType!}
          message={errorOverlayMessage ?? undefined}
          onClose={() => useInitStore.getState().setErrorOverlayType(null)}
        />
      )}

      {/* Waiting overlay — portrait orientation or dev forced */}
      {shouldShowWaiting && (
        <WaitingOverlay
          title={t('waiting.rotateTitle')}
          message={t('waiting.rotateMessage')}
          onClose={
            forceWaitingUI
              ? () => useInitStore.getState().setForceWaitingUI(false)
              : undefined
          }
        />
      )}

      {/* Only show extras when app is ready. ScrollToTop is also
          hidden while any overlay is mounted — it uses `z-40`, which
          is above the overlays' `z-30` wrapper, so without this guard
          it would paint on top of the Init/Error/Waiting UI (visible
          as a blurry round button over the V2-import overlay). */}
      {isReady && (
        <>
          {pathname !== '/' && !anyOverlayActive && <ScrollToTop />}
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
  const pathname = useRouterState({ select: s => s.location.pathname })

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
          {DEV_TABS.map(tab => {
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

const settingsCheckoutRecordsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/checkout-records',
  component: CheckoutRecords,
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
    settingsCheckoutRecordsRoute,
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
