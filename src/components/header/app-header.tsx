/**
 * AppHeader — sticky navigation header with glassmorphism effect on scroll.
 * Extracted from route-tree.tsx RootLayout for maintainability.
 */

import { useState, useEffect } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Settings, Code } from 'lucide-react'
import { HeaderUserMenu } from '@/components/header/header-user-menu'
import { RippleButton } from '@/components/ui/ripple-button'
import { cn } from '@/lib/cn'

// ─── Constants ───────────────────────────────────────────────────────────────

const GLASSMORPHISM_STYLE = {
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  boxShadow:
    'rgb(0, 0, 0) 0px 0px, rgba(0, 0, 0, 0) 0px 0px, rgb(0, 0, 0) 0px 0px, rgba(0, 0, 0, 0) 0px 0px, rgba(0, 0, 0, 0.3) 0px 16px 32px -16px, rgba(0, 0, 0, 0.1) 0px 0px 0px 1px',
} as const

// ─── Types ───────────────────────────────────────────────────────────────────

interface AppHeaderProps {
  /** Whether the header interactions are disabled (during init) */
  readonly disabled?: boolean
  /** Whether the init overlay is showing (transparent header + white text) */
  readonly overlayActive?: boolean
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function NavLink({
  to,
  children,
  overlayActive,
}: {
  to: string
  children: React.ReactNode
  overlayActive?: boolean
}) {
  return (
    <Link
      to={to}
      className={cn(
        'rounded-md px-3 py-1.5 text-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
        overlayActive
          ? '[&.active]:bg-white/10'
          : '[&.active]:bg-primary [&.active]:text-primary-foreground',
      )}
    >
      {children}
    </Link>
  )
}

function NavIconLink({
  to,
  ariaLabel,
  children,
  overlayActive,
}: {
  to: string
  ariaLabel: string
  children: React.ReactNode
  overlayActive?: boolean
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isActive = pathname === to || pathname.startsWith(`${to}/`)

  return (
    <Link to={to}>
      <RippleButton
        aria-label={ariaLabel}
        rippleColor="rgba(0,0,0,0.1)"
        className={cn(
          'flex size-9 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
          isActive
            ? overlayActive
              ? 'bg-white/10'
              : 'bg-primary text-primary-foreground'
            : 'text-muted-foreground',
        )}
      >
        {children}
      </RippleButton>
    </Link>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AppHeader({ disabled, overlayActive }: AppHeaderProps) {
  const { t } = useTranslation()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  // Detect scroll for glassmorphism effect
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Reset scroll position and header shadow on route change.
  // Without this, navigating from a scrolled page to one with overflow:hidden
  // (e.g., order page) leaves window.scrollY > 0 and the shadow stays.
  useEffect(() => {
    window.scrollTo(0, 0)
    setScrolled(false)
  }, [pathname])

  return (
    <div className={disabled ? 'pointer-events-none' : undefined}>
      <header
        className={cn(
          'sticky top-0 z-50 px-5 py-2 transition-all duration-300',
          overlayActive
            ? ''
            : scrolled
              ? 'border-b border-transparent'
              : 'shadow-[0_1px_0_0_rgba(0,0,0,0.08)]',
        )}
        style={{
          backgroundColor: overlayActive
            ? 'transparent'
            : scrolled
              ? 'color-mix(in srgb, var(--header-bg) 70%, transparent)'
              : 'var(--header-bg)',
          ...(scrolled && !overlayActive ? GLASSMORPHISM_STYLE : {}),
        }}
      >
        <nav
          className={cn(
            'flex items-center gap-4',
            overlayActive && '[&_*]:text-white/80',
          )}
        >
          {/* Left: app title + nav links */}
          <a
            href="/"
            className="text-lg text-primary"
            onClick={(e) => {
              e.preventDefault()
              window.location.href = '/'
            }}
          >
            {t('nav.appTitle')}
          </a>
          <div className="flex gap-2">
            <NavLink to="/" overlayActive={overlayActive}>
              {t('nav.home')}
            </NavLink>
            <NavLink to="/orders" overlayActive={overlayActive}>
              {t('nav.orders')}
            </NavLink>
            <NavLink to="/clock-in" overlayActive={overlayActive}>
              {t('nav.clockIn')}
            </NavLink>
            <NavLink to="/analytics" overlayActive={overlayActive}>
              {t('nav.analytics')}
            </NavLink>
          </div>

          {/* Right: dev + settings + login icons */}
          <div className="ml-auto flex items-center gap-2">
            {import.meta.env.DEV && (
              <NavIconLink
                to="/dev"
                ariaLabel="DEV"
                overlayActive={overlayActive}
              >
                <Code size={20} />
              </NavIconLink>
            )}
            <NavIconLink
              to="/settings"
              ariaLabel={t('nav.settings')}
              overlayActive={overlayActive}
            >
              <Settings size={20} />
            </NavIconLink>
            <div className={overlayActive ? 'grayscale' : undefined}>
              <HeaderUserMenu />
            </div>
          </div>
        </nav>
      </header>
    </div>
  )
}
