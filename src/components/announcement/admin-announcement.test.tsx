import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useAppStore } from '@/stores/app-store'

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'zh-TW' },
  }),
}))

vi.mock('./announcement', () => ({
  Announcement: vi.fn(
    ({
      open,
      children,
      title,
    }: {
      open: boolean
      children: React.ReactNode
      title: React.ReactNode
    }) =>
      open ? (
        <div data-testid="announcement">
          {title}
          {children}
        </div>
      ) : null,
  ),
}))

// ─── Store tests ─────────────────────────────────────────────────────────────

describe('app-store: showAdminAnnouncement', () => {
  beforeEach(() => {
    useAppStore.setState({
      showAdminAnnouncement: false,
      isAdmin: false,
      googleUser: null,
    })
  })

  it('setGoogleUser with isAdmin=true sets showAdminAnnouncement to true', () => {
    const { setGoogleUser } = useAppStore.getState()
    setGoogleUser(
      { sub: 'u1', name: 'Admin', email: 'admin@test.com' },
      'token-abc',
      true,
    )
    expect(useAppStore.getState().showAdminAnnouncement).toBe(true)
  })

  it('setGoogleUser with isAdmin=false does not set showAdminAnnouncement to true', () => {
    const { setGoogleUser } = useAppStore.getState()
    setGoogleUser(
      { sub: 'u2', name: 'Staff', email: 'staff@test.com' },
      'token-xyz',
      false,
    )
    expect(useAppStore.getState().showAdminAnnouncement).toBe(false)
  })

  it('setShowAdminAnnouncement(false) resets showAdminAnnouncement flag', () => {
    // Start with true
    useAppStore.setState({ showAdminAnnouncement: true })
    const { setShowAdminAnnouncement } = useAppStore.getState()
    setShowAdminAnnouncement(false)
    expect(useAppStore.getState().showAdminAnnouncement).toBe(false)
  })
})

// ─── Component tests ──────────────────────────────────────────────────────────

// Import after mocks are defined
const { AdminAnnouncement } = await import('./admin-announcement')

describe('AdminAnnouncement component', () => {
  beforeEach(() => {
    useAppStore.setState({
      showAdminAnnouncement: false,
      isAdmin: false,
      googleUser: null,
    })
  })

  it('renders nothing when showAdminAnnouncement is false', () => {
    useAppStore.setState({ showAdminAnnouncement: false })
    render(<AdminAnnouncement />)
    expect(screen.queryByTestId('announcement')).toBeNull()
  })

  it('renders Announcement when showAdminAnnouncement is true', () => {
    useAppStore.setState({ showAdminAnnouncement: true })
    render(<AdminAnnouncement />)
    expect(screen.getByTestId('announcement')).toBeDefined()
  })

  it('passes correct i18n keys to the Announcement component', () => {
    useAppStore.setState({ showAdminAnnouncement: true })
    render(<AdminAnnouncement />)
    const el = screen.getByTestId('announcement')
    // t() returns the key directly (mocked), so both keys must appear
    expect(el.textContent).toContain('announcement.adminName')
    expect(el.textContent).toContain('announcement.loggedIn')
  })
})
