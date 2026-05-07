import { describe, it, expect } from 'vitest'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { COMMODITY_IMAGE_KEYS } from './commodity-images'

describe('COMMODITY_IMAGE_KEYS', () => {
  const diskKeys = readdirSync(join(process.cwd(), 'public/images/commodities'))
    .filter(name => name.endsWith('.png'))
    .map(name => name.replace(/\.png$/, ''))
    .sort()

  it('contains every PNG that ships under public/images/commodities (V2-254)', () => {
    expect([...COMMODITY_IMAGE_KEYS].sort()).toEqual(diskKeys)
  })

  it('has no duplicates', () => {
    const unique = new Set(COMMODITY_IMAGE_KEYS)
    expect(unique.size).toBe(COMMODITY_IMAGE_KEYS.length)
  })
})
