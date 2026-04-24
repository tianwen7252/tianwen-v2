import { type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/modal/modal'
import { RippleButton } from '@/components/ui/ripple-button'
import { notify } from '@/components/ui/sonner'
import { CHAPTER_ORDER } from '@/lib/tutorial/constants'
import { CHAPTER_META, type ChapterMeta } from '@/lib/tutorial/chapter-meta'
import { useAppStore } from '@/stores/app-store'
import { useTutorialStore } from '@/stores/tutorial-store'
import { TutorialChapterCard } from './tutorial-chapter-card'

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Thin wrapper that subscribes only to `isLauncherOpen`. The expensive parts
 * (isAdmin, i18n, chapter rendering) live in TutorialIndexModalContent and
 * only mount while the launcher is open. Keeps re-render churn out of the
 * tree on login/logout while closed.
 */
export function TutorialIndexModal(): ReactElement | null {
  const isLauncherOpen = useTutorialStore(s => s.isLauncherOpen)
  if (!isLauncherOpen) return null
  return <TutorialIndexModalContent />
}

function TutorialIndexModalContent(): ReactElement {
  const { t } = useTranslation()
  const isAdmin = useAppStore(s => s.isAdmin)

  function closeLauncher() {
    useTutorialStore.getState().closeLauncher()
  }

  function handleSelectChapter(chapter: ChapterMeta) {
    const isLocked = chapter.adminOnly && !isAdmin

    if (isLocked) {
      notify.error(t('tutorial.index.adminRequired'))
      return
    }

    if (chapter.tutorialIds.length === 0) {
      notify.info(t('tutorial.index.noTutorialsYet'))
      return
    }

    const firstId = chapter.tutorialIds[0]
    if (!firstId) return

    // Start the first tutorial in the chapter and close the launcher
    useTutorialStore.getState().startTutorial(firstId)
    closeLauncher()
  }

  return (
    <Modal
      open
      onClose={closeLauncher}
      title={t('tutorial.index.title')}
      width={600}
      hideCloseButton={false}
      footer={
        <div className="flex justify-center">
          <RippleButton
            aria-label={t('tutorial.index.close')}
            rippleColor="rgba(0,0,0,0.1)"
            onClick={closeLauncher}
            className="rounded-lg bg-primary px-6 py-2 text-base text-primary-foreground transition-colors hover:opacity-90"
          >
            {t('tutorial.index.close')}
          </RippleButton>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {CHAPTER_ORDER.map(chapterId => {
          const chapter = CHAPTER_META[chapterId]
          return (
            <TutorialChapterCard
              key={chapterId}
              chapter={chapter}
              isAdmin={isAdmin}
              onSelect={handleSelectChapter}
            />
          )
        })}
      </div>
    </Modal>
  )
}
