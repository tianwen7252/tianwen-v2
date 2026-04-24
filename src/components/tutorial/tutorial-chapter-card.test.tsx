import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ChapterMeta } from '@/lib/tutorial/chapter-meta'
import { useTutorialStore } from '@/stores/tutorial-store'

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeChapter(overrides: Partial<ChapterMeta> = {}): ChapterMeta {
  return {
    id: '00',
    titleKey: 'tutorial.chapter.00.title',
    descriptionKey: 'tutorial.chapter.00.description',
    adminOnly: false,
    tutorialIds: [],
    ...overrides,
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('TutorialChapterCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useTutorialStore.getState().closeLauncher()
  })

  afterEach(() => {
    cleanup()
  })

  async function importCard() {
    const mod = await import('./tutorial-chapter-card')
    return mod.TutorialChapterCard
  }

  it('renders chapter title and description i18n keys', async () => {
    const TutorialChapterCard = await importCard()
    const chapter = makeChapter()
    const onSelect = vi.fn()

    render(
      <TutorialChapterCard
        chapter={chapter}
        isAdmin={false}
        onSelect={onSelect}
      />,
    )

    expect(screen.getByText('tutorial.chapter.00.title')).toBeTruthy()
    expect(screen.getByText('tutorial.chapter.00.description')).toBeTruthy()
  })

  it('shows empty-state message when tutorialIds is empty', async () => {
    const TutorialChapterCard = await importCard()
    const chapter = makeChapter({ tutorialIds: [] })
    const onSelect = vi.fn()

    render(
      <TutorialChapterCard
        chapter={chapter}
        isAdmin={false}
        onSelect={onSelect}
      />,
    )

    // Should show the "no tutorials yet" i18n key
    expect(screen.getByText('tutorial.index.noTutorialsYet')).toBeTruthy()
  })

  it('shows lock icon when chapter is adminOnly and user is not admin', async () => {
    const TutorialChapterCard = await importCard()
    const chapter = makeChapter({ id: '30', adminOnly: true })
    const onSelect = vi.fn()

    render(
      <TutorialChapterCard
        chapter={chapter}
        isAdmin={false}
        onSelect={onSelect}
      />,
    )

    // The lock hint text should be visible
    expect(screen.getByText('tutorial.index.adminLockedHint')).toBeTruthy()
  })

  it('does NOT show lock icon when chapter is adminOnly and user IS admin', async () => {
    const TutorialChapterCard = await importCard()
    const chapter = makeChapter({ id: '30', adminOnly: true })
    const onSelect = vi.fn()

    render(
      <TutorialChapterCard
        chapter={chapter}
        isAdmin={true}
        onSelect={onSelect}
      />,
    )

    expect(screen.queryByText('tutorial.index.adminLockedHint')).toBeNull()
  })

  it('does NOT show lock icon when chapter is not adminOnly', async () => {
    const TutorialChapterCard = await importCard()
    const chapter = makeChapter({ adminOnly: false })
    const onSelect = vi.fn()

    render(
      <TutorialChapterCard
        chapter={chapter}
        isAdmin={false}
        onSelect={onSelect}
      />,
    )

    expect(screen.queryByText('tutorial.index.adminLockedHint')).toBeNull()
  })

  it('calls onSelect with the chapter when clicked and not locked', async () => {
    const TutorialChapterCard = await importCard()
    const chapter = makeChapter({ adminOnly: false })
    const onSelect = vi.fn()

    render(
      <TutorialChapterCard
        chapter={chapter}
        isAdmin={false}
        onSelect={onSelect}
      />,
    )

    // Click the card button
    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith(chapter)
  })

  it('still calls onSelect when locked so the parent can handle the error notification', async () => {
    // The card always fires onSelect; the caller (modal) decides what to show.
    // The lock is a visual/UX signal — cursor-not-allowed — not a hard block.
    const TutorialChapterCard = await importCard()
    const chapter = makeChapter({ id: '30', adminOnly: true })
    const onSelect = vi.fn()

    render(
      <TutorialChapterCard
        chapter={chapter}
        isAdmin={false}
        onSelect={onSelect}
      />,
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith(chapter)
  })

  it('marks the button aria-disabled when locked (admin-only + not admin)', async () => {
    const TutorialChapterCard = await importCard()
    const chapter = makeChapter({ id: '30', adminOnly: true })

    render(
      <TutorialChapterCard
        chapter={chapter}
        isAdmin={false}
        onSelect={vi.fn()}
      />,
    )

    const button = screen.getByRole('button')
    expect(button.getAttribute('aria-disabled')).toBe('true')
  })

  it('does NOT set aria-disabled when admin can access the chapter', async () => {
    const TutorialChapterCard = await importCard()
    const chapter = makeChapter({ id: '30', adminOnly: true })

    render(
      <TutorialChapterCard
        chapter={chapter}
        isAdmin={true}
        onSelect={vi.fn()}
      />,
    )

    const button = screen.getByRole('button')
    expect(button.getAttribute('aria-disabled')).toBeNull()
  })

  it('does NOT set aria-disabled for non-admin chapters', async () => {
    const TutorialChapterCard = await importCard()
    const chapter = makeChapter({ adminOnly: false })

    render(
      <TutorialChapterCard
        chapter={chapter}
        isAdmin={false}
        onSelect={vi.fn()}
      />,
    )

    const button = screen.getByRole('button')
    expect(button.getAttribute('aria-disabled')).toBeNull()
  })

  it('shows tutorial count when tutorialIds are present', async () => {
    const TutorialChapterCard = await importCard()
    const chapter = makeChapter({
      tutorialIds: ['tut-01', 'tut-02', 'tut-03'],
    })
    const onSelect = vi.fn()

    // Seed progress so useTutorialStatus returns 'not-started' for these
    render(
      <TutorialChapterCard
        chapter={chapter}
        isAdmin={false}
        onSelect={onSelect}
      />,
    )

    // Should show count via i18n key with interpolation — t is passthrough so
    // the raw key with {{count}} renders; check for the key prefix
    const container = screen.getByRole('button')
    expect(container.textContent).toContain('tutorial.index.tutorialCount')
  })
})
