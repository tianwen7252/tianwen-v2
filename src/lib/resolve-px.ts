/** Viewport dimensions for resolving relative CSS units */
interface Viewport {
  readonly width: number
  readonly height: number
}

/**
 * Convert a CSS size value to a numeric px value.
 * Supports: number (passthrough), 'Xvw', 'Xvh', 'Xpx', bare numeric string.
 * Returns 0 for unrecognized strings.
 */
export function resolvePx(value: number | string, viewport: Viewport): number {
  if (typeof value === 'number') return value

  const str = value.trim().toLowerCase()
  if (str.endsWith('vw')) {
    return Math.floor((viewport.width * parseFloat(str)) / 100)
  }
  if (str.endsWith('vh')) {
    return Math.floor((viewport.height * parseFloat(str)) / 100)
  }
  if (str.endsWith('px')) {
    return parseFloat(str)
  }

  return parseFloat(str) || 0
}
