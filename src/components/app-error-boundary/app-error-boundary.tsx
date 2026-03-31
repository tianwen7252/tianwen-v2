import type { ErrorInfo } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from '@/components/error-fallback'
import { logError } from '@/lib/error-logger'

interface AppErrorBoundaryProps {
  children: React.ReactNode
  title?: string
  onReset?: () => void
}

/**
 * Log error details to console and persist to the error_logs DB table.
 */
function handleError(error: unknown, info: ErrorInfo) {
  console.error('[ErrorBoundary]', error)
  if (info.componentStack) {
    console.error('[ErrorBoundary] Component stack:', info.componentStack)
  }

  // Persist error to DB (fire-and-forget)
  if (error instanceof Error) {
    logError(error.message, 'ErrorBoundary', error.stack)
  } else {
    logError(String(error), 'ErrorBoundary')
  }
}

/**
 * Application-level error boundary wrapper.
 * Catches rendering errors in child components and displays a fallback UI.
 *
 * Usage:
 * - Global: wrap the root layout to catch any uncaught errors
 * - Module-level: wrap individual pages/sections for granular recovery
 */
export function AppErrorBoundary({
  children,
  title,
  onReset,
}: AppErrorBoundaryProps) {
  return (
    <ErrorBoundary
      FallbackComponent={props => <ErrorFallback {...props} title={title} />}
      onError={handleError}
      onReset={onReset}
    >
      {children}
    </ErrorBoundary>
  )
}
