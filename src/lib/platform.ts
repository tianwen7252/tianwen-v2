/** Detect iPad platform (modern iPads report as "Macintosh" but have touch support) */
export function isIPad(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    navigator.maxTouchPoints > 1 &&
    /Macintosh/.test(navigator.userAgent)
  )
}
