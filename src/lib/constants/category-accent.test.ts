import { describe, it, expect } from 'vitest'
import { CATEGORY_ACCENT, DEFAULT_ACCENT } from './category-accent'

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('CATEGORY_ACCENT', () => {
  const expectedKeys = [
    'bento',
    'single',
    'drink',
    'dumpling',
    'other',
    'discount',
  ]

  it('should contain all expected category keys', () => {
    for (const key of expectedKeys) {
      expect(CATEGORY_ACCENT).toHaveProperty(key)
    }
  })

  it('should have exactly the expected category keys (no extra keys)', () => {
    expect(Object.keys(CATEGORY_ACCENT).sort()).toEqual(expectedKeys.sort())
  })

  it.each([
    'bento',
    'single',
    'drink',
    'dumpling',
    'other',
    'discount',
  ] as const)('should have border and text properties for "%s"', key => {
    const accent = CATEGORY_ACCENT[key]
    expect(accent).toBeDefined()
    expect(accent).toHaveProperty('border')
    expect(accent).toHaveProperty('text')
    expect(typeof accent!.border).toBe('string')
    expect(typeof accent!.text).toBe('string')
  })

  it('should have border classes starting with "border-l-"', () => {
    for (const key of expectedKeys) {
      expect(CATEGORY_ACCENT[key]!.border).toMatch(/^border-l-/)
    }
  })

  it('should have text classes starting with "text-"', () => {
    for (const key of expectedKeys) {
      expect(CATEGORY_ACCENT[key]!.text).toMatch(/^text-/)
    }
  })
})

describe('DEFAULT_ACCENT', () => {
  it('should have border and text properties', () => {
    expect(DEFAULT_ACCENT).toHaveProperty('border')
    expect(DEFAULT_ACCENT).toHaveProperty('text')
  })

  it('should have correct fallback border class', () => {
    expect(DEFAULT_ACCENT.border).toBe('border-l-gray-300')
  })

  it('should have correct fallback text class', () => {
    expect(DEFAULT_ACCENT.text).toBe('text-gray-400')
  })
})
