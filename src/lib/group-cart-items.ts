import type { CartItem, Discount } from '@/stores/order-store'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CategoryGroup {
  /** Category key identifier (e.g., 'bento', 'single', 'drink') */
  readonly key: string
  /** Display label in Traditional Chinese */
  readonly label: string
  /** Regular cart items in this category */
  readonly items: readonly CartItem[]
  /** Discount entries (only for discount group) */
  readonly discounts?: readonly Discount[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Ordered category keys for output ordering */
const CATEGORY_ORDER = [
  'bento',
  'single',
  'drink',
  'dumpling',
  'stall',
  'other',
  'discount',
] as const

/** Category key to i18n key mapping */
const CATEGORY_I18N_KEYS: Record<string, string> = {
  bento: 'order.categoryBento',
  single: 'order.categorySingle',
  drink: 'order.categoryDrink',
  dumpling: 'order.categoryDumpling',
  stall: 'order.categoryStall',
  other: 'order.categoryOther',
  discount: 'order.categoryDiscount',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Determine the category key for a cart item based on typeId and includesSoup.
 *
 * Rules:
 * - typeId 'bento' + includesSoup=true -> 'bento'
 * - typeId 'bento' + includesSoup=false -> 'single' (add-ons, non-rice bentos)
 * - typeId 'single' -> 'single'
 * - typeId 'drink' -> 'drink'
 * - typeId 'dumpling' -> 'dumpling'
 * - typeId 'stall' -> 'stall'
 * - anything else -> 'other'
 */
function getCategoryKey(item: CartItem): string {
  // Negative price items are discounts (e.g., custom discount from calculator)
  if (item.price < 0) return 'discount'
  if (item.typeId === 'bento') {
    return item.includesSoup ? 'bento' : 'single'
  }
  if (item.typeId === 'single') return 'single'
  if (item.typeId === 'drink') return 'drink'
  if (item.typeId === 'dumpling') return 'dumpling'
  if (item.typeId === 'stall') return 'stall'
  return 'other'
}

// ─── Main Function ───────────────────────────────────────────────────────────

/**
 * Group cart items by category and append discounts as a separate group.
 *
 * Category order: 餐盒 -> 單點 -> 飲料 -> 水餃 -> 攤位 -> 其它 -> 優惠
 * Empty categories are excluded from the result.
 *
 * @param items - Cart items to group
 * @param discounts - Applied discounts
 * @returns Ordered array of category groups (only non-empty)
 */
export function groupCartItems(
  items: readonly CartItem[],
  discounts: readonly Discount[],
): readonly CategoryGroup[] {
  // Build a map of category key -> items
  const itemMap = new Map<string, CartItem[]>()
  for (const item of items) {
    const key = getCategoryKey(item)
    const existing = itemMap.get(key)
    if (existing) {
      existing.push(item)
    } else {
      itemMap.set(key, [item])
    }
  }

  // Build ordered result array, skipping empty categories
  const groups: CategoryGroup[] = []

  for (const key of CATEGORY_ORDER) {
    if (key === 'discount') {
      // Include discount group if there are discounts or negative-price items
      const discountItems = itemMap.get('discount') ?? []
      if (discounts.length > 0 || discountItems.length > 0) {
        groups.push({
          key,
          label: CATEGORY_I18N_KEYS[key] ?? key,
          items: discountItems,
          discounts,
        })
      }
    } else {
      const categoryItems = itemMap.get(key)
      if (categoryItems && categoryItems.length > 0) {
        groups.push({
          key,
          label: CATEGORY_I18N_KEYS[key] ?? key,
          items: categoryItems,
        })
      }
    }
  }

  return groups
}
