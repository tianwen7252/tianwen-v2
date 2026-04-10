// ─── Types ───────────────────────────────────────────────────────────────────

export interface CategoryAccentStyle {
  readonly border: string
  readonly text: string
}

// ─── Constants ──────────────────────────────────────────────────────────────

/** Border and text color classes keyed by category identifier. */
export const CATEGORY_ACCENT: Readonly<Record<string, CategoryAccentStyle>> = {
  bento: { border: 'border-l-[#7f956a]', text: 'text-[#7f956a]' },
  single: { border: 'border-l-[#d4a76a]', text: 'text-[#d4a76a]' },
  drink: { border: 'border-l-[#6aa3d4]', text: 'text-[#6aa3d4]' },
  dumpling: { border: 'border-l-[#c47fd4]', text: 'text-[#c47fd4]' },
  stall: {
    border: 'border-l-(--color-regal-navy)',
    text: 'text-(--color-regal-navy)',
  },
  other: { border: 'border-l-gray-400', text: 'text-gray-400' },
  discount: { border: 'border-l-[#e57373]', text: 'text-[#e57373]' },
}

/** Fallback accent style for unknown categories. */
export const DEFAULT_ACCENT: Readonly<CategoryAccentStyle> = {
  border: 'border-l-gray-300',
  text: 'text-gray-400',
}
