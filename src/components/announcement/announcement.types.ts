import type {
  GradientVariant,
  ShineColor,
} from '@/components/modal/modal.types'

/**
 * Confetti configuration — either enable all effects or choose individual ones.
 */
export interface AnnouncementConfettiConfig {
  readonly sideCannons?: boolean
  readonly stars?: boolean
}

/**
 * Props for the Announcement component.
 * A modal-based announcement overlay with optional confetti and a dismiss action.
 */
export interface AnnouncementProps {
  /** Whether the announcement is visible */
  readonly open: boolean
  /** Gradient backdrop variant */
  readonly variant?: GradientVariant
  /** Animated shine border color */
  readonly shineColor?: ShineColor
  /** Title displayed above children */
  readonly title?: React.ReactNode
  /** Main content */
  readonly children: React.ReactNode
  /** Dismiss button text — default: t('common.confirm') */
  readonly dismissText?: string
  /** Enable confetti effects on open */
  readonly confetti?: boolean | AnnouncementConfettiConfig
  /** Called when dismissed */
  readonly onDismiss: () => void
  /** Whether backdrop click dismisses (default: false) */
  readonly closeOnBackdropClick?: boolean
  /** Make the center panel fully transparent with no shadow (default: false) */
  readonly transparent?: boolean
}
