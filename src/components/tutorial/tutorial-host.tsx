import { useEffect, useState } from 'react'
import { useTutorialStore } from '@/stores/tutorial-store'
import { loadTutorial } from '@/lib/tutorial/load-tutorial'
import { logError } from '@/lib/error-logger'
import { TutorialRunner } from './tutorial-runner'
import type { TutorialDefinition } from '@/lib/tutorial/types'

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Single mount point for the tutorial system.
 * Subscribes to the tutorial store and dynamically loads the active tutorial
 * definition when one becomes active. Renders TutorialRunner once loaded.
 *
 * Story 5 (V2-243) will populate the real tutorial registry in load-tutorial.ts.
 */
export function TutorialHost() {
  const activeTutorialId = useTutorialStore(s => s.activeTutorialId)
  const [tutorial, setTutorial] = useState<TutorialDefinition | null>(null)

  useEffect(() => {
    if (!activeTutorialId) {
      setTutorial(null)
      return
    }

    let cancelled = false

    loadTutorial(activeTutorialId)
      .then(def => {
        if (!cancelled) setTutorial(def)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : String(err)
        logError(message, 'TutorialHost.loadTutorial')
      })

    return () => {
      cancelled = true
    }
  }, [activeTutorialId])

  if (!tutorial) return null
  return <TutorialRunner tutorial={tutorial} />
}
