import { useTutorialStore } from '@/stores/tutorial-store'

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Returns the dismissed state and a dismiss callback for a single coachmark.
 *
 * `dismissed` is true if the user has already interacted with this coachmark
 * at least once. The value persists across remounts because it lives in the
 * zustand `tutorial-store` (which is backed by localStorage via persist
 * middleware).
 *
 * `dismiss()` is idempotent — calling it multiple times is safe.
 *
 * @example
 * ```tsx
 * const { dismissed, dismiss } = useCoachmarkDismiss('coachmark.recentOrders.swipeToEdit')
 * if (dismissed) return null
 * ```
 */
export function useCoachmarkDismiss(id: string): {
  readonly dismissed: boolean
  readonly dismiss: () => void
} {
  const dismissed = useTutorialStore(s => s.coachmarkDismissed[id]) === true

  const dismiss = () => {
    useTutorialStore.getState().dismissCoachmark(id)
  }

  return { dismissed, dismiss }
}
