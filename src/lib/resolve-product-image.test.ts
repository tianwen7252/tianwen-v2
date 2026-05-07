/**
 * Tests for resolveProductImage utility.
 * The resolver must return an absolute URL so the same path renders
 * correctly under any router segment (e.g. /settings/product-management).
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

  it('resolves a short key to an absolute commodities path', () => {
    expect(resolveProductImage('braised-pork-belly-rice')).toBe(
      '/images/commodities/braised-pork-belly-rice.png',
    )
  })

  it('always emits the .png extension for short keys', () => {
    expect(resolveProductImage('scallop-dumpling')).toBe(
      '/images/commodities/scallop-dumpling.png',
    )
  })

  it('rebases legacy `images/...` paths onto BASE_URL', () => {
    expect(resolveProductImage('images/commodities/lu-rou.png')).toBe(
      '/images/commodities/lu-rou.png',
    )
    expect(resolveProductImage('images/other/some-image.jpg')).toBe(
      '/images/other/some-image.jpg',
    )
  })

  it('passes already-absolute paths through unchanged', () => {
    expect(resolveProductImage('/images/commodities/x.png')).toBe(
      '/images/commodities/x.png',
    )
  })

  it('passes http(s) and data URIs through unchanged', () => {
    expect(resolveProductImage('https://cdn.example.com/x.png')).toBe(
      'https://cdn.example.com/x.png',
    )
    expect(resolveProductImage('data:image/png;base64,iVBORw0KGgo=')).toBe(
      'data:image/png;base64,iVBORw0KGgo=',
    )
  })
})
