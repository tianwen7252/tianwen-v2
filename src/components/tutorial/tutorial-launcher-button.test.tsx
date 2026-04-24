import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useTutorialStore } from '@/stores/tutorial-store'

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('TutorialLauncherButton', () => {
  beforeEach(() => {
    // Ensure launcher is closed before each test
    useTutorialStore.getState().closeLauncher()
  })

  afterEach(() => {
    useTutorialStore.getState().closeLauncher()
    cleanup()
  })

  async function importButton() {
    const mod = await import('./tutorial-launcher-button')
    return mod.TutorialLauncherButton
  }

  it('renders a button with the correct aria-label i18n key', async () => {
    const TutorialLauncherButton = await importButton()
    render(<TutorialLauncherButton />)

    const button = screen.getByRole('button', {
      name: 'tutorial.launcher.openIndex',
    })
    expect(button).toBeTruthy()
  })

  it('calls openLauncher on click', async () => {
    const TutorialLauncherButton = await importButton()
    render(<TutorialLauncherButton />)

    const button = screen.getByRole('button', {
      name: 'tutorial.launcher.openIndex',
    })
    fireEvent.click(button)

    expect(useTutorialStore.getState().isLauncherOpen).toBe(true)
  })

  it('applies active style classes when isLauncherOpen is true', async () => {
    useTutorialStore.getState().openLauncher()
    const TutorialLauncherButton = await importButton()
    render(<TutorialLauncherButton />)

    const button = screen.getByRole('button', {
      name: 'tutorial.launcher.openIndex',
    })
    expect(button.className).toContain('bg-primary')
    expect(button.className).toContain('text-primary-foreground')
  })

  it('applies muted style when isLauncherOpen is false', async () => {
    const TutorialLauncherButton = await importButton()
    render(<TutorialLauncherButton />)

    const button = screen.getByRole('button', {
      name: 'tutorial.launcher.openIndex',
    })
    expect(button.className).toContain('text-muted-foreground')
  })

  it('applies overlayActive style (bg-white/10) when overlayActive and launcher is open', async () => {
    useTutorialStore.getState().openLauncher()
    const TutorialLauncherButton = await importButton()
    render(<TutorialLauncherButton overlayActive />)

    const button = screen.getByRole('button', {
      name: 'tutorial.launcher.openIndex',
    })
    expect(button.className).toContain('bg-white/10')
  })

  it('does not apply bg-primary when overlayActive regardless of open state', async () => {
    useTutorialStore.getState().openLauncher()
    const TutorialLauncherButton = await importButton()
    render(<TutorialLauncherButton overlayActive />)

    const button = screen.getByRole('button', {
      name: 'tutorial.launcher.openIndex',
    })
    expect(button.className).not.toContain('bg-primary')
  })
})
