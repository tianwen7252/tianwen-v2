import { describe, expect, it } from 'vitest'
import { loadTutorial } from './load-tutorial'

describe('loadTutorial', () => {
  it('throws for any unknown tutorial id', async () => {
    await expect(loadTutorial('nonexistent')).rejects.toThrow()
  })

  it('error message includes the requested id', async () => {
    await expect(loadTutorial('my-tutorial-id')).rejects.toThrow(
      'my-tutorial-id',
    )
  })

  it('error message mentions the registry (V2-243)', async () => {
    await expect(loadTutorial('anything')).rejects.toThrow('V2-243')
  })
})
