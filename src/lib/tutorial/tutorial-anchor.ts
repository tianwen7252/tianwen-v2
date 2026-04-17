// ─── Validation ──────────────────────────────────────────────────────────────

/**
 * Whitelist pattern for tutorial anchor ids.
 * Allows alphanumeric characters plus `.`, `_`, `:`, and `-`.
 * Rejects empty strings, quotes, whitespace, and any other special characters.
 */
const VALID_ID_PATTERN = /^[a-zA-Z0-9._:-]+$/

/**
 * Validates a tutorial anchor id and throws if it is invalid.
 * Protects against CSS selector injection and HTML attribute injection.
 */
function assertValidId(id: string): void {
  if (!VALID_ID_PATTERN.test(id)) {
    throw new Error('Invalid tutorial anchor id')
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns a props object that sets `data-tutorial-id` on a DOM element.
 * Spread directly onto JSX elements to mark them as tutorial targets.
 *
 * @example
 * ```tsx
 * <button {...tutorialAnchor('cart-button')}>Cart</button>
 * ```
 *
 * @throws {Error} when `id` contains characters outside the allowed whitelist
 *   (`[a-zA-Z0-9._:-]`) or is empty.
 */
export function tutorialAnchor(id: string): {
  readonly 'data-tutorial-id': string
} {
  assertValidId(id)
  return { 'data-tutorial-id': id }
}

/**
 * Returns a CSS attribute selector string that matches the element with the
 * given `data-tutorial-id`.
 *
 * @example
 * ```ts
 * document.querySelector(tutorialSelector('cart-button'))
 * ```
 *
 * @throws {Error} when `id` contains characters outside the allowed whitelist
 *   (`[a-zA-Z0-9._:-]`) or is empty.
 */
export function tutorialSelector(id: string): string {
  assertValidId(id)
  return `[data-tutorial-id="${id}"]`
}
