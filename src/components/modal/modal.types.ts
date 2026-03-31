export type GradientVariant =
  | 'green'
  | 'warm'
  | 'red'
  | 'blue'
  | 'orange'
  | 'gray'

/** Preset shine color names or custom ShineBorder color format */
export type ShineColorPreset =
  | 'green'
  | 'purple'
  | 'red'
  | 'blue'
  | 'orange'
  | 'gray'
export type ShineColor = boolean | ShineColorPreset | string | string[]

/**
 * Modal — base glassmorphism modal with gradient background.
 * Supports any content: confirmation, forms, info display, etc.
 */
export interface ModalProps {
  /** Whether the modal is open */
  readonly open: boolean
  /** Gradient background variant */
  readonly variant?: GradientVariant
  /** Header content shown above the title — plain text or JSX */
  readonly header?: React.ReactNode
  /** Modal title — plain text or JSX. When omitted, no visual subtitle is shown (but header is used as the sr-only accessible title). */
  readonly title?: React.ReactNode
  /** Modal content — renders inside the glassmorphism container */
  readonly children: React.ReactNode
  /** Footer content — renders below children (buttons, etc.) */
  readonly footer?: React.ReactNode
  /** Animated shine border color. true = use variant color, false = none. Default: false. */
  readonly shineColor?: ShineColor
  /** Container width in px or CSS string (default: 500) */
  readonly width?: number | string
  /** Container height in px or CSS string. When set, content fills the space and footer pins to bottom. */
  readonly height?: number | string
  /** Enable smooth CSS transition when width/height change (default: false) */
  readonly transition?: boolean
  /** Animate the overlay gradient, cycling through all color variants */
  readonly animated?: boolean
  /** Show loading spinner overlay */
  readonly loading?: boolean
  /** Whether clicking the backdrop closes the modal (default: true) */
  readonly closeOnBackdropClick?: boolean
  /** Hide the built-in close (X) button (default: false) */
  readonly hideCloseButton?: boolean
  /** Called when modal is dismissed (backdrop click, escape key) */
  readonly onClose: () => void
}

/**
 * ModalCard — inner card within Modal for grouping content.
 * Pre-styled with frosted glass effect.
 */
export interface ModalCardProps {
  readonly children: React.ReactNode
  readonly className?: string
}

/**
 * ConfirmModal — specialized Modal for confirmation actions.
 * Content is passed as children (avatar, info, etc.).
 */
export interface ConfirmModalProps {
  readonly open: boolean
  readonly title: React.ReactNode
  readonly variant?: GradientVariant
  readonly header?: React.ReactNode
  readonly children?: React.ReactNode
  readonly confirmText?: string
  readonly cancelText?: string
  readonly animated?: boolean
  readonly loading?: boolean
  readonly shineColor?: ShineColor
  readonly onConfirm: () => void
  readonly onCancel: () => void
}
