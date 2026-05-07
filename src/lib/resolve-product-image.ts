/**
 * Utility for resolving commodity image keys to full URL paths.
 * DB stores short image keys (e.g. 'braised-pork-belly-rice').
 * Legacy data may store full paths starting with 'images/'.
 *
 * The resolver always returns an *absolute* path so it renders
 * correctly under any router path (e.g. /settings/product-management),
 * not just at the site root. We prefix with Vite's configured
 * BASE_URL so a non-root deploy base (`/myapp/`) keeps working too.
 */

// Vite injects BASE_URL with a trailing slash (defaults to '/').
const BASE_URL: string = import.meta.env.BASE_URL ?? '/'

const COMMODITY_IMAGE_DIR = 'images/commodities'

/**
 * Resolve a short image key to an absolute URL suitable for use as
 * an img src. Returns undefined when key is absent or empty.
 * Legacy values that start with 'images/' are accepted and rebased
 * onto BASE_URL for backward compatibility.
 */
export function resolveProductImage(key?: string): string | undefined {
  if (!key) return undefined
  // Absolute URLs and data URIs pass through untouched.
  if (
    key.startsWith('http://') ||
    key.startsWith('https://') ||
    key.startsWith('data:') ||
    key.startsWith('/')
  ) {
    return key
  }
  // Legacy stored paths kept their `images/...` prefix; rebase them
  // onto BASE_URL so they resolve from the site root regardless of
  // the current router path.
  if (key.startsWith('images/')) {
    return `${BASE_URL}${key}`
  }
  return `${BASE_URL}${COMMODITY_IMAGE_DIR}/${key}.png`
}
