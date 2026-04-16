import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Outlet,
  Link,
  useRouterState,
  useNavigate,
} from '@tanstack/react-router'
import { cn } from '@/lib/cn'
import { AuthGuard } from '@/components/auth-guard'

interface Tab {
  readonly path: string
  readonly labelKey: string
  readonly guard?: 'backup' | 'staffAdmin' | 'productAdmin'
}

const TABS: readonly Tab[] = [
  { path: '/settings/system-info', labelKey: 'settings.systemInfo' },
  { path: '/settings/records', labelKey: 'nav.records' },
  {
    path: '/settings/staff-admin',
    labelKey: 'nav.staffAdmin',
    guard: 'staffAdmin',
  },
  {
    path: '/settings/product-management',
    labelKey: 'productMgmt.tabTitle',
    guard: 'productAdmin',
  },
  {
    path: '/settings/checkout-records',
    labelKey: 'shiftCheckout.recordsTab',
  },
  {
    path: '/settings/cloud-backup',
    labelKey: 'backup.tabTitle',
    guard: 'backup',
  },
]

export function SettingsPage() {
  const { t } = useTranslation()
  const pathname = useRouterState({ select: s => s.location.pathname })
  const navigate = useNavigate()

  // Redirect /settings to /settings/system-info
  useEffect(() => {
    if (pathname === '/settings' || pathname === '/settings/') {
      navigate({ to: '/settings/system-info' as string, replace: true })
    }
  }, [pathname, navigate])

  // Determine which tab needs AuthGuard wrapping
  const activeTab = TABS.find(
    tab => pathname === tab.path || pathname.startsWith(`${tab.path}/`),
  )

  return (
    <div>
      {/* Tab navigation */}
      <div className="border-b border-border bg-card px-6">
        <div className="flex gap-1">
          {TABS.map(tab => {
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
                {t(tab.labelKey)}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Tab content via nested routes */}
      <div>
        {activeTab?.guard ? (
          <AuthGuard variant={activeTab.guard}>
            <Outlet />
          </AuthGuard>
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  )
}
