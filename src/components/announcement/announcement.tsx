import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/modal/modal'
import { RippleButton } from '@/components/ui/ripple-button'
import { fireSideCannons, fireStars } from '@/components/ui/confetti'
import type { AnnouncementProps } from './announcement.types'

// ─── Announcement ─────────────────────────────────────────────────────────────

/**
 * Full-screen announcement modal with optional confetti effects.
 * Wraps Modal with a centered layout, no X close button, and a single dismiss action.
 * The user must explicitly click the dismiss button to close the announcement.
 */
export function Announcement({
  open,
  variant = 'warm',
  shineColor,
  title,
  children,
  dismissText,
  confetti,
  onDismiss,
  closeOnBackdropClick = false,
}: AnnouncementProps) {
  const { t } = useTranslation()

  // Fire confetti effects when the announcement opens
  useEffect(() => {
    if (!open || !confetti) return

    const fireAll = confetti === true
    const sideCannons =
      fireAll || (typeof confetti === 'object' && confetti.sideCannons === true)
    const stars =
      fireAll || (typeof confetti === 'object' && confetti.stars === true)

    if (sideCannons) fireSideCannons()
    if (stars) fireStars()
  }, [open, confetti])

  const resolvedDismissText = dismissText ?? t('common.confirm')

  return (
    // Wrapper hides the Modal's built-in X close button via CSS
    <div className="announcement-wrapper [&_.absolute.right-2.top-2]:hidden">
      <Modal
        open={open}
        variant={variant}
        shineColor={shineColor}
        title={title}
        closeOnBackdropClick={closeOnBackdropClick}
        onClose={onDismiss}
        footer={
          <RippleButton
            onClick={onDismiss}
            rippleColor="rgba(0,0,0,0.08)"
            className="w-full rounded-lg bg-white px-4 py-3 text-foreground"
          >
            {resolvedDismissText}
          </RippleButton>
        }
      >
        <div className="flex flex-col items-center">{children}</div>
      </Modal>
    </div>
  )
}
