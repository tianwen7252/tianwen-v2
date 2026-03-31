import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router'
import i18n from '@/lib/i18n'
import { SettingsPage } from './settings-page'

// Mock child components
vi.mock('@/components/settings/system-info', () => ({
  SystemInfo: () => <div data-testid="system-info-component">SystemInfo</div>,
}))
vi.mock('@/components/records', () => ({
  Records: () => <div data-testid="records-component">Records</div>,
}))
vi.mock('@/components/staff-admin', () => ({
  StaffAdmin: () => <div data-testid="staff-admin-component">StaffAdmin</div>,
}))
vi.mock('@/components/settings/cloud-backup', () => ({
  CloudBackup: () => (
    <div data-testid="cloud-backup-component">CloudBackup</div>
  ),
}))
vi.mock('@/components/auth-guard', () => ({
  AuthGuard: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-guard">{children}</div>
  ),
}))

function renderWithRouter(initialPath = '/settings/system-info') {
  const rootRoute = createRootRoute({ component: Outlet })

  const settingsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/settings',
    component: SettingsPage,
  })

  const MockSystemInfo = () => (
    <div data-testid="system-info-component">SystemInfo</div>
  )
  const MockCloudBackup = () => (
    <div data-testid="cloud-backup-component">CloudBackup</div>
  )
  const MockRecords = () => <div data-testid="records-component">Records</div>
  const MockStaffAdmin = () => (
    <div data-testid="staff-admin-component">StaffAdmin</div>
  )

  const routeTree = rootRoute.addChildren([
    settingsRoute.addChildren([
      createRoute({
        getParentRoute: () => settingsRoute,
        path: '/system-info',
        component: MockSystemInfo,
      }),
      createRoute({
        getParentRoute: () => settingsRoute,
        path: '/cloud-backup',
        component: MockCloudBackup,
      }),
      createRoute({
        getParentRoute: () => settingsRoute,
        path: '/records',
        component: MockRecords,
      }),
      createRoute({
        getParentRoute: () => settingsRoute,
        path: '/staff-admin',
        component: MockStaffAdmin,
      }),
    ]),
  ])

  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })

  return render(<RouterProvider router={router} />)
}

describe('SettingsPage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('zh-TW')
  })

  describe('tab rendering', () => {
    it('should render tab labels in zh-TW', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByText('系統資訊')).toBeTruthy()
        expect(screen.getByText('雲端備份')).toBeTruthy()
        expect(screen.getByText('打卡記錄')).toBeTruthy()
        expect(screen.getByText('員工管理')).toBeTruthy()
      })
    })

    it('should render tabs in correct order: system, records, staff, products, backup', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByText('系統資訊')).toBeTruthy()
      })
      const links = screen.getAllByRole('link')
      const tabLabels = links.map(l => l.textContent)
      expect(tabLabels).toEqual([
        '系統資訊',
        '打卡記錄',
        '員工管理',
        '商品管理',
        '雲端備份',
      ])
    })
  })

  describe('nested routes', () => {
    it('should show SystemInfo at /settings/system-info', async () => {
      renderWithRouter('/settings/system-info')
      await waitFor(() => {
        expect(screen.getByTestId('system-info-component')).toBeTruthy()
      })
    })

    it('should show CloudBackup at /settings/cloud-backup', async () => {
      renderWithRouter('/settings/cloud-backup')
      await waitFor(() => {
        expect(screen.getByTestId('cloud-backup-component')).toBeTruthy()
      })
    })

    it('should show Records at /settings/records', async () => {
      renderWithRouter('/settings/records')
      await waitFor(() => {
        expect(screen.getByTestId('records-component')).toBeTruthy()
      })
    })

    it('should show StaffAdmin at /settings/staff-admin', async () => {
      renderWithRouter('/settings/staff-admin')
      await waitFor(() => {
        expect(screen.getByTestId('staff-admin-component')).toBeTruthy()
      })
    })

    it('should switch to cloud-backup when clicking the tab', async () => {
      const user = userEvent.setup()
      renderWithRouter('/settings/system-info')

      await waitFor(() => {
        expect(screen.getByText('雲端備份')).toBeTruthy()
      })
      await user.click(screen.getByText('雲端備份'))
      await waitFor(() => {
        expect(screen.getByTestId('cloud-backup-component')).toBeTruthy()
      })
    })
  })
})
