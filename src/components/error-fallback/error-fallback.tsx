import { useTranslation } from 'react-i18next'
import { CircleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ErrorFallbackProps {
  error: unknown
  resetErrorBoundary: (...args: unknown[]) => void
  title?: string
}

/**
 * Extract a displayable message from an unknown thrown value.
 * Falls back to translated "unknown error" string.
 */
function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message || fallback
  }
  if (typeof error === 'string') {
    return error || fallback
  }
  return fallback
}

/**
 * Fallback UI displayed when an ErrorBoundary catches an error.
 * Shows error title, message, and a retry button.
 */
export function ErrorFallback({
  error,
  resetErrorBoundary,
  title,
}: ErrorFallbackProps) {
  const { t } = useTranslation()

  const displayTitle = title ?? t('error.title')

  return (
    <div
      className="flex min-h-[200px] flex-col items-center justify-center gap-6 p-6 text-center"
      role="alert"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10">
        <CircleAlert className="h-10 w-10 text-destructive" strokeWidth={1.5} />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-lg text-destructive">{displayTitle}</h2>
        <p className="max-w-md text-md text-muted-foreground">
          {getErrorMessage(error, t('error.unknown'))}
        </p>
      </div>
      <Button variant="outline" onClick={resetErrorBoundary}>
        {t('common.retry')}
      </Button>
    </div>
  )
}
