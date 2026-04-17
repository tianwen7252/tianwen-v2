import { useState, useEffect, useMemo } from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { useTranslation } from 'react-i18next'
import { Loader2, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { resolvePx } from '@/lib/resolve-px'
import { ShineBorder } from '@/components/ui/shine-border'
import { RippleButton } from '@/components/ui/ripple-button'
import type {
  ModalProps,
  ModalCardProps,
  ConfirmModalProps,
  GradientVariant,
  ShineColor,
  ShineColorPreset,
} from './modal.types'
import './modal.css'

// V1 exact color tokens
const COLOR_TEXT = '#1a202c'
const COLOR_MUTED = '#718096'
const COLOR_PRIMARY = '#7f956a'
const COLOR_RED = '#ff6467'

const GRADIENT_CLASS: Record<GradientVariant, string> = {
  green: 'model-green',
  warm: 'model-warm',
  red: 'model-red',
  blue: 'model-blue',
  orange: 'model-orange',
  gray: 'model-gray',
  gold: 'model-gold',
}

const CONFIRM_BUTTON_BG: Record<GradientVariant, string> = {
  green: COLOR_PRIMARY,
  warm: '#ad9ac0',
  red: COLOR_RED,
  blue: '#6aa3d4',
  orange: '#d4a76a',
  gray: '#999999',
  gold: '#D4920A',
}

import { SHINE_COLOR_PRESETS } from '@/constants/shine-colors'

// Map gradient variant to shine color preset
const VARIANT_TO_SHINE: Record<GradientVariant, ShineColorPreset> = {
  green: 'green',
  warm: 'purple',
  red: 'red',
  blue: 'blue',
  orange: 'orange',
  gray: 'gray',
  gold: 'gold',
}

function resolveShineColor(shineColor: ShineColor): string | string[] {
  if (typeof shineColor === 'string' && shineColor in SHINE_COLOR_PRESETS) {
    return SHINE_COLOR_PRESETS[shineColor]!
  }
  if (typeof shineColor === 'boolean') {
    return []
  }
  return shineColor
}

// ─── ModalCard ───────────────────────────────────────────────────────────────

/**
 * Frosted glass card — use inside Modal for content grouping.
 * V1: bg rgba(255,255,255,0.4), border rgba(255,255,255,0.2), radius 12px, padding 24px
 */
export function ModalCard({ children, className }: ModalCardProps) {
  return (
    <div
      className={cn('flex flex-col items-center', className)}
      style={{
        background: 'rgba(255, 255, 255, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        padding: 24,
      }}
    >
      {children}
    </div>
  )
}

// ─── Modal ───────────────────────────────────────────────────────────────────

/**
 * Base glassmorphism modal with mesh gradient background.
 * Uses raw Radix Dialog primitives for full control over rendering.
 */
export function Modal({
  open,
  variant = 'green',
  animated = false,
  header,
  title,
  children,
  footer,
  shineColor: shineColorProp = false,
  width = 500,
  height,
  transition: enableTransition = false,
  loading = false,
  closeOnBackdropClick = true,
  hideCloseButton = false,
  transparent = false,
  onClose,
}: ModalProps) {
  // Resolve shineColor: animated disables shine; true maps to variant preset
  const shineColor = animated
    ? undefined
    : shineColorProp === true
      ? VARIANT_TO_SHINE[variant]
      : shineColorProp === false
        ? undefined
        : shineColorProp

  // Delay Radix unmount so close animation plays first.
  // dialogOpen stays true during close animation; closing triggers CSS exit classes.
  const [dialogOpen, setDialogOpen] = useState(false)
  const [closing, setClosing] = useState(false)

  // Track viewport size for vw/vh resolution when transition is enabled
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  }))

  // Recalculate viewport on resize (only when transition is enabled)
  useEffect(() => {
    if (!enableTransition) return
    function handleResize() {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [enableTransition])

  // Resolve width/height to px values when transition is enabled
  const resolvedWidth = useMemo(
    () => (enableTransition ? resolvePx(width, viewport) : width),
    [enableTransition, width, viewport],
  )
  const resolvedHeight = useMemo(
    () =>
      enableTransition && height !== undefined
        ? resolvePx(height, viewport)
        : height,
    [enableTransition, height, viewport],
  )

  useEffect(() => {
    if (open) {
      setDialogOpen(true)
      setClosing(false)
    } else if (dialogOpen) {
      // In test env, CSS animations don't run — close immediately
      if (import.meta.env.MODE === 'test') {
        setDialogOpen(false)
        return
      }
      setClosing(true)
      // Fallback: unmount after animation duration if animationend doesn't fire
      const timer = setTimeout(() => {
        setClosing(false)
        setDialogOpen(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [open, dialogOpen])

  function handleCloseAnimationEnd(e: React.AnimationEvent) {
    if (closing && e.animationName === 'overlay-fade-out') {
      setClosing(false)
      setDialogOpen(false)
    }
  }

  return (
    <DialogPrimitive.Root
      open={dialogOpen}
      onOpenChange={o => {
        if (!o && closeOnBackdropClick) onClose()
      }}
    >
      <DialogPrimitive.Portal>
        {/* Full-screen gradient overlay with fade animation */}
        <DialogPrimitive.Overlay
          className={cn(
            'glass-modal-overlay fixed inset-0 z-50',
            !animated && GRADIENT_CLASS[variant],
            closing && 'glass-modal-closing',
          )}
          onAnimationEnd={handleCloseAnimationEnd}
        >
          {animated && (
            <div className="absolute inset-0 overflow-hidden">
              <div className="model-bg-animated" />
            </div>
          )}
        </DialogPrimitive.Overlay>

        {/* Content — centered, with zoom animation (antd style) */}
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            'glass-modal-content fixed inset-0 z-50 flex items-center justify-center outline-none',
            closing && 'glass-modal-closing',
          )}
          onClick={e => {
            if (e.target === e.currentTarget && closeOnBackdropClick) onClose()
          }}
          onEscapeKeyDown={e => {
            if (!closeOnBackdropClick) e.preventDefault()
            else onClose()
          }}
        >
          {/* Accessible title (sr-only) — falls back to header when title is not provided */}
          <DialogPrimitive.Title className="sr-only">
            {title ?? header}
          </DialogPrimitive.Title>

          {/* Glassmorphism container with CSS entrance/exit animation */}
          <div
            data-testid="modal-glass-container"
            className={cn(
              'relative',
              closing ? 'animate-modal-exit' : 'animate-modal-enter',
            )}
            style={{
              background: transparent
                ? 'transparent'
                : 'rgba(255, 255, 255, 0.7)',
              backdropFilter: transparent
                ? 'none'
                : 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: transparent
                ? 'none'
                : 'blur(20px) saturate(180%)',
              border: transparent
                ? 'none'
                : shineColor
                  ? 'none'
                  : '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: transparent
                ? 'none'
                : '0 8px 32px rgba(31, 38, 135, 0.1)',
              borderRadius: 16,
              padding: 40,
              width: resolvedWidth,
              height: resolvedHeight,
              maxWidth: 'calc(100vw - 32px)',
              overflow: 'hidden',
              ...(enableTransition
                ? {
                    transition:
                      'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  }
                : {}),
              ...(resolvedHeight
                ? { display: 'flex', flexDirection: 'column' as const }
                : {}),
            }}
          >
            {/* Animated shine border */}
            {shineColor && (
              <ShineBorder
                shineColor={resolveShineColor(shineColor)}
                borderWidth={1}
                duration={20}
              />
            )}

            {/* Close button */}
            {!hideCloseButton && (
              <RippleButton
                onClick={onClose}
                rippleColor="rgba(0,0,0,0.1)"
                className="absolute right-2 top-2 z-10 flex size-10 items-center justify-center rounded-full text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </RippleButton>
            )}

            {/* Header */}
            {header && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  fontSize: 18,
                  fontWeight: 500,
                  color: COLOR_MUTED,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                {header}
              </div>
            )}

            {/* Title — only rendered when title prop is provided */}
            {title && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: 22,
                  fontWeight: 500,
                  color: COLOR_TEXT,
                  marginBottom: 24,
                }}
              >
                {title}
              </div>
            )}

            {/* Content */}
            {height ? (
              <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                {children}
              </div>
            ) : (
              children
            )}

            {/* Footer */}
            {footer && (
              <div
                style={{
                  marginTop: height ? 'auto' : 24,
                  paddingTop: height ? 16 : 0,
                }}
              >
                {footer}
              </div>
            )}

            {/* Loading overlay */}
            {loading && (
              <div
                data-testid="modal-loading-overlay"
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: 16,
                  zIndex: 10,
                }}
              >
                <Loader2
                  size={36}
                  className="animate-spin"
                  style={{ color: COLOR_PRIMARY }}
                />
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

// ─── ConfirmModal ────────────────────────────────────────────────────────────

/**
 * Specialized Modal for confirmation actions.
 * Content is passed as children — avatar, info grid, etc.
 */
export function ConfirmModal({
  open,
  title,
  variant = 'green',
  animated = false,
  header,
  children,
  confirmText,
  cancelText,
  loading = false,
  shineColor,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { t } = useTranslation()
  const resolvedHeader = header ?? t('common.systemConfirm')
  const resolvedConfirmText = confirmText ?? t('common.confirm')
  const resolvedCancelText = cancelText ?? t('common.cancel')
  return (
    <Modal
      open={open}
      variant={variant}
      animated={animated}
      header={resolvedHeader}
      title={title}
      shineColor={shineColor}
      loading={loading}
      onClose={onCancel}
      footer={
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              background: 'rgba(255, 255, 255, 0.5)',
              color: '#4a5568',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              padding: '12px 16px',
              borderRadius: 8,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'transform 0.15s ease',
              flex: 1,
            }}
            className={cn('text-md', !loading && 'hover:-translate-y-0.5')}
          >
            {resolvedCancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              background: CONFIRM_BUTTON_BG[variant],
              color: '#fff',
              border: 'none',
              padding: '12px 16px',
              borderRadius: 8,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              flex: 1,
            }}
            className={cn(
              'text-md',
              !loading &&
                'hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]',
            )}
          >
            {resolvedConfirmText}
          </button>
        </div>
      }
    >
      {children}
    </Modal>
  )
}
