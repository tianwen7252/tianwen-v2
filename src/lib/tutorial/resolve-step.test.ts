import { describe, expect, it } from 'vitest'
import { resolveStep } from './resolve-step'
import type { ResolveStepContext } from './resolve-step'
import type { TutorialStep } from './types'
import { WAIT_FOR_SELECTOR_TIMEOUT_MS } from './constants'

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeStep(overrides: Partial<TutorialStep> = {}): TutorialStep {
  return {
    id: 'step-1',
    titleKey: 'tutorial.step1.title',
    bodyKey: 'tutorial.step1.body',
    ...overrides,
  }
}

function makeCtx(
  overrides: Partial<ResolveStepContext> = {},
): ResolveStepContext {
  return {
    currentPath: '/',
    querySelector: () => null,
    defaultTimeoutMs: WAIT_FOR_SELECTOR_TIMEOUT_MS,
    ...overrides,
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('resolveStep', () => {
  describe('show-centered', () => {
    it('returns show-centered when step has no target and no route', () => {
      const step = makeStep()
      const ctx = makeCtx()
      expect(resolveStep(step, ctx)).toEqual({ kind: 'show-centered' })
    })

    it('returns show-centered when route matches and no target', () => {
      const step = makeStep({ route: '/' })
      const ctx = makeCtx({ currentPath: '/' })
      expect(resolveStep(step, ctx)).toEqual({ kind: 'show-centered' })
    })
  })

  describe('navigate', () => {
    it('returns navigate when step.route differs from currentPath', () => {
      const step = makeStep({ route: '/settings' })
      const ctx = makeCtx({ currentPath: '/' })
      expect(resolveStep(step, ctx)).toEqual({
        kind: 'navigate',
        to: '/settings',
      })
    })

    it('returns navigate regardless of whether target is set', () => {
      const step = makeStep({ route: '/orders', target: 'some-button' })
      const ctx = makeCtx({ currentPath: '/' })
      expect(resolveStep(step, ctx)).toEqual({
        kind: 'navigate',
        to: '/orders',
      })
    })

    it('returns navigate when currentPath is a sub-route of a different route', () => {
      const step = makeStep({ route: '/settings' })
      const ctx = makeCtx({ currentPath: '/orders' })
      expect(resolveStep(step, ctx)).toEqual({
        kind: 'navigate',
        to: '/settings',
      })
    })
  })

  describe('show-anchored', () => {
    it('returns show-anchored when target is present in DOM', () => {
      const mockEl = document.createElement('div')
      const step = makeStep({ target: 'cart-button' })
      const ctx = makeCtx({
        querySelector: () => mockEl,
      })
      const result = resolveStep(step, ctx)
      expect(result).toEqual({
        kind: 'show-anchored',
        selector: '[data-tutorial-id="cart-button"]',
      })
    })

    it('uses tutorialSelector format [data-tutorial-id="id"] for the selector', () => {
      const mockEl = document.createElement('div')
      const step = makeStep({ target: 'add-product.btn' })
      const ctx = makeCtx({
        querySelector: () => mockEl,
      })
      const result = resolveStep(step, ctx)
      expect(result).toMatchObject({
        kind: 'show-anchored',
        selector: '[data-tutorial-id="add-product.btn"]',
      })
    })

    it('returns show-anchored when route matches and target is present', () => {
      const mockEl = document.createElement('button')
      const step = makeStep({ route: '/orders', target: 'orders-list' })
      const ctx = makeCtx({
        currentPath: '/orders',
        querySelector: () => mockEl,
      })
      expect(resolveStep(step, ctx)).toEqual({
        kind: 'show-anchored',
        selector: '[data-tutorial-id="orders-list"]',
      })
    })
  })

  describe('wait-for-target', () => {
    it('returns wait-for-target when target is not in DOM', () => {
      const step = makeStep({ target: 'missing-el' })
      const ctx = makeCtx({ querySelector: () => null })
      expect(resolveStep(step, ctx)).toEqual({
        kind: 'wait-for-target',
        selector: '[data-tutorial-id="missing-el"]',
        timeoutMs: WAIT_FOR_SELECTOR_TIMEOUT_MS,
      })
    })

    it('uses defaultTimeoutMs from context when no custom timeout', () => {
      const step = makeStep({ target: 'el' })
      const ctx = makeCtx({
        querySelector: () => null,
        defaultTimeoutMs: 5000,
      })
      const result = resolveStep(step, ctx)
      expect(result).toMatchObject({ kind: 'wait-for-target', timeoutMs: 5000 })
    })
  })

  describe('edge cases', () => {
    it('treats empty string route as no route (does NOT infinite-loop navigate)', () => {
      const step = makeStep({ route: '' })
      const ctx = makeCtx({ currentPath: '/' })
      // Empty route is falsy — resolver must fall through to show-centered,
      // not issue { kind: 'navigate', to: '' } which would loop forever.
      expect(resolveStep(step, ctx)).toEqual({ kind: 'show-centered' })
    })

    it('treats an empty string target as "no target" (show-centered)', () => {
      // An empty string is falsy so resolveStep short-circuits to show-centered
      // before invoking tutorialSelector. This avoids a thrown validation error
      // for a common authoring mistake.
      const step = makeStep({ target: '' })
      const ctx = makeCtx()
      expect(resolveStep(step, ctx)).toEqual({ kind: 'show-centered' })
    })

    it('throws when target contains invalid characters', () => {
      // Truthy but invalid ids still bubble up from tutorialSelector —
      // the runner is responsible for catching this and falling back.
      const step = makeStep({ target: 'bad"id' })
      const ctx = makeCtx()
      expect(() => resolveStep(step, ctx)).toThrow()
    })

    it('throws when target contains a space (whitespace not in whitelist)', () => {
      const step = makeStep({ target: 'bad id' })
      const ctx = makeCtx()
      expect(() => resolveStep(step, ctx)).toThrow()
    })
  })
})
