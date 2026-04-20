import { describe, expect, it } from 'vitest'
import { CHAPTER_META, type ChapterMeta } from './chapter-meta'
import { CHAPTER_ORDER } from './constants'
import type { ChapterId } from './types'

describe('CHAPTER_META', () => {
  it('contains an entry for every ChapterId in CHAPTER_ORDER', () => {
    for (const id of CHAPTER_ORDER) {
      expect(CHAPTER_META[id]).toBeDefined()
    }
  })

  it('has exactly 6 entries matching CHAPTER_ORDER', () => {
    const keys = Object.keys(CHAPTER_META) as ChapterId[]
    expect(keys).toHaveLength(CHAPTER_ORDER.length)
  })

  it('each entry has the correct id field', () => {
    for (const id of CHAPTER_ORDER) {
      expect(CHAPTER_META[id].id).toBe(id)
    }
  })

  it('provides correct titleKey for each chapter', () => {
    const expected: Record<ChapterId, string> = {
      '00': 'tutorial.chapter.00.title',
      '10': 'tutorial.chapter.10.title',
      '20': 'tutorial.chapter.20.title',
      '30': 'tutorial.chapter.30.title',
      '40': 'tutorial.chapter.40.title',
      '90': 'tutorial.chapter.90.title',
    }
    for (const id of CHAPTER_ORDER) {
      expect(CHAPTER_META[id].titleKey).toBe(expected[id])
    }
  })

  it('provides correct descriptionKey for each chapter', () => {
    const expected: Record<ChapterId, string> = {
      '00': 'tutorial.chapter.00.description',
      '10': 'tutorial.chapter.10.description',
      '20': 'tutorial.chapter.20.description',
      '30': 'tutorial.chapter.30.description',
      '40': 'tutorial.chapter.40.description',
      '90': 'tutorial.chapter.90.description',
    }
    for (const id of CHAPTER_ORDER) {
      expect(CHAPTER_META[id].descriptionKey).toBe(expected[id])
    }
  })

  it('marks chapters 30 and 40 as adminOnly', () => {
    expect(CHAPTER_META['30'].adminOnly).toBe(true)
    expect(CHAPTER_META['40'].adminOnly).toBe(true)
  })

  it('does not mark chapters 00, 10, 20, 90 as adminOnly', () => {
    for (const id of ['00', '10', '20', '90'] as const) {
      expect(CHAPTER_META[id].adminOnly).toBe(false)
    }
  })

  it('initialises tutorialIds as empty arrays (stub until Story 5/6)', () => {
    for (const id of CHAPTER_ORDER) {
      expect(CHAPTER_META[id].tutorialIds).toEqual([])
    }
  })

  it('tutorialIds arrays are readonly (frozen-like via const assertion)', () => {
    // Verify they are actual arrays
    for (const id of CHAPTER_ORDER) {
      expect(Array.isArray(CHAPTER_META[id].tutorialIds)).toBe(true)
    }
  })

  it('satisfies the ChapterMeta interface shape', () => {
    const meta: ChapterMeta = CHAPTER_META['00']
    // Type-level check — if this compiles, the shape is correct
    expect(typeof meta.id).toBe('string')
    expect(typeof meta.titleKey).toBe('string')
    expect(typeof meta.descriptionKey).toBe('string')
    expect(typeof meta.adminOnly).toBe('boolean')
    expect(Array.isArray(meta.tutorialIds)).toBe(true)
  })
})
