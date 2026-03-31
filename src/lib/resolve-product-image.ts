/**
 * Utility for resolving commodity image keys to full URL paths.
 * DB stores short image keys (e.g. 'braised-pork-belly-rice').
 * Legacy data may store full paths starting with 'images/'.
 */

const COMMODITY_IMAGE_BASE = 'images/commodities'

/**
 * Resolve a short image key to a full path suitable for use as an img src.
 * Returns undefined when key is absent or empty.
 * Legacy full-path strings (starting with 'images/') are returned unchanged
 * for backward compatibility with existing DB records.
 */
export function resolveProductImage(key?: string): string | undefined {
  if (!key) return undefined
  if (key.startsWith('images/')) return key
  return `${COMMODITY_IMAGE_BASE}/${key}.png`
}
