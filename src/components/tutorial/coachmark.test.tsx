import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useTutorialStore } from '@/stores/tutorial-store'
import { Coachmark } from './coachmark'

// ─── Setup ────────────────────────────────────────────────────────────────────

function resetStore() {
  useTutorialStore.setState({
    coachmarkDismissed: {},
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Coachmark', () => {
  beforeEach(() => {
    resetStore()
    vi.clearAllMocks()
  })

  it('renders the pulse dot button when not dismissed', () => {
    render(<Coachmark id="coachmark.test" ariaLabel="swipe to edit hint" />)
    const btn = screen.getByRole('button', { name: /swipe to edit hint/i })
    expect(btn).toBeTruthy()
  })

  it('applies the tutorial-pulse-dot CSS class', () => {
    const { container } = render(
      <Coachmark id="coachmark.test" ariaLabel="test" />,
    )
    const dot = container.querySelector('.tutorial-pulse-dot')
    expect(dot).toBeTruthy()
  })

  it('is positioned absolutely so the caller only needs relative positioning', () => {
    const { container } = render(
      <Coachmark id="coachmark.test" ariaLabel="test" />,
    )
    // The root element should have an absolute class from Tailwind
    const btn = container.firstChild as HTMLElement
    expect(btn.className).toContain('absolute')
  })

  it('returns null when already dismissed', () => {
    // Pre-dismiss in the store
    useTutorialStore.setState({
      coachmarkDismissed: { 'coachmark.test': true },
    })

    const { container } = render(
      <Coachmark id="coachmark.test" ariaLabel="test" />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('calls dismiss and the optional onClick handler when clicked', () => {
    const onClick = vi.fn()
    render(
      <Coachmark
        id="coachmark.clickTest"
        ariaLabel="click test"
        onClick={onClick}
      />,
    )

    const btn = screen.getByRole('button', { name: /click test/i })
    fireEvent.click(btn)

    expect(onClick).toHaveBeenCalledOnce()
    // After click, the coachmark should be dismissed in the store
    const { coachmarkDismissed } = useTutorialStore.getState()
    expect(coachmarkDismissed['coachmark.clickTest']).toBe(true)
  })

  it('dismisses without crashing when onClick is not provided', () => {
    render(<Coachmark id="coachmark.noHandler" ariaLabel="no handler" />)
    const btn = screen.getByRole('button', { name: /no handler/i })
    expect(() => fireEvent.click(btn)).not.toThrow()

    const { coachmarkDismissed } = useTutorialStore.getState()
    expect(coachmarkDismissed['coachmark.noHandler']).toBe(true)
  })

  it('stays hidden after dismiss across unmount and remount', () => {
    const id = 'coachmark.remount'

    // First render — click to dismiss
    const { unmount } = render(<Coachmark id={id} ariaLabel="remount test" />)
    fireEvent.click(screen.getByRole('button', { name: /remount test/i }))
    unmount()

    // Second render — should be hidden
    const { container } = render(<Coachmark id={id} ariaLabel="remount test" />)
    expect(container.firstChild).toBeNull()
  })
})
