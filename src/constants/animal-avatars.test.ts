/**
 * Tests for ANIMAL_AVATARS constant.
 * Ensures paths are filename-only (no directory prefix).
 */

import { describe, it, expect } from 'vitest'
import { ANIMAL_AVATARS } from './animal-avatars'

describe('ANIMAL_AVATARS', () => {
  it('should be a non-empty array', () => {
    expect(ANIMAL_AVATARS.length).toBeGreaterThan(0)
  })

  it('every entry has a non-empty id', () => {
    for (const animal of ANIMAL_AVATARS) {
      expect(animal.id).toBeTruthy()
    }
  })

  it('every entry has a filename-only path (no slashes)', () => {
    for (const animal of ANIMAL_AVATARS) {
      expect(animal.path).not.toContain('/')
    }
  })

  it('every entry path ends with .png', () => {
    for (const animal of ANIMAL_AVATARS) {
      expect(animal.path).toMatch(/\.png$/)
    }
  })

  it('every entry path matches <id>.png pattern', () => {
    for (const animal of ANIMAL_AVATARS) {
      expect(animal.path).toBe(`${animal.id}.png`)
    }
  })

  it('contains known avatar id doberman', () => {
    const found = ANIMAL_AVATARS.find(a => a.id === 'doberman')
    expect(found).toBeDefined()
    expect(found?.path).toBe('doberman.png')
  })

  it('contains known avatar id deer', () => {
    const found = ANIMAL_AVATARS.find(a => a.id === 'deer')
    expect(found).toBeDefined()
    expect(found?.path).toBe('deer.png')
  })
})
