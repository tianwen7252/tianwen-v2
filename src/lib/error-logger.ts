/**
 * Global error logging utility.
 * Captures unhandled errors and promise rejections into the error_logs DB table.
 */

import { getErrorLogRepo } from '@/lib/repositories/provider'

/**
 * Install global error handlers that log unhandled errors to the DB.
 * Call once at app startup after initRepositories().
 */
export function installGlobalErrorLogger(): void {
  window.addEventListener('error', (event: ErrorEvent) => {
    logError(event.message, event.filename || 'unknown', event.error?.stack)
  })

  window.addEventListener(
    'unhandledrejection',
    (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const message = reason instanceof Error ? reason.message : String(reason)
      const stack = reason instanceof Error ? reason.stack : undefined
      logError(message, 'unhandledrejection', stack)
    },
  )
}

/**
 * Log an error to the DB (fire-and-forget, never throws).
 */
export function logError(
  message: string,
  source: string,
  stack?: string,
): void {
  try {
    getErrorLogRepo()
      .create(message, source, stack)
      .catch(() => {
        // Silently ignore -- we cannot log a logging failure
      })
  } catch {
    // Silently ignore -- repos may not be initialized yet
  }
}
