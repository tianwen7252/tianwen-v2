import { WAIT_FOR_SELECTOR_TIMEOUT_MS } from './constants'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WaitOptions {
  readonly signal?: AbortSignal
  readonly timeoutMs?: number
}

// ─── Implementation ───────────────────────────────────────────────────────────

/**
 * Waits for an element matching `selector` to appear in the DOM.
 * Uses MutationObserver + initial synchronous check.
 * Rejects on timeout or abort.
 */
export function waitForSelector(
  selector: string,
  options?: WaitOptions,
): Promise<Element> {
  const timeoutMs = options?.timeoutMs ?? WAIT_FOR_SELECTOR_TIMEOUT_MS
  const signal = options?.signal

  return new Promise<Element>((resolve, reject) => {
    // Reject immediately if signal is already aborted.
    if (signal?.aborted) {
      reject(new Error('Aborted'))
      return
    }

    // Synchronous check — element may already be in the DOM.
    const existing = document.querySelector(selector)
    if (existing !== null) {
      resolve(existing)
      return
    }

    let settled = false

    function cleanup() {
      observer.disconnect()
      clearTimeout(timer)
      if (signal) {
        signal.removeEventListener('abort', onAbort)
      }
    }

    function onAbort() {
      if (settled) return
      settled = true
      cleanup()
      reject(new Error('Aborted'))
    }

    // MutationObserver watches for DOM additions.
    const observer = new MutationObserver(() => {
      if (settled) return
      const el = document.querySelector(selector)
      if (el !== null) {
        settled = true
        cleanup()
        resolve(el)
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })

    // Timeout guard.
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      cleanup()
      reject(new Error('Timeout'))
    }, timeoutMs)

    // Abort signal listener.
    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true })
    }
  })
}
