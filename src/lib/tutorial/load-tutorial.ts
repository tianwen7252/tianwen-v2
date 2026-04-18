import type { TutorialDefinition } from './types'

/**
 * Loads a tutorial definition by id.
 *
 * Story 5 (V2-243) will expand this registry with real tutorial definitions.
 * Until then, all ids resolve to an error.
 */
export async function loadTutorial(id: string): Promise<TutorialDefinition> {
  throw new Error(
    `Tutorial '${id}' not found (registry will be populated in V2-243)`,
  )
}
