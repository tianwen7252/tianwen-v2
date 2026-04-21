import { describe, expect, it } from 'vitest'
import { loadTutorial } from './load-tutorial'
import { TUTORIAL_REGISTRY } from './definitions'

describe('loadTutorial', () => {
  it('throws for any unknown tutorial id', async () => {
    await expect(loadTutorial('nonexistent')).rejects.toThrow()
  })

  it('error message includes the requested id', async () => {
    await expect(loadTutorial('my-tutorial-id')).rejects.toThrow(
      'my-tutorial-id',
    )
  })

  it('resolves first-setup tutorial', async () => {
    const def = await loadTutorial('first-setup')
    expect(def.id).toBe('first-setup')
    expect(def.chapter).toBe('00')
  })

  it('resolves order-basics tutorial', async () => {
    const def = await loadTutorial('order-basics')
    expect(def.id).toBe('order-basics')
    expect(def.chapter).toBe('10')
  })

  it('registry has no duplicate ids', () => {
    const keys = Object.keys(TUTORIAL_REGISTRY)
    const unique = new Set(keys)
    expect(unique.size).toBe(keys.length)
  })

  it('throws with id in message for unknown tutorial', async () => {
    const id = 'does-not-exist-xyz'
    await expect(loadTutorial(id)).rejects.toThrow(id)
  })
})
