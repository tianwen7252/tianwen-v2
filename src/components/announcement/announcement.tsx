import { useEffect, useRef } from 'react'
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
  transparent = false,
}: AnnouncementProps) {
  const { t } = useTranslation()

  // Track the confetti config via ref to avoid re-firing on object identity changes
  const confettiRef = useRef(confetti)
  confettiRef.current = confetti

  // Fire confetti effects only when the announcement opens
  useEffect(() => {
    if (!open || !confettiRef.current) return

    const cfg = confettiRef.current
    const fireAll = cfg === true
    const sideCannons =
      fireAll || (typeof cfg === 'object' && cfg.sideCannons === true)
    const stars = fireAll || (typeof cfg === 'object' && cfg.stars === true)

    let cancelCannons: (() => void) | undefined
    if (sideCannons) cancelCannons = fireSideCannons()
    if (stars) fireStars()

    return () => cancelCannons?.()
  }, [open])

  const resolvedDismissText = dismissText ?? t('common.confirm')

  return (
    <Modal
      open={open}
      variant={variant}
      shineColor={shineColor}
      title={title}
      hideCloseButton
      transparent={transparent}
      closeOnBackdropClick={closeOnBackdropClick}
      onClose={onDismiss}
      footer={
        <RippleButton
          type="button"
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
  )
}
