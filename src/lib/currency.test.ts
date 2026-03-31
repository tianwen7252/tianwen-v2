import { describe, expect, it } from 'vitest'

import { formatCurrency } from './currency'

describe('formatCurrency', () => {
  it('formats a positive integer with thousands separators', () => {
    expect(formatCurrency(1234)).toBe('$1,234')
  })

  it('formats zero as $0', () => {
    expect(formatCurrency(0)).toBe('$0')
  })

  it('formats null as $0 by default', () => {
    expect(formatCurrency(null)).toBe('$0')
  })

  it('formats undefined as $0 by default', () => {
    expect(formatCurrency(undefined)).toBe('$0')
  })

  it('returns empty string for undefined when allowEmpty is true', () => {
    expect(formatCurrency(undefined, { allowEmpty: true })).toBe('')
  })

  it('returns empty string for null when allowEmpty is true', () => {
    expect(formatCurrency(null, { allowEmpty: true })).toBe('')
  })

  it('returns empty string for zero when allowEmpty is true', () => {
    expect(formatCurrency(0, { allowEmpty: true })).toBe('')
  })

  it('formats a positive value even when allowEmpty is true', () => {
    expect(formatCurrency(500, { allowEmpty: true })).toBe('$500')
  })

  it('formats large numbers with thousands separators', () => {
    expect(formatCurrency(1_000_000)).toBe('$1,000,000')
  })
})
