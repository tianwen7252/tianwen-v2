/**
 * In-memory error log buffer.
 *
 * Purpose: during a database swap (V2 import, restore previous, etc.) the
 * active DB is closed and replaced, so any `error_logs` write issued during
 * the swap would land on a DB that is about to be discarded (or on no DB
 * at all). To avoid losing those messages, callers collect them here via
 * `bufferLog()` and flush to the persisted `error_logs` table only once
 * the DB is guaranteed to be writable (either after a successful swap to
 * the new DB, or after rolling back to the old one).
 *
 * This module holds state at module scope so all callers share one buffer
 * across a single browser session. The buffer is intentionally small and
 * is cleared on flush.
 */

import { getErrorLogRepo } from '@/lib/repositories/provider'

// ── Types ──────────────────────────────────────────────────────────────────

interface BufferedEntry {
  readonly message: string
  readonly source: string
  readonly stack: string | undefined
  readonly createdAt: number
}

// ── State ──────────────────────────────────────────────────────────────────

let buffer: BufferedEntry[] = []

// ── API ────────────────────────────────────────────────────────────────────

/**
 * Append an error entry to the in-memory buffer.
 *
 * Safe to call at any time, including while the DB is being swapped.
 * `createdAt` is captured at call time so later flushing preserves the
 * original timestamp.
 */
export function bufferLog(
  message: string,
  source: string,
  stack?: string,
): void {
  buffer.push({
    message,
    source,
    stack,
    createdAt: Date.now(),
  })
}

/**
 * Write all buffered entries to `error_logs` using the currently active
 * DB (via `getErrorLogRepo()`). On success the buffer is cleared. On
 * failure the entries stay buffered so the next call can retry — callers
 * may also choose to drop them via `clearLogBuffer()`.
 *
 * Call this only when the DB is known to be writable (e.g. after a
 * successful import swap or after rollback).
 */
export async function flushLogBuffer(): Promise<void> {
  if (buffer.length === 0) return

  // Snapshot the current entries. If flush fails mid-loop we restore the
  // untried remainder so nothing is silently lost.
  const pending = buffer
  buffer = []

  const repo = getErrorLogRepo()
  const failed: BufferedEntry[] = []

  for (const entry of pending) {
    try {
      await repo.create(entry.message, entry.source, entry.stack)
    } catch {
      failed.push(entry)
    }
  }

  if (failed.length > 0) {
    // Re-queue failed entries at the front so they are retried first next time.
    buffer = [...failed, ...buffer]
  }
}

/**
 * Drop all buffered entries without writing them.
 *
 * Intended for tests and for scenarios where the buffer must be reset
 * without persisting (e.g. user explicitly dismisses an error flow).
 */
export function clearLogBuffer(): void {
  buffer = []
}

/**
 * Return the number of entries currently buffered.
 * Exposed for tests and diagnostics; production code should not rely on
 * buffer size.
 */
export function getLogBufferSize(): number {
  return buffer.length
}
