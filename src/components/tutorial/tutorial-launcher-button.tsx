import { type ReactElement } from 'react'
import { MessageCircleQuestionMark } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { RippleButton } from '@/components/ui/ripple-button'
import { useTutorialStore } from '@/stores/tutorial-store'
import { tutorialAnchor } from '@/lib/tutorial/tutorial-anchor'
import { cn } from '@/lib/cn'

// ─── Types ───────────────────────────────────────────────────────────────────

interface TutorialLauncherButtonProps {
  /** Mirror NavIconLink's overlay-active styling for header consistency. */
  readonly overlayActive?: boolean
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Header button that opens the Tutorial Index Modal.
 * Not a router link — opens a modal via the tutorial store.
 * Mirrors NavIconLink's visual pattern but triggers launcher state.
 */
export function TutorialLauncherButton({
  overlayActive,
}: TutorialLauncherButtonProps): ReactElement {
  const { t } = useTranslation()
  const isLauncherOpen = useTutorialStore(s => s.isLauncherOpen)

  function handleClick() {
    useTutorialStore.getState().openLauncher()
  }

  return (
    <RippleButton
      aria-label={t('tutorial.launcher.openIndex')}
      rippleColor="rgba(0,0,0,0.1)"
      onClick={handleClick}
      className={cn(
        'flex size-9 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
        isLauncherOpen
          ? overlayActive
            ? 'bg-white/10'
            : 'bg-primary text-primary-foreground'
          : 'text-muted-foreground',
      )}
      {...tutorialAnchor('header.tutorialLauncher')}
    >
      <MessageCircleQuestionMark size={20} />
    </RippleButton>
  )
}
