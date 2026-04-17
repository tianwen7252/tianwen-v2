import { describe, it, expect } from 'vitest'
import { tutorialAnchor, tutorialSelector } from './tutorial-anchor'

// ─── tutorialAnchor ──────────────────────────────────────────────────────────

describe('tutorialAnchor', () => {
  it('returns an object with the data-tutorial-id attribute set to the given id', () => {
    const result = tutorialAnchor('cart-button')
    expect(result).toEqual({ 'data-tutorial-id': 'cart-button' })
  })

  it('returns a readonly-compatible plain object (spread-safe)', () => {
    const result = tutorialAnchor('some-id')
    expect(Object.keys(result)).toEqual(['data-tutorial-id'])
    expect(result['data-tutorial-id']).toBe('some-id')
  })

  it('accepts ids with alphanumeric characters', () => {
    const result = tutorialAnchor('ABC123')
    expect(result['data-tutorial-id']).toBe('ABC123')
  })

  it('accepts ids with dots, underscores, colons, and hyphens', () => {
    const valid = 'step.one:two_three-four'
    const result = tutorialAnchor(valid)
    expect(result['data-tutorial-id']).toBe(valid)
  })

  it('throws when id contains a double-quote character', () => {
    expect(() => tutorialAnchor('bad"id')).toThrow('Invalid tutorial anchor id')
  })

  it('throws when id contains a newline character', () => {
    expect(() => tutorialAnchor('bad\nid')).toThrow(
      'Invalid tutorial anchor id',
    )
  })

  it('throws when id contains a carriage return character', () => {
    expect(() => tutorialAnchor('bad\rid')).toThrow(
      'Invalid tutorial anchor id',
    )
  })

  it('throws when id contains spaces', () => {
    expect(() => tutorialAnchor('bad id')).toThrow('Invalid tutorial anchor id')
  })

  it('throws when id is an empty string', () => {
    expect(() => tutorialAnchor('')).toThrow('Invalid tutorial anchor id')
  })

  it('throws when id contains angle brackets', () => {
    expect(() => tutorialAnchor('<script>')).toThrow(
      'Invalid tutorial anchor id',
    )
  })
})

// ─── tutorialSelector ────────────────────────────────────────────────────────

describe('tutorialSelector', () => {
  it('returns a CSS attribute selector for the given id', () => {
    expect(tutorialSelector('cart-button')).toBe(
      '[data-tutorial-id="cart-button"]',
    )
  })

  it('returns a selector for alphanumeric ids', () => {
    expect(tutorialSelector('Step01')).toBe('[data-tutorial-id="Step01"]')
  })

  it('returns a selector for ids with dots and colons', () => {
    expect(tutorialSelector('step.one:two')).toBe(
      '[data-tutorial-id="step.one:two"]',
    )
  })

  it('throws when id contains a double-quote (regression: no injection via selector)', () => {
    expect(() => tutorialSelector('bad"id')).toThrow(
      'Invalid tutorial anchor id',
    )
  })

  it('throws when id is empty', () => {
    expect(() => tutorialSelector('')).toThrow('Invalid tutorial anchor id')
  })

  it('throws when id contains a newline', () => {
    expect(() => tutorialSelector('a\nb')).toThrow('Invalid tutorial anchor id')
  })

  it('throws when id contains special shell/HTML characters not in whitelist', () => {
    expect(() => tutorialSelector('id&hack')).toThrow(
      'Invalid tutorial anchor id',
    )
  })
})
