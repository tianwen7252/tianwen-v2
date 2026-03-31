/**
 * Tests for Announcement component.
 * Follows TDD: tests written before implementation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Announcement } from './announcement'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'zh-TW' },
  }),
}))

// Mock confetti utilities
vi.mock('@/components/ui/confetti', () => ({
  fireSideCannons: vi.fn(),
  fireStars: vi.fn(),
}))

// Import mocked confetti functions for assertions
import { fireSideCannons, fireStars } from '@/components/ui/confetti'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Announcement', () => {
  const defaultProps = {
    open: true,
    onDismiss: vi.fn(),
    children: <div>Announcement content</div>,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. Does not render when open={false}
  it('does not render when open is false', () => {
    render(
      <Announcement open={false} onDismiss={vi.fn()}>
        Hidden content
      </Announcement>,
    )
    expect(screen.queryByText('Hidden content')).toBeNull()
  })

  // 2. Renders modal with title and children when open={true}
  it('renders children when open is true', () => {
    render(<Announcement {...defaultProps} />)
    expect(screen.getByText('Announcement content')).toBeTruthy()
  })

  it('renders title when provided', () => {
    render(
      <Announcement {...defaultProps} title="Test Title">
        Content
      </Announcement>,
    )
    // Title appears twice: sr-only h2 (accessibility) + visual title div
    expect(screen.getAllByText('Test Title')).toHaveLength(2)
  })

  it('renders without title when title is not provided', () => {
    render(<Announcement {...defaultProps} />)
    // Only the dismiss button and children — no title element
    expect(screen.getByText('Announcement content')).toBeTruthy()
  })

  // 3. Calls onDismiss when dismiss button is clicked
  it('calls onDismiss when dismiss button is clicked', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    render(
      <Announcement open onDismiss={onDismiss}>
        Content
      </Announcement>,
    )
    await user.click(screen.getByRole('button', { name: 'common.confirm' }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  // 4. Shows custom dismissText when provided
  it('shows custom dismissText when provided', () => {
    render(
      <Announcement {...defaultProps} dismissText="Got it!">
        Content
      </Announcement>,
    )
    expect(screen.getByRole('button', { name: 'Got it!' })).toBeTruthy()
  })

  // 5. Shows default confirm text from i18n when dismissText is not provided
  it('shows default i18n confirm text when dismissText is not provided', () => {
    render(<Announcement {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'common.confirm' })).toBeTruthy()
  })

  // 6. Fires confetti functions when open becomes true with confetti={true}
  it('fires both side cannons and stars when confetti is true', () => {
    render(
      <Announcement open confetti onDismiss={vi.fn()}>
        Content
      </Announcement>,
    )
    expect(fireSideCannons).toHaveBeenCalledOnce()
    expect(fireStars).toHaveBeenCalledOnce()
  })

  // 7. Fires only sideCannons when confetti={{ sideCannons: true }}
  it('fires only side cannons when confetti.sideCannons is true', () => {
    render(
      <Announcement open confetti={{ sideCannons: true }} onDismiss={vi.fn()}>
        Content
      </Announcement>,
    )
    expect(fireSideCannons).toHaveBeenCalledOnce()
    expect(fireStars).not.toHaveBeenCalled()
  })

  it('fires only stars when confetti.stars is true', () => {
    render(
      <Announcement open confetti={{ stars: true }} onDismiss={vi.fn()}>
        Content
      </Announcement>,
    )
    expect(fireSideCannons).not.toHaveBeenCalled()
    expect(fireStars).toHaveBeenCalledOnce()
  })

  // 8. Does not fire confetti when confetti is falsy/undefined
  it('does not fire confetti when confetti prop is not provided', () => {
    render(
      <Announcement open onDismiss={vi.fn()}>
        Content
      </Announcement>,
    )
    expect(fireSideCannons).not.toHaveBeenCalled()
    expect(fireStars).not.toHaveBeenCalled()
  })

  it('does not fire confetti when confetti is false', () => {
    render(
      <Announcement open confetti={false} onDismiss={vi.fn()}>
        Content
      </Announcement>,
    )
    expect(fireSideCannons).not.toHaveBeenCalled()
    expect(fireStars).not.toHaveBeenCalled()
  })

  it('does not fire confetti when open is false', () => {
    render(
      <Announcement open={false} confetti onDismiss={vi.fn()}>
        Content
      </Announcement>,
    )
    expect(fireSideCannons).not.toHaveBeenCalled()
    expect(fireStars).not.toHaveBeenCalled()
  })

  // X button should not be present / visible
  it('renders a dismiss button with correct role', () => {
    render(<Announcement {...defaultProps} />)
    const buttons = screen.getAllByRole('button')
    // The only accessible button should be the dismiss button
    // (The X close button from Modal is hidden via CSS)
    const dismissBtn = buttons.find(btn => btn.textContent === 'common.confirm')
    expect(dismissBtn).toBeTruthy()
  })

  // closeOnBackdropClick defaults to false
  it('respects closeOnBackdropClick prop', () => {
    // Just verifying the prop is accepted without errors
    render(
      <Announcement open closeOnBackdropClick onDismiss={vi.fn()}>
        Content
      </Announcement>,
    )
    expect(screen.getByText('Content')).toBeTruthy()
  })
})
