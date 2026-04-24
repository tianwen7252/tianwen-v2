import { ErrorBoundary } from 'react-error-boundary'
import { logError } from '@/lib/error-logger'
import type { ReactNode, ErrorInfo } from 'react'

interface TutorialErrorBoundaryProps {
  readonly children: ReactNode
}

/**
 * Lightweight error boundary for the tutorial subtree.
 * On error, logs to error_logs and renders nothing — a broken tutorial must
 * not take down the rest of the app, but it also shouldn't escalate to the
 * full-screen ErrorOverlay that AppErrorBoundary uses. Tutorials are
 * non-critical UI.
 */
export function TutorialErrorBoundary({
  children,
}: TutorialErrorBoundaryProps) {
  return (
    <ErrorBoundary
      FallbackComponent={SilentFallback}
      onError={handleTutorialError}
    >
      {children}
    </ErrorBoundary>
  )
}

function SilentFallback() {
  return null
}

function handleTutorialError(error: unknown, _info: ErrorInfo) {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  logError(message, 'TutorialErrorBoundary', stack)
}
