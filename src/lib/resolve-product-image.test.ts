/**
 * Tests for resolveProductImage utility.
 */

import { describe, it, expect } from 'vitest'
import { resolveProductImage } from './resolve-product-image'

describe('resolveProductImage', () => {
  it('returns undefined when key is undefined', () => {
    expect(resolveProductImage(undefined)).toBeUndefined()
  })

  it('returns undefined when key is empty string', () => {
    expect(resolveProductImage('')).toBeUndefined()
  })

  it('resolves short key to full commodities path', () => {
    expect(resolveProductImage('braised-pork-belly-rice')).toBe(
      'images/commodities/braised-pork-belly-rice.png',
    )
  })

  it('resolves any short key to full path with .png extension', () => {
    expect(resolveProductImage('scallop-dumpling')).toBe(
      'images/commodities/scallop-dumpling.png',
    )
  })

  it('returns legacy full path as-is (backward compatibility)', () => {
    expect(resolveProductImage('images/commodities/lu-rou.png')).toBe(
      'images/commodities/lu-rou.png',
    )
  })

  it('returns any images/-prefixed path as-is', () => {
    expect(resolveProductImage('images/other/some-image.jpg')).toBe(
      'images/other/some-image.jpg',
    )
  })
})
