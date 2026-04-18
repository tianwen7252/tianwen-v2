import { WAIT_FOR_SELECTOR_TIMEOUT_MS } from './constants'
import { tutorialSelector } from './tutorial-anchor'
import type { TutorialStep } from './types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ResolveStepAction =
  | { readonly kind: 'navigate'; readonly to: string }
  | {
      readonly kind: 'wait-for-target'
      readonly selector: string
      readonly timeoutMs: number
    }
  | { readonly kind: 'show-centered' }
  | { readonly kind: 'show-anchored'; readonly selector: string }

export interface ResolveStepContext {
  readonly currentPath: string
  /** Returns the Element for a selector, or null. Injected for testability. */
  readonly querySelector: (selector: string) => Element | null
  /** Default timeout if step.waitFor.timeoutMs is not specified. */
  readonly defaultTimeoutMs: number
}

// ─── Pure resolver ────────────────────────────────────────────────────────────

/**
 * Maps a tutorial step and current router state to a concrete runner action.
 * Pure function — no DOM access except via injected `ctx.querySelector`.
 */
export function resolveStep(
  step: TutorialStep,
  ctx: ResolveStepContext,
): ResolveStepAction {
  // Route mismatch — navigate first; target resolution happens after arrival.
  // Truthy check so an empty string does not trigger an infinite navigation
  // loop (TanStack Router paths always start with '/', never '').
  if (step.route && ctx.currentPath !== step.route) {
    return { kind: 'navigate', to: step.route }
  }

  // No target — render a centered popover with no anchor.
  if (!step.target) {
    return { kind: 'show-centered' }
  }

  const selector = tutorialSelector(step.target)

  // Target already mounted — show it immediately.
  if (ctx.querySelector(selector) !== null) {
    return { kind: 'show-anchored', selector }
  }

  // Target not yet in DOM — wait for it.
  return {
    kind: 'wait-for-target',
    selector,
    timeoutMs: ctx.defaultTimeoutMs ?? WAIT_FOR_SELECTOR_TIMEOUT_MS,
  }
}
