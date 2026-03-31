import { Toaster as Sonner, toast } from 'sonner'
import { CircleCheck, CircleX, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/cn'

// ─── Notification Toast ──────────────────────────────────────────────────────

type ToastVariant = 'success' | 'error' | 'info' | 'warning'

const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: React.ReactNode; color: string }
> = {
  success: {
    icon: <CircleCheck className="size-5 text-white" />,
    color: '#7f956a',
  },
  error: { icon: <CircleX className="size-5 text-white" />, color: '#E85D5D' },
  info: { icon: <Info className="size-5 text-white" />, color: '#4A90D9' },
  warning: {
    icon: <AlertTriangle className="size-5 text-white" />,
    color: '#D9B870',
  },
}

function NotificationToast({
  message,
  description,
  variant,
  showTime = false,
}: {
  readonly message: string
  readonly description?: string
  readonly variant: ToastVariant
  readonly showTime?: boolean
}) {
  const { icon, color } = VARIANT_CONFIG[variant]
  const time = showTime
    ? `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
    : null

  return (
    <figure
      className={cn(
        'relative mx-auto min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-2xl p-4',
        'transition-all duration-200 ease-in-out',
        'bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]',
        'dark:bg-transparent dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)]',
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
        <div className="flex flex-col overflow-hidden">
          <figcaption className="flex flex-row items-center whitespace-pre text-base dark:text-white">
            <span style={{ color }}>{message}</span>
            {time && (
              <>
                <span className="mx-1">·</span>
                <span className="text-xs text-gray-500">{time}</span>
              </>
            )}
          </figcaption>
          {description && (
            <p className="text-sm font-normal dark:text-white/60">
              {description}
            </p>
          )}
        </div>
      </div>
    </figure>
  )
}

// ─── Custom toast helpers ────────────────────────────────────────────────────

interface NotifyOptions {
  readonly description?: string
  readonly showTime?: boolean
  /** Auto-dismiss duration in milliseconds (default: 5000) */
  readonly duration?: number
}

function showToast(
  message: string,
  variant: ToastVariant,
  options: NotifyOptions = {},
) {
  const { description, showTime, duration = 5000 } = options
  return toast.custom(
    () => (
      <NotificationToast
        message={message}
        description={description}
        variant={variant}
        showTime={showTime}
      />
    ),
    { duration },
  )
}

/** Drop-in replacements for toast.success / toast.error / toast.info / toast.warning */
export const notify = {
  success: (message: string, options?: NotifyOptions) =>
    showToast(message, 'success', options),
  error: (message: string, options?: NotifyOptions) =>
    showToast(message, 'error', options),
  info: (message: string, options?: NotifyOptions) =>
    showToast(message, 'info', options),
  warning: (message: string, options?: NotifyOptions) =>
    showToast(message, 'warning', options),
}

// ─── Toaster ─────────────────────────────────────────────────────────────────

interface ToasterProps {
  readonly position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center'
  readonly duration?: number
}

/**
 * Toaster wrapper around sonner's Toaster component.
 * Use `notify.success()` / `notify.error()` instead of `toast.success()` / `toast.error()`
 * for the custom notification style.
 */
function Toaster({
  position = 'top-right',
  duration = 3000,
  ...props
}: ToasterProps) {
  return (
    <Sonner
      position={position}
      duration={duration}
      toastOptions={{
        unstyled: true,
      }}
      {...props}
    />
  )
}

export { Toaster }
