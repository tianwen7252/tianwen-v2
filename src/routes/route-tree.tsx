import { useState, useEffect } from 'react'
import {
  createRootRoute,
  createRoute,
  Outlet,
  Link,
  useRouterState,
} from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Settings, Code } from 'lucide-react'
import { OrderPage } from '@/pages/order'
import { NotFoundPage } from '@/pages/not-found'
import { ModalPreview, NotifyPreview, SwPreview, TestDataPreview } from '@/pages/preview'
import { ClockInPage } from '@/pages/clock-in'
import { SettingsPage } from '@/pages/settings'
import { SystemInfo } from '@/components/settings/system-info'
import { CloudBackup } from '@/components/settings/cloud-backup'
import { Records } from '@/components/records'
import { StaffAdmin } from '@/components/staff-admin'
import { ProductManagement } from '@/components/settings/product-management'
import { OrdersPage } from '@/pages/orders'
import { AnalyticsPage } from '@/pages/analytics'
import { SwUpdatePrompt } from '@/components/sw-update-prompt'
import { PageTransition } from '@/components/animations'
import { AppErrorBoundary } from '@/components/app-error-boundary'
import { ScrollToTop } from '@/components/ui/scroll-to-top'
import { HeaderUserMenu } from '@/components/header/header-user-menu'
import { RippleButton } from '@/components/ui/ripple-button'
import { cn } from '@/lib/cn'

// ─── Constants ───────────────────────────────────────────────────────────────

const HEADER_BG = '#F8F4EC'

const GLASSMORPHISM_STYLE = {
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  boxShadow:
    'rgb(0, 0, 0) 0px 0px, rgba(0, 0, 0, 0) 0px 0px, rgb(0, 0, 0) 0px 0px, rgba(0, 0, 0, 0) 0px 0px, rgba(0, 0, 0, 0.3) 0px 16px 32px -16px, rgba(0, 0, 0, 0.1) 0px 0px 0px 1px',
} as const

// Root layout with navigation
const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

function RootLayout() {
  const { t } = useTranslation()
  // Use pathname as key to trigger re-mount animation on route changes
  const pathname = useRouterState({ select: s => s.location.pathname })

  // Detect scroll for glassmorphism header
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation header — sticky with glassmorphism on scroll */}
      <header
        className={cn(
          'sticky top-0 z-30 px-5 py-2 transition-all duration-300',
          scrolled
            ? 'border-b border-transparent'
            : 'shadow-[0_1px_0_0_rgba(0,0,0,0.08)]', // to replace "border-b border-border" for ipad
        )}
        style={{
          backgroundColor: scrolled ? `${HEADER_BG}b3` : HEADER_BG,
          ...(scrolled ? GLASSMORPHISM_STYLE : {}),
        }}
      >
        <nav className="flex items-center gap-4">
          {/* Left: app title + nav links */}
          <a
            href="/"
            className="text-lg text-primary"
            onClick={e => {
              e.preventDefault()
              window.location.href = '/'
            }}
          >
            {t('nav.appTitle')}
          </a>
          <div className="flex gap-2">
            <NavLink to="/">{t('nav.home')}</NavLink>
            <NavLink to="/orders">{t('nav.orders')}</NavLink>
            <NavLink to="/clock-in">{t('nav.clockIn')}</NavLink>
            <NavLink to="/analytics">{t('nav.analytics')}</NavLink>
          </div>

          {/* Right: dev + settings + login icons */}
          <div className="ml-auto flex items-center gap-2">
            {import.meta.env.DEV && (
              <NavIconLink to="/dev" ariaLabel="DEV">
                <Code size={20} />
              </NavIconLink>
            )}
            <NavIconLink to="/settings" ariaLabel={t('nav.settings')}>
              <Settings size={20} />
            </NavIconLink>
            <HeaderUserMenu />
          </div>
        </nav>
      </header>

      {/* Page content with global error boundary */}
      <main>
        <AppErrorBoundary title={t('error.appError')}>
          <PageTransition key={pathname}>
            <Outlet />
          </PageTransition>
        </AppErrorBoundary>
      </main>

      {/* Scroll to top — hidden on order page */}
      {pathname !== '/' && <ScrollToTop />}

      {/* SW update prompt */}
      <SwUpdatePrompt />

      {/* Dev tools — only in development */}
      {/* <TanStackRouterDevtools position="bottom-right" /> */}
    </div>
  )
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-md px-3 py-1.5 text-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:bg-primary [&.active]:text-primary-foreground"
    >
      {children}
    </Link>
  )
}

function NavIconLink({
  to,
  ariaLabel,
  children,
}: {
  to: string
  ariaLabel: string
  children: React.ReactNode
}) {
  const pathname = useRouterState({ select: s => s.location.pathname })
  const isActive = pathname === to || pathname.startsWith(`${to}/`)

  return (
    <Link to={to}>
      <RippleButton
        aria-label={ariaLabel}
        rippleColor="rgba(0,0,0,0.1)"
        className={cn(
          'flex size-9 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground',
        )}
      >
        {children}
      </RippleButton>
    </Link>
  )
}

// Routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: OrderPage,
})

// Dev layout route — for component previews during development
const devRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dev',
  component: DevLayout,
})

function DevLayout() {
  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Dev Tools</h1>
      <Outlet />
    </div>
  )
}

// Dev index — list available dev tools
const devIndexRoute = createRoute({
  getParentRoute: () => devRoute,
  path: '/',
  component: DevIndex,
})

function DevIndex() {
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground">Select a tool:</p>
      <ul className="list-inside list-disc space-y-1">
        <li>
          <Link to="/dev/modal" className="text-primary underline">
            Modal
          </Link>{' '}
          (V2-16)
        </li>
        <li>
          <Link to="/dev/notify" className="text-primary underline">
            Notify
          </Link>{' '}
          (Toast Notifications)
        </li>
        <li>
          <Link to="/dev/sw" className="text-primary underline">
            SW Update
          </Link>{' '}
          (Service Worker prompts)
        </li>
        <li>
          <Link to="/dev/test-data" className="text-primary underline">
            Test Data
          </Link>{' '}
          (Generate 6 months data)
        </li>
      </ul>
    </div>
  )
}

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
  ]),
])
