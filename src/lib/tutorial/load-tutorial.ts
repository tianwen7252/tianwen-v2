import { TUTORIAL_REGISTRY } from './definitions'
import type { TutorialDefinition } from './types'

/**
 * Loads a tutorial definition by id.
 * Each definition module is loaded lazily (code-split).
 *
 * @throws {Error} when the id is not found in the registry.
 */
export async function loadTutorial(id: string): Promise<TutorialDefinition> {
  const loader = TUTORIAL_REGISTRY[id]
  if (!loader) {
    throw new Error(`Tutorial '${id}' not found in registry`)
  }
  return loader()
}
