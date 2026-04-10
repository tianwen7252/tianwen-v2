import { useEffect } from 'react'
import type { ErrorInfo } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { logError } from '@/lib/error-logger'
import { useInitStore } from '@/stores/init-store'

interface AppErrorBoundaryProps {
  children: React.ReactNode
  onReset?: () => void
}

/**
 * Persist error details to the error_logs DB table.
 */
function handleError(error: unknown, _info: ErrorInfo) {
  if (error instanceof Error) {
    logError(error.message, 'ErrorBoundary', error.stack)
  } else {
    logError(String(error), 'ErrorBoundary')
  }
}

/**
 * Fallback component that triggers the full-screen ErrorOverlay
 * and renders nothing itself (the overlay is rendered in RootLayout).
 *
 * Cleanup only clears the overlay when the current state still matches
 * what this trigger set — otherwise a bootstrap error overlay set by
 * RootLayout could be silently wiped on unmount.
 */
function ErrorOverlayTrigger({ error }: FallbackProps) {
  useEffect(() => {
    const msg = error instanceof Error ? error.message : String(error)
    useInitStore.getState().setErrorOverlayType('error', msg)
    return () => {
      const current = useInitStore.getState().errorOverlayMessage
      if (current === msg) {
        useInitStore.getState().setErrorOverlayType(null)
      }
    }
  }, [error])

  return null
}

/**
 * Application-level error boundary wrapper.
 * Catches rendering errors in child components and triggers the ErrorOverlay.
 */
export function AppErrorBoundary({ children, onReset }: AppErrorBoundaryProps) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorOverlayTrigger}
      onError={handleError}
      onReset={onReset}
    >
      {children}
    </ErrorBoundary>
  )
}
