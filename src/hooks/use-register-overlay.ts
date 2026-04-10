import { useEffect } from 'react'
import { useInitStore, type OverlayKind } from '@/stores/init-store'

/**
 * Self-register an overlay with the init store so that AppHeader
 * can react to its presence, regardless of who rendered the overlay.
 */
export function useRegisterOverlay(kind: OverlayKind): void {
  useEffect(() => {
    useInitStore.getState().pushActiveOverlay(kind)
    return () => {
      useInitStore.getState().popActiveOverlay(kind)
    }
  }, [kind])
}
