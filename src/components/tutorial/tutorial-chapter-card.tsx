import { type ReactElement } from 'react'
import { Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { RippleButton } from '@/components/ui/ripple-button'
import { useTutorialStatus } from '@/hooks/use-tutorial'
import type { ChapterMeta } from '@/lib/tutorial/chapter-meta'
import { cn } from '@/lib/cn'

// ─── Types ───────────────────────────────────────────────────────────────────

interface TutorialChapterCardProps {
  readonly chapter: ChapterMeta
  /** True when the user has admin rights — controls lock badge for admin chapters. */
  readonly isAdmin: boolean
  /** Click handler — caller decides what to do (open the chapter / show "需要登入"). */
  readonly onSelect: (chapter: ChapterMeta) => void
}

// ─── Sub-component ───────────────────────────────────────────────────────────

/** Displays a single tutorial id row with its completion status. */
function TutorialRow({ tutorialId }: { readonly tutorialId: string }) {
  const { t } = useTranslation()
  const status = useTutorialStatus(tutorialId)
  const isCompleted = status === 'completed'

  return (
    <div className="flex items-center justify-between gap-2 py-0.5 text-base text-muted-foreground">
      <span className="truncate">
        {t(`tutorial.${tutorialId}.title`, tutorialId)}
      </span>
      {isCompleted && (
        <span className="shrink-0 text-base text-primary">
          {t('tutorial.index.completed')}
        </span>
      )}
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Card for a single tutorial chapter in the launcher index.
 * When locked (adminOnly + !isAdmin), shows a lock icon and disables click.
 */
export function TutorialChapterCard({
  chapter,
  isAdmin,
  onSelect,
}: TutorialChapterCardProps): ReactElement {
  const { t } = useTranslation()

  const isLocked = chapter.adminOnly && !isAdmin
  const hasContent = chapter.tutorialIds.length > 0

  function handleClick() {
    // Always fire onSelect — the caller (e.g. TutorialIndexModal) decides
    // what to do for locked chapters (show notify.error, etc.)
    onSelect(chapter)
  }

  return (
    <RippleButton
      rippleColor="rgba(0,0,0,0.06)"
      onClick={handleClick}
      // aria-disabled (not the native disabled attribute) — the button must
      // still receive focus and fire onClick so the modal can show the
      // "需要登入" notification, but assistive tech should announce the
      // locked state before activation.
      aria-disabled={isLocked || undefined}
      className={cn(
        'w-full rounded-xl p-4 text-left transition-colors',
        'border border-border/60 bg-white/60 hover:bg-white/80',
        isLocked && 'cursor-not-allowed opacity-60',
      )}
    >
      {/* Title row */}
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-base text-foreground">{t(chapter.titleKey)}</span>
        {isLocked && (
          <Lock size={16} className="shrink-0 text-muted-foreground" />
        )}
      </div>

      {/* Description */}
      <p className="mb-2 text-base text-muted-foreground">
        {t(chapter.descriptionKey)}
      </p>

      {/* Lock hint or tutorial list */}
      {isLocked ? (
        <span className="text-base text-muted-foreground">
          {t('tutorial.index.adminLockedHint')}
        </span>
      ) : hasContent ? (
        <div>
          <div className="mb-1 text-base text-muted-foreground">
            {t('tutorial.index.tutorialCount', {
              count: chapter.tutorialIds.length,
            })}
          </div>
          <div className="space-y-0.5">
            {chapter.tutorialIds.map(id => (
              <TutorialRow key={id} tutorialId={id} />
            ))}
          </div>
        </div>
      ) : (
        <span className="text-base text-muted-foreground">
          {t('tutorial.index.noTutorialsYet')}
        </span>
      )}
    </RippleButton>
  )
}
