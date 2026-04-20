import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useTutorialStore } from '@/stores/tutorial-store'
import { CHAPTER_ORDER } from '@/lib/tutorial/constants'

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// Mock notify to capture calls
const mockNotifyError = vi.fn()
const mockNotifyInfo = vi.fn()
vi.mock('@/components/ui/sonner', () => ({
  notify: {
    error: (...args: unknown[]) => mockNotifyError(...args),
    success: vi.fn(),
    warn: vi.fn(),
    info: (...args: unknown[]) => mockNotifyInfo(...args),
  },
}))

// Mock useAppStore to control isAdmin
let mockIsAdmin = false
vi.mock('@/stores/app-store', () => ({
  useAppStore: (selector: (s: { isAdmin: boolean }) => unknown) =>
    selector({ isAdmin: mockIsAdmin }),
}))

// Mock CHAPTER_META so we can control tutorialIds per test
const mockTutorialIds: Record<string, readonly string[]> = {}
vi.mock('@/lib/tutorial/chapter-meta', () => ({
  CHAPTER_META: new Proxy(
    {},
    {
      get(_target, prop: string) {
        const REAL_META: Record<
          string,
          {
            id: string
            titleKey: string
            descriptionKey: string
            adminOnly: boolean
            tutorialIds: readonly string[]
          }
        > = {
          '00': {
            id: '00',
            titleKey: 'tutorial.chapter.00.title',
            descriptionKey: 'tutorial.chapter.00.description',
            adminOnly: false,
            tutorialIds: mockTutorialIds['00'] ?? [],
          },
          '10': {
            id: '10',
            titleKey: 'tutorial.chapter.10.title',
            descriptionKey: 'tutorial.chapter.10.description',
            adminOnly: false,
            tutorialIds: mockTutorialIds['10'] ?? [],
          },
          '20': {
            id: '20',
            titleKey: 'tutorial.chapter.20.title',
            descriptionKey: 'tutorial.chapter.20.description',
            adminOnly: false,
            tutorialIds: mockTutorialIds['20'] ?? [],
          },
          '30': {
            id: '30',
            titleKey: 'tutorial.chapter.30.title',
            descriptionKey: 'tutorial.chapter.30.description',
            adminOnly: true,
            tutorialIds: mockTutorialIds['30'] ?? [],
          },
          '40': {
            id: '40',
            titleKey: 'tutorial.chapter.40.title',
            descriptionKey: 'tutorial.chapter.40.description',
            adminOnly: true,
            tutorialIds: mockTutorialIds['40'] ?? [],
          },
          '90': {
            id: '90',
            titleKey: 'tutorial.chapter.90.title',
            descriptionKey: 'tutorial.chapter.90.description',
            adminOnly: false,
            tutorialIds: mockTutorialIds['90'] ?? [],
          },
        }
        return REAL_META[prop]
      },
    },
  ),
}))

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('TutorialIndexModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAdmin = false
    // Reset all mockTutorialIds
    for (const key of Object.keys(mockTutorialIds)) {
      delete mockTutorialIds[key]
    }
    useTutorialStore.getState().closeLauncher()
    // Reset any running tutorial to avoid state bleed between tests
    useTutorialStore.getState().abortTutorial()
  })

  afterEach(() => {
    useTutorialStore.getState().closeLauncher()
    cleanup()
  })

  async function importModal() {
    const mod = await import('./tutorial-index-modal')
    return mod.TutorialIndexModal
  }

  it('returns null (renders nothing) when isLauncherOpen is false', async () => {
    const TutorialIndexModal = await importModal()
    const { container } = render(<TutorialIndexModal />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a card for every chapter id in CHAPTER_ORDER (6 cards) when open', async () => {
    useTutorialStore.getState().openLauncher()
    const TutorialIndexModal = await importModal()
    render(<TutorialIndexModal />)

    // Each chapter renders its titleKey; t is passthrough so look for the key text
    for (const id of CHAPTER_ORDER) {
      expect(screen.getByText(`tutorial.chapter.${id}.title`)).toBeTruthy()
    }
  })

  it('close button calls closeLauncher', async () => {
    useTutorialStore.getState().openLauncher()
    const TutorialIndexModal = await importModal()
    render(<TutorialIndexModal />)

    // Close button label is tutorial.index.close (t passthrough)
    const closeBtn = screen.getByRole('button', {
      name: 'tutorial.index.close',
    })
    fireEvent.click(closeBtn)

    expect(useTutorialStore.getState().isLauncherOpen).toBe(false)
  })

  it('shows modal title i18n key', async () => {
    useTutorialStore.getState().openLauncher()
    const TutorialIndexModal = await importModal()
    render(<TutorialIndexModal />)

    // Modal renders the title in both a sr-only h2 (Radix) and a visible div
    const titleElements = screen.getAllByText('tutorial.index.title')
    expect(titleElements.length).toBeGreaterThan(0)
  })

  it('selecting an unlocked chapter with tutorials calls startTutorial and closeLauncher', async () => {
    mockTutorialIds['00'] = ['tut-01', 'tut-02']
    useTutorialStore.getState().openLauncher()
    const TutorialIndexModal = await importModal()
    render(<TutorialIndexModal />)

    // Click the chapter '00' card button (first one)
    const cards = screen.getAllByRole('button')
    // Find the card for chapter 00 by looking for the title text within a button
    const chapterCard = cards.find(b =>
      b.textContent?.includes('tutorial.chapter.00.title'),
    )
    expect(chapterCard).toBeTruthy()
    fireEvent.click(chapterCard!)

    expect(useTutorialStore.getState().activeTutorialId).toBe('tut-01')
    expect(useTutorialStore.getState().isLauncherOpen).toBe(false)
    expect(mockNotifyError).not.toHaveBeenCalled()
  })

  it('selecting an admin-only chapter when not admin calls notify.error and does NOT start tutorial', async () => {
    mockIsAdmin = false
    useTutorialStore.getState().openLauncher()
    const TutorialIndexModal = await importModal()
    render(<TutorialIndexModal />)

    // Chapter '30' is adminOnly
    const cards = screen.getAllByRole('button')
    const chapterCard = cards.find(b =>
      b.textContent?.includes('tutorial.chapter.30.title'),
    )
    expect(chapterCard).toBeTruthy()
    fireEvent.click(chapterCard!)

    expect(mockNotifyError).toHaveBeenCalledWith('tutorial.index.adminRequired')
    expect(useTutorialStore.getState().activeTutorialId).toBeNull()
  })

  it('selecting an empty chapter calls notify.info', async () => {
    // Chapter '00' has no tutorials (empty by default in mock)
    useTutorialStore.getState().openLauncher()
    const TutorialIndexModal = await importModal()
    render(<TutorialIndexModal />)

    const cards = screen.getAllByRole('button')
    const chapterCard = cards.find(b =>
      b.textContent?.includes('tutorial.chapter.00.title'),
    )
    expect(chapterCard).toBeTruthy()
    fireEvent.click(chapterCard!)

    expect(mockNotifyInfo).toHaveBeenCalledWith('tutorial.index.noTutorialsYet')
    expect(useTutorialStore.getState().activeTutorialId).toBeNull()
  })

  it('admin can click admin-only chapter with tutorials and starts it', async () => {
    mockIsAdmin = true
    mockTutorialIds['30'] = ['admin-tut-01']
    useTutorialStore.getState().openLauncher()
    const TutorialIndexModal = await importModal()
    render(<TutorialIndexModal />)

    const cards = screen.getAllByRole('button')
    const chapterCard = cards.find(b =>
      b.textContent?.includes('tutorial.chapter.30.title'),
    )
    expect(chapterCard).toBeTruthy()
    fireEvent.click(chapterCard!)

    expect(useTutorialStore.getState().activeTutorialId).toBe('admin-tut-01')
    expect(mockNotifyError).not.toHaveBeenCalled()
  })

  it('updates lock state reactively when isAdmin flips while modal is open', async () => {
    // User opens the modal as a non-admin → chapter 30 card is locked
    mockIsAdmin = false
    mockTutorialIds['30'] = ['admin-tut-01']
    useTutorialStore.getState().openLauncher()
    const TutorialIndexModal = await importModal()
    const { rerender } = render(<TutorialIndexModal />)

    let cards = screen.getAllByRole('button')
    let lockedCard = cards.find(b =>
      b.textContent?.includes('tutorial.chapter.30.title'),
    )
    expect(lockedCard?.getAttribute('aria-disabled')).toBe('true')

    // User logs in mid-session → admin gate should drop without remount.
    mockIsAdmin = true
    rerender(<TutorialIndexModal />)

    cards = screen.getAllByRole('button')
    const unlockedCard = cards.find(b =>
      b.textContent?.includes('tutorial.chapter.30.title'),
    )
    expect(unlockedCard?.getAttribute('aria-disabled')).toBeNull()
  })
})
