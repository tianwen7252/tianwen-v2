import { useQuery } from '@tanstack/react-query'

/**
 * Build-time version fallback, injected from package.json via Vite `define`.
 */
declare const __APP_VERSION__: string

export const BUILD_VERSION: string =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

/**
 * In dev: returns the build-time version from package.json (instant).
 * In production: fetches /manifest.json to get the currently deployed version,
 * since release-please updates manifest.json AFTER the initial build.
 * Uses TanStack Query for caching — won't re-fetch until stale.
 */
export function useAppVersion(): string {
  const { data } = useQuery({
    queryKey: ['manifest-version'],
    queryFn: async () => {
      const res = await fetch('/manifest.json')
      const json = (await res.json()) as { version?: string }
      return json.version ?? BUILD_VERSION
    },
    enabled: !import.meta.env.DEV,
    staleTime: Infinity,
  })

  return data ?? BUILD_VERSION
}
