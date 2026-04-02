/**
 * Custom error classes for the application.
 * Provides typed errors for specific failure scenarios.
 */

// ── AuthExpiredError ─────────────────────────────────────────────────────────

/**
 * Thrown when a Google API authentication token has expired (HTTP 401).
 * Allows callers to distinguish auth expiry from other errors.
 */
export class AuthExpiredError extends Error {
  constructor(message = 'Authentication expired') {
    super(message)
    this.name = 'AuthExpiredError'
  }
}
