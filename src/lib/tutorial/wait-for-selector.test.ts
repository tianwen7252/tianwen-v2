import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { waitForSelector } from './wait-for-selector'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function addElement(selector: string): HTMLElement {
  const [, id] = selector.match(/\[data-tutorial-id="([^"]+)"\]/) ?? []
  const el = document.createElement('div')
  if (id) el.setAttribute('data-tutorial-id', id)
  document.body.appendChild(el)
  return el
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('waitForSelector', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('resolves immediately when element already exists in DOM', async () => {
    const el = addElement('[data-tutorial-id="existing"]')
    const result = await waitForSelector('[data-tutorial-id="existing"]')
    expect(result).toBe(el)
  })

  it('resolves when element is added to DOM after a short delay', async () => {
    vi.useFakeTimers()
    const promise = waitForSelector('[data-tutorial-id="late"]', {
      timeoutMs: 3000,
    })

    // Add the element after a tick
    await Promise.resolve()
    addElement('[data-tutorial-id="late"]')

    // Advance time slightly to let MutationObserver fire
    await vi.runAllTimersAsync()

    const result = await promise
    expect(result.getAttribute('data-tutorial-id')).toBe('late')
  })

  it('rejects with Error("Timeout") after timeoutMs when element never appears', async () => {
    vi.useFakeTimers()
    // Attach rejection handler before advancing timers to avoid unhandled rejection.
    const promise = waitForSelector('[data-tutorial-id="never"]', {
      timeoutMs: 500,
    })
    const caught = promise.catch(e => e)

    await vi.advanceTimersByTimeAsync(600)

    const err = await caught
    expect(err).toBeInstanceOf(Error)
    expect((err as Error).message).toBe('Timeout')
  })

  it('rejects with Error("Aborted") when signal aborts before element appears', async () => {
    const controller = new AbortController()
    const promise = waitForSelector('[data-tutorial-id="aborted"]', {
      signal: controller.signal,
      timeoutMs: 5000,
    })

    controller.abort()

    await expect(promise).rejects.toThrow('Aborted')
  })

  it('rejects with Error("Aborted") when signal is already aborted before call', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(
      waitForSelector('[data-tutorial-id="pre-aborted"]', {
        signal: controller.signal,
        timeoutMs: 5000,
      }),
    ).rejects.toThrow('Aborted')
  })

  it('calls disconnect() on the MutationObserver when element is found', async () => {
    vi.useFakeTimers()

    const disconnectSpy = vi.fn()
    const OriginalMutationObserver = globalThis.MutationObserver

    // Must use a class so `new MockObserver(callback)` works.
    class MockObserver {
      private cb: MutationCallback
      constructor(callback: MutationCallback) {
        this.cb = callback
      }
      observe() {
        // Simulate mutation after 50ms
        setTimeout(() => {
          addElement('[data-tutorial-id="found"]')
          this.cb([], this as unknown as MutationObserver)
        }, 50)
      }
      disconnect = disconnectSpy
    }
    globalThis.MutationObserver =
      MockObserver as unknown as typeof MutationObserver

    const promise = waitForSelector('[data-tutorial-id="found"]', {
      timeoutMs: 3000,
    })

    await vi.runAllTimersAsync()
    await promise.catch(() => {})

    globalThis.MutationObserver = OriginalMutationObserver
    expect(disconnectSpy).toHaveBeenCalled()
  })

  it('calls disconnect() on the MutationObserver when timeout fires', async () => {
    vi.useFakeTimers()

    const disconnectSpy = vi.fn()
    const OriginalMutationObserver = globalThis.MutationObserver

    class MockObserver {
      observe = vi.fn()
      disconnect = disconnectSpy
    }
    globalThis.MutationObserver =
      MockObserver as unknown as typeof MutationObserver

    const promise = waitForSelector('[data-tutorial-id="timeout-cleanup"]', {
      timeoutMs: 200,
    })
    // Attach handler before advancing timers.
    const caught = promise.catch(() => 'caught')

    await vi.advanceTimersByTimeAsync(300)
    await caught

    globalThis.MutationObserver = OriginalMutationObserver
    expect(disconnectSpy).toHaveBeenCalled()
  })

  it('calls disconnect() on the MutationObserver when signal aborts', async () => {
    const disconnectSpy = vi.fn()
    const OriginalMutationObserver = globalThis.MutationObserver

    class MockObserver {
      observe = vi.fn()
      disconnect = disconnectSpy
    }
    globalThis.MutationObserver =
      MockObserver as unknown as typeof MutationObserver

    const controller = new AbortController()
    const promise = waitForSelector('[data-tutorial-id="abort-cleanup"]', {
      signal: controller.signal,
      timeoutMs: 5000,
    })

    controller.abort()
    await promise.catch(() => {})

    globalThis.MutationObserver = OriginalMutationObserver
    expect(disconnectSpy).toHaveBeenCalled()
  })
})
