import { describe, expect, it } from 'vitest'
import { TUTORIAL_REGISTRY, CHAPTER_TUTORIALS } from './index'
import type { TutorialDefinition } from '@/lib/tutorial/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Allows alphanumeric + dots, underscores, colons, hyphens
const VALID_TARGET_PATTERN = /^[a-zA-Z0-9._:-]+$/

function assertValidDefinition(def: TutorialDefinition): void {
  expect(typeof def.id).toBe('string')
  expect(def.id.length).toBeGreaterThan(0)
  expect(typeof def.chapter).toBe('string')
  expect(typeof def.titleKey).toBe('string')
  expect(def.titleKey.length).toBeGreaterThan(0)
  expect(typeof def.descriptionKey).toBe('string')
  expect(def.descriptionKey.length).toBeGreaterThan(0)
  expect(typeof def.adminOnly).toBe('boolean')
  expect(typeof def.estimatedSeconds).toBe('number')
  expect(def.estimatedSeconds).toBeGreaterThan(0)
  expect(Array.isArray(def.steps)).toBe(true)
  expect(def.steps.length).toBeGreaterThan(0)
}

// ─── Registry shape ──────────────────────────────────────────────────────────

describe('TUTORIAL_REGISTRY', () => {
  it('contains first-setup', () => {
    expect(TUTORIAL_REGISTRY['first-setup']).toBeDefined()
  })

  it('contains order-basics', () => {
    expect(TUTORIAL_REGISTRY['order-basics']).toBeDefined()
  })

  it('all loaders are functions', () => {
    for (const [, loader] of Object.entries(TUTORIAL_REGISTRY)) {
      expect(typeof loader).toBe('function')
    }
  })

  it('has no duplicate ids across registry keys', () => {
    const keys = Object.keys(TUTORIAL_REGISTRY)
    const unique = new Set(keys)
    expect(unique.size).toBe(keys.length)
  })
})

// ─── CHAPTER_TUTORIALS ───────────────────────────────────────────────────────

describe('CHAPTER_TUTORIALS', () => {
  it('chapter 00 includes first-setup', () => {
    expect(CHAPTER_TUTORIALS['00']).toContain('first-setup')
  })

  it('chapter 10 includes order-basics', () => {
    expect(CHAPTER_TUTORIALS['10']).toContain('order-basics')
  })

  it('chapters 20, 30, 40, 90 are empty', () => {
    for (const id of ['20', '30', '40', '90'] as const) {
      expect(CHAPTER_TUTORIALS[id]).toHaveLength(0)
    }
  })

  it('every id in CHAPTER_TUTORIALS exists in TUTORIAL_REGISTRY', () => {
    for (const ids of Object.values(CHAPTER_TUTORIALS)) {
      for (const id of ids) {
        expect(TUTORIAL_REGISTRY[id]).toBeDefined()
      }
    }
  })
})

// ─── first-setup loader ───────────────────────────────────────────────────────

describe('first-setup loader', () => {
  it('resolves to a valid TutorialDefinition', async () => {
    const def = await TUTORIAL_REGISTRY['first-setup']!()
    assertValidDefinition(def)
  })

  it('has id "first-setup"', async () => {
    const def = await TUTORIAL_REGISTRY['first-setup']!()
    expect(def.id).toBe('first-setup')
  })

  it('belongs to chapter 00', async () => {
    const def = await TUTORIAL_REGISTRY['first-setup']!()
    expect(def.chapter).toBe('00')
  })

  it('is not adminOnly', async () => {
    const def = await TUTORIAL_REGISTRY['first-setup']!()
    expect(def.adminOnly).toBe(false)
  })

  it('has at least 5 steps', async () => {
    const def = await TUTORIAL_REGISTRY['first-setup']!()
    expect(def.steps.length).toBeGreaterThanOrEqual(5)
  })

  it('every step has titleKey and bodyKey', async () => {
    const def = await TUTORIAL_REGISTRY['first-setup']!()
    for (const step of def.steps) {
      expect(step.titleKey.length).toBeGreaterThan(0)
      expect(step.bodyKey.length).toBeGreaterThan(0)
    }
  })

  it('every step target uses a valid id pattern when defined', async () => {
    const def = await TUTORIAL_REGISTRY['first-setup']!()
    for (const step of def.steps) {
      if (step.target !== undefined) {
        expect(VALID_TARGET_PATTERN.test(step.target)).toBe(true)
      }
    }
  })

  it('every step route starts with / when defined', async () => {
    const def = await TUTORIAL_REGISTRY['first-setup']!()
    for (const step of def.steps) {
      if (step.route !== undefined) {
        expect(step.route.startsWith('/')).toBe(true)
      }
    }
  })

  it('every docsAnchor contains .md when defined', async () => {
    const def = await TUTORIAL_REGISTRY['first-setup']!()
    for (const step of def.steps) {
      if (step.docsAnchor !== undefined) {
        expect(step.docsAnchor).toMatch(/\.md/)
      }
    }
  })

  it('has a welcome step with no target', async () => {
    const def = await TUTORIAL_REGISTRY['first-setup']!()
    const welcome = def.steps.find(s => s.id === 'welcome')
    expect(welcome).toBeDefined()
    expect(welcome?.target).toBeUndefined()
  })

  it('has a done step with no target', async () => {
    const def = await TUTORIAL_REGISTRY['first-setup']!()
    const done = def.steps.find(s => s.id === 'done')
    expect(done).toBeDefined()
    expect(done?.target).toBeUndefined()
  })

  it('step ids are unique within the tutorial', async () => {
    const def = await TUTORIAL_REGISTRY['first-setup']!()
    const ids = def.steps.map(s => s.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })
})

// ─── order-basics loader ─────────────────────────────────────────────────────

describe('order-basics loader', () => {
  it('resolves to a valid TutorialDefinition', async () => {
    const def = await TUTORIAL_REGISTRY['order-basics']!()
    assertValidDefinition(def)
  })

  it('has id "order-basics"', async () => {
    const def = await TUTORIAL_REGISTRY['order-basics']!()
    expect(def.id).toBe('order-basics')
  })

  it('belongs to chapter 10', async () => {
    const def = await TUTORIAL_REGISTRY['order-basics']!()
    expect(def.chapter).toBe('10')
  })

  it('is not adminOnly', async () => {
    const def = await TUTORIAL_REGISTRY['order-basics']!()
    expect(def.adminOnly).toBe(false)
  })

  it('has at least 8 steps', async () => {
    const def = await TUTORIAL_REGISTRY['order-basics']!()
    expect(def.steps.length).toBeGreaterThanOrEqual(8)
  })

  it('every step has titleKey and bodyKey', async () => {
    const def = await TUTORIAL_REGISTRY['order-basics']!()
    for (const step of def.steps) {
      expect(step.titleKey.length).toBeGreaterThan(0)
      expect(step.bodyKey.length).toBeGreaterThan(0)
    }
  })

  it('every step target uses a valid id pattern when defined', async () => {
    const def = await TUTORIAL_REGISTRY['order-basics']!()
    for (const step of def.steps) {
      if (step.target !== undefined) {
        expect(VALID_TARGET_PATTERN.test(step.target)).toBe(true)
      }
    }
  })

  it('every step route starts with / when defined', async () => {
    const def = await TUTORIAL_REGISTRY['order-basics']!()
    for (const step of def.steps) {
      if (step.route !== undefined) {
        expect(step.route.startsWith('/')).toBe(true)
      }
    }
  })

  it('every docsAnchor contains .md when defined', async () => {
    const def = await TUTORIAL_REGISTRY['order-basics']!()
    for (const step of def.steps) {
      if (step.docsAnchor !== undefined) {
        expect(step.docsAnchor).toMatch(/\.md/)
      }
    }
  })

  it('has an overview step with no target', async () => {
    const def = await TUTORIAL_REGISTRY['order-basics']!()
    const overview = def.steps.find(s => s.id === 'overview')
    expect(overview).toBeDefined()
    expect(overview?.target).toBeUndefined()
  })

  it('has a done step with no target', async () => {
    const def = await TUTORIAL_REGISTRY['order-basics']!()
    const done = def.steps.find(s => s.id === 'done')
    expect(done).toBeDefined()
    expect(done?.target).toBeUndefined()
  })

  it('step ids are unique within the tutorial', async () => {
    const def = await TUTORIAL_REGISTRY['order-basics']!()
    const ids = def.steps.map(s => s.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('all steps with route use /', async () => {
    const def = await TUTORIAL_REGISTRY['order-basics']!()
    for (const step of def.steps) {
      if (step.route !== undefined) {
        expect(step.route).toBe('/')
      }
    }
  })
})
