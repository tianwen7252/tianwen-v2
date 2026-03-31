/**
 * Utility for resolving employee avatar values to full image src paths.
 * DB stores filename-only values (e.g. '1308845.png').
 * Legacy data may store full paths or HTTP URLs — these are returned as-is.
 */

const AVATAR_BASE_PATH = 'images/aminals/'

/**
 * Resolve an avatar value to a full path suitable for use as an img src.
 * - Filename only (new format): prepends AVATAR_BASE_PATH
 * - Already contains a slash (legacy full path): returned as-is
 * - HTTP/HTTPS URL: returned as-is
 * - Empty string: returned as-is
 */
export function resolveAvatarSrc(avatar: string): string {
  if (!avatar) return avatar
  if (avatar.startsWith('http') || avatar.includes('/')) return avatar
  return `${AVATAR_BASE_PATH}${avatar}`
}
