import { describe, it, expect } from 'vitest'
import { resolvePx } from './resolve-px'

describe('resolvePx', () => {
  const viewport = { width: 1024, height: 768 }

  // --- number passthrough ---
  it('should return a number value as-is', () => {
    expect(resolvePx(500, viewport)).toBe(500)
  })

  it('should return 0 for numeric zero', () => {
    expect(resolvePx(0, viewport)).toBe(0)
  })

  // --- vw conversion ---
  it("should convert '95vw' to floor(width * 0.95)", () => {
    expect(resolvePx('95vw', viewport)).toBe(Math.floor(1024 * 0.95))
  })

  it("should convert '50vw' to floor(width * 0.5)", () => {
    expect(resolvePx('50vw', viewport)).toBe(Math.floor(1024 * 0.5))
  })

  it("should convert '100vw' to floor(width * 1.0)", () => {
    expect(resolvePx('100vw', viewport)).toBe(Math.floor(1024 * 1.0))
  })

  // --- vh conversion ---
  it("should convert '90vh' to floor(height * 0.9)", () => {
    expect(resolvePx('90vh', viewport)).toBe(Math.floor(768 * 0.9))
  })

  it("should convert '50vh' to floor(height * 0.5)", () => {
    expect(resolvePx('50vh', viewport)).toBe(Math.floor(768 * 0.5))
  })

  // --- px string ---
  it("should convert '500px' to 500", () => {
    expect(resolvePx('500px', viewport)).toBe(500)
  })

  it("should convert '0px' to 0", () => {
    expect(resolvePx('0px', viewport)).toBe(0)
  })

  // --- edge cases ---
  it('should handle leading/trailing whitespace in string values', () => {
    expect(resolvePx('  95vw  ', viewport)).toBe(Math.floor(1024 * 0.95))
    expect(resolvePx('  500px  ', viewport)).toBe(500)
  })

  it('should handle uppercase unit strings (case insensitive)', () => {
    expect(resolvePx('95VW', viewport)).toBe(Math.floor(1024 * 0.95))
    expect(resolvePx('90VH', viewport)).toBe(Math.floor(768 * 0.9))
    expect(resolvePx('500PX', viewport)).toBe(500)
  })

  it('should parse a bare numeric string as a plain number', () => {
    expect(resolvePx('500', viewport)).toBe(500)
  })

  it('should return 0 for an unrecognized string', () => {
    expect(resolvePx('abc', viewport)).toBe(0)
  })

  it('should return 0 for an empty string', () => {
    expect(resolvePx('', viewport)).toBe(0)
  })

  it('should handle decimal vw values', () => {
    expect(resolvePx('33.33vw', viewport)).toBe(Math.floor(1024 * 0.3333))
  })

  it('should handle decimal vh values', () => {
    expect(resolvePx('33.33vh', viewport)).toBe(Math.floor(768 * 0.3333))
  })

  it('should handle negative values', () => {
    expect(resolvePx(-10, viewport)).toBe(-10)
    expect(resolvePx('-10px', viewport)).toBe(-10)
  })
})
