import { describe, expect, it } from 'vitest'
import { TUTORIAL_REGISTRY, CHAPTER_TUTORIALS } from './index'
import type { TutorialDefinition } from '@/lib/tutorial/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Allows alphanumeric + dots, underscores, colons, hyphens
const VALID_TARGET_PATTERN = /^[a-zA-Z0-9._:-]+$/

// Blocklist for credential/sensitive strings that MUST NOT appear in tutorial copy
const CREDENTIAL_BLOCKLIST = /r2|bucket|access[-_ ]?key|secret/i

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

  it('contains clock-in-basics', () => {
    expect(TUTORIAL_REGISTRY['clock-in-basics']).toBeDefined()
  })

  it('contains admin-management', () => {
    expect(TUTORIAL_REGISTRY['admin-management']).toBeDefined()
  })

  it('contains cloud-backup', () => {
    expect(TUTORIAL_REGISTRY['cloud-backup']).toBeDefined()
  })

  it('contains troubleshooting', () => {
    expect(TUTORIAL_REGISTRY['troubleshooting']).toBeDefined()
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

  it('chapter 20 includes clock-in-basics', () => {
    expect(CHAPTER_TUTORIALS['20']).toContain('clock-in-basics')
  })

  it('chapter 30 includes admin-management', () => {
    expect(CHAPTER_TUTORIALS['30']).toContain('admin-management')
  })

  it('chapter 40 includes cloud-backup', () => {
    expect(CHAPTER_TUTORIALS['40']).toContain('cloud-backup')
  })

  it('chapter 90 includes troubleshooting', () => {
    expect(CHAPTER_TUTORIALS['90']).toContain('troubleshooting')
  })

  it('chapters 20, 30, 40, 90 are non-empty', () => {
    for (const id of ['20', '30', '40', '90'] as const) {
      expect(CHAPTER_TUTORIALS[id].length).toBeGreaterThan(0)
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

// ─── clock-in-basics loader ──────────────────────────────────────────────────

describe('clock-in-basics loader', () => {
  it('resolves to a valid TutorialDefinition', async () => {
    const def = await TUTORIAL_REGISTRY['clock-in-basics']!()
    assertValidDefinition(def)
  })

  it('has id "clock-in-basics"', async () => {
    const def = await TUTORIAL_REGISTRY['clock-in-basics']!()
    expect(def.id).toBe('clock-in-basics')
  })

  it('belongs to chapter 20', async () => {
    const def = await TUTORIAL_REGISTRY['clock-in-basics']!()
    expect(def.chapter).toBe('20')
  })

  it('is not adminOnly', async () => {
    const def = await TUTORIAL_REGISTRY['clock-in-basics']!()
    expect(def.adminOnly).toBe(false)
  })

  it('has at least 5 steps', async () => {
    const def = await TUTORIAL_REGISTRY['clock-in-basics']!()
    expect(def.steps.length).toBeGreaterThanOrEqual(5)
  })

  it('every step has titleKey and bodyKey', async () => {
    const def = await TUTORIAL_REGISTRY['clock-in-basics']!()
    for (const step of def.steps) {
      expect(step.titleKey.length).toBeGreaterThan(0)
      expect(step.bodyKey.length).toBeGreaterThan(0)
    }
  })

  it('every step target uses a valid id pattern when defined', async () => {
    const def = await TUTORIAL_REGISTRY['clock-in-basics']!()
    for (const step of def.steps) {
      if (step.target !== undefined) {
        expect(VALID_TARGET_PATTERN.test(step.target)).toBe(true)
      }
    }
  })

  it('every step route starts with / when defined', async () => {
    const def = await TUTORIAL_REGISTRY['clock-in-basics']!()
    for (const step of def.steps) {
      if (step.route !== undefined) {
        expect(step.route.startsWith('/')).toBe(true)
      }
    }
  })

  it('has an overview step with no target', async () => {
    const def = await TUTORIAL_REGISTRY['clock-in-basics']!()
    const overview = def.steps.find(s => s.id === 'overview')
    expect(overview).toBeDefined()
    expect(overview?.target).toBeUndefined()
  })

  it('has a done step with no target', async () => {
    const def = await TUTORIAL_REGISTRY['clock-in-basics']!()
    const done = def.steps.find(s => s.id === 'done')
    expect(done).toBeDefined()
    expect(done?.target).toBeUndefined()
  })

  it('step ids are unique within the tutorial', async () => {
    const def = await TUTORIAL_REGISTRY['clock-in-basics']!()
    const ids = def.steps.map(s => s.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })
})

// ─── admin-management loader ─────────────────────────────────────────────────

describe('admin-management loader', () => {
  it('resolves to a valid TutorialDefinition', async () => {
    const def = await TUTORIAL_REGISTRY['admin-management']!()
    assertValidDefinition(def)
  })

  it('has id "admin-management"', async () => {
    const def = await TUTORIAL_REGISTRY['admin-management']!()
    expect(def.id).toBe('admin-management')
  })

  it('belongs to chapter 30', async () => {
    const def = await TUTORIAL_REGISTRY['admin-management']!()
    expect(def.chapter).toBe('30')
  })

  it('is adminOnly', async () => {
    const def = await TUTORIAL_REGISTRY['admin-management']!()
    expect(def.adminOnly).toBe(true)
  })

  it('has at least 5 steps', async () => {
    const def = await TUTORIAL_REGISTRY['admin-management']!()
    expect(def.steps.length).toBeGreaterThanOrEqual(5)
  })

  it('every step has titleKey and bodyKey', async () => {
    const def = await TUTORIAL_REGISTRY['admin-management']!()
    for (const step of def.steps) {
      expect(step.titleKey.length).toBeGreaterThan(0)
      expect(step.bodyKey.length).toBeGreaterThan(0)
    }
  })

  it('every step target uses a valid id pattern when defined', async () => {
    const def = await TUTORIAL_REGISTRY['admin-management']!()
    for (const step of def.steps) {
      if (step.target !== undefined) {
        expect(VALID_TARGET_PATTERN.test(step.target)).toBe(true)
      }
    }
  })

  it('every step route starts with / when defined', async () => {
    const def = await TUTORIAL_REGISTRY['admin-management']!()
    for (const step of def.steps) {
      if (step.route !== undefined) {
        expect(step.route.startsWith('/')).toBe(true)
      }
    }
  })

  it('has an overview step with no target', async () => {
    const def = await TUTORIAL_REGISTRY['admin-management']!()
    const overview = def.steps.find(s => s.id === 'overview')
    expect(overview).toBeDefined()
    expect(overview?.target).toBeUndefined()
  })

  it('step ids are unique within the tutorial', async () => {
    const def = await TUTORIAL_REGISTRY['admin-management']!()
    const ids = def.steps.map(s => s.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })
})

// ─── cloud-backup loader ──────────────────────────────────────────────────────

describe('cloud-backup loader', () => {
  it('resolves to a valid TutorialDefinition', async () => {
    const def = await TUTORIAL_REGISTRY['cloud-backup']!()
    assertValidDefinition(def)
  })

  it('has id "cloud-backup"', async () => {
    const def = await TUTORIAL_REGISTRY['cloud-backup']!()
    expect(def.id).toBe('cloud-backup')
  })

  it('belongs to chapter 40', async () => {
    const def = await TUTORIAL_REGISTRY['cloud-backup']!()
    expect(def.chapter).toBe('40')
  })

  it('is adminOnly', async () => {
    const def = await TUTORIAL_REGISTRY['cloud-backup']!()
    expect(def.adminOnly).toBe(true)
  })

  it('has at least 5 steps', async () => {
    const def = await TUTORIAL_REGISTRY['cloud-backup']!()
    expect(def.steps.length).toBeGreaterThanOrEqual(5)
  })

  it('every step has titleKey and bodyKey', async () => {
    const def = await TUTORIAL_REGISTRY['cloud-backup']!()
    for (const step of def.steps) {
      expect(step.titleKey.length).toBeGreaterThan(0)
      expect(step.bodyKey.length).toBeGreaterThan(0)
    }
  })

  it('every step target uses a valid id pattern when defined', async () => {
    const def = await TUTORIAL_REGISTRY['cloud-backup']!()
    for (const step of def.steps) {
      if (step.target !== undefined) {
        expect(VALID_TARGET_PATTERN.test(step.target)).toBe(true)
      }
    }
  })

  it('every step route starts with / when defined', async () => {
    const def = await TUTORIAL_REGISTRY['cloud-backup']!()
    for (const step of def.steps) {
      if (step.route !== undefined) {
        expect(step.route.startsWith('/')).toBe(true)
      }
    }
  })

  it('has an overview step with no target', async () => {
    const def = await TUTORIAL_REGISTRY['cloud-backup']!()
    const overview = def.steps.find(s => s.id === 'overview')
    expect(overview).toBeDefined()
    expect(overview?.target).toBeUndefined()
  })

  it('step ids are unique within the tutorial', async () => {
    const def = await TUTORIAL_REGISTRY['cloud-backup']!()
    const ids = def.steps.map(s => s.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })
})

// ─── troubleshooting loader ───────────────────────────────────────────────────

describe('troubleshooting loader', () => {
  it('resolves to a valid TutorialDefinition', async () => {
    const def = await TUTORIAL_REGISTRY['troubleshooting']!()
    assertValidDefinition(def)
  })

  it('has id "troubleshooting"', async () => {
    const def = await TUTORIAL_REGISTRY['troubleshooting']!()
    expect(def.id).toBe('troubleshooting')
  })

  it('belongs to chapter 90', async () => {
    const def = await TUTORIAL_REGISTRY['troubleshooting']!()
    expect(def.chapter).toBe('90')
  })

  it('is not adminOnly', async () => {
    const def = await TUTORIAL_REGISTRY['troubleshooting']!()
    expect(def.adminOnly).toBe(false)
  })

  it('has at least 5 steps', async () => {
    const def = await TUTORIAL_REGISTRY['troubleshooting']!()
    expect(def.steps.length).toBeGreaterThanOrEqual(5)
  })

  it('every step has titleKey and bodyKey', async () => {
    const def = await TUTORIAL_REGISTRY['troubleshooting']!()
    for (const step of def.steps) {
      expect(step.titleKey.length).toBeGreaterThan(0)
      expect(step.bodyKey.length).toBeGreaterThan(0)
    }
  })

  it('all steps are centered (no target)', async () => {
    const def = await TUTORIAL_REGISTRY['troubleshooting']!()
    for (const step of def.steps) {
      expect(step.target).toBeUndefined()
    }
  })

  it('has an overview step', async () => {
    const def = await TUTORIAL_REGISTRY['troubleshooting']!()
    const overview = def.steps.find(s => s.id === 'overview')
    expect(overview).toBeDefined()
  })

  it('step ids are unique within the tutorial', async () => {
    const def = await TUTORIAL_REGISTRY['troubleshooting']!()
    const ids = def.steps.map(s => s.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })
})

// ─── adminOnly alignment ──────────────────────────────────────────────────────

describe('adminOnly alignment with chapter expectations', () => {
  it('chapter 30 tutorial is adminOnly', async () => {
    const def = await TUTORIAL_REGISTRY['admin-management']!()
    expect(def.adminOnly).toBe(true)
  })

  it('chapter 40 tutorial is adminOnly', async () => {
    const def = await TUTORIAL_REGISTRY['cloud-backup']!()
    expect(def.adminOnly).toBe(true)
  })

  it('chapter 20 tutorial is not adminOnly', async () => {
    const def = await TUTORIAL_REGISTRY['clock-in-basics']!()
    expect(def.adminOnly).toBe(false)
  })

  it('chapter 90 tutorial is not adminOnly', async () => {
    const def = await TUTORIAL_REGISTRY['troubleshooting']!()
    expect(def.adminOnly).toBe(false)
  })
})

// ─── Security: no credential strings in step bodyKeys ────────────────────────

describe('security — no credential strings in bodyKey values', () => {
  const allTutorialIds = [
    'first-setup',
    'order-basics',
    'clock-in-basics',
    'admin-management',
    'cloud-backup',
    'troubleshooting',
  ] as const

  it('no bodyKey identifier contains a credential-like value', async () => {
    for (const id of allTutorialIds) {
      const def = await TUTORIAL_REGISTRY[id]!()
      for (const step of def.steps) {
        expect(CREDENTIAL_BLOCKLIST.test(step.bodyKey)).toBe(false)
      }
    }
  })

  it('no titleKey identifier contains a credential-like value', async () => {
    for (const id of allTutorialIds) {
      const def = await TUTORIAL_REGISTRY[id]!()
      for (const step of def.steps) {
        expect(CREDENTIAL_BLOCKLIST.test(step.titleKey)).toBe(false)
      }
    }
  })

  it('no RESOLVED zh-TW title/body value contains a credential-like value', async () => {
    // Reads zh-TW.json and walks each step's resolved title/body text.
    // This is the test that actually matters — the key-name tests above are
    // a defense-in-depth layer, not the real check.
    const zhTW = (
      await import('@/locales/zh-TW.json', { with: { type: 'json' } })
    ).default as Record<string, unknown>

    function resolve(path: string): string {
      const parts = path.split('.')
      let node: unknown = zhTW
      for (const part of parts) {
        if (node && typeof node === 'object' && part in node) {
          node = (node as Record<string, unknown>)[part]
        } else {
          return ''
        }
      }
      return typeof node === 'string' ? node : ''
    }

    for (const id of allTutorialIds) {
      const def = await TUTORIAL_REGISTRY[id]!()
      for (const step of def.steps) {
        const body = resolve(step.bodyKey)
        const title = resolve(step.titleKey)
        expect(body, `${id}/${step.id} body`).not.toBe('')
        expect(title, `${id}/${step.id} title`).not.toBe('')
        expect(CREDENTIAL_BLOCKLIST.test(body)).toBe(false)
        expect(CREDENTIAL_BLOCKLIST.test(title)).toBe(false)
      }
    }
  })
})
