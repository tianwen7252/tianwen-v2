import type { OrderItem, OrderDiscount } from '@/lib/schemas'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OrderItemCategoryGroup {
  /** Category key identifier (e.g., 'bento', 'single', 'drink') */
  readonly key: string
  /** i18n label key for the category */
  readonly label: string
  /** Regular order items in this category */
  readonly items: readonly OrderItem[]
  /** Discount entries (only for discount group) */
  readonly discounts?: readonly OrderDiscount[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Ordered category keys for output ordering */
const CATEGORY_ORDER = [
  'bento',
  'single',
  'drink',
  'dumpling',
  'other',
  'discount',
] as const

/** Category key to i18n key mapping */
const CATEGORY_I18N_KEYS: Record<string, string> = {
  bento: 'order.categoryBento',
  single: 'order.categorySingle',
  drink: 'order.categoryDrink',
  dumpling: 'order.categoryDumpling',
  other: 'order.categoryOther',
  discount: 'order.categoryDiscount',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Determine the category key for an order item by looking up its typeId
 * from the commodityId -> typeId map.
 *
 * Rules:
 * - typeId 'bento' + includesSoup=true -> 'bento'
 * - typeId 'bento' + includesSoup=false -> 'single'
 * - typeId 'single' -> 'single'
 * - typeId 'drink' -> 'drink'
 * - typeId 'dumpling' -> 'dumpling'
 * - anything else (including missing) -> 'other'
 */
function getCategoryKey(
  item: OrderItem,
  typeIdMap: ReadonlyMap<string, string>,
): string {
  // Negative price items are discounts (e.g., custom discount from calculator)
  if (item.price < 0) return 'discount'
  const typeId = typeIdMap.get(item.commodityId)
  if (typeId === undefined) return 'other'
  if (typeId === 'bento') {
    return item.includesSoup ? 'bento' : 'single'
  }
  if (typeId === 'single') return 'single'
  if (typeId === 'drink') return 'drink'
  if (typeId === 'dumpling') return 'dumpling'
  return 'other'
}

// ─── Main Function ───────────────────────────────────────────────────────────

/**
 * Group order items by category using a commodityId -> typeId lookup map.
 * Falls back to 'other' when commodity not found in map.
 *
 * Category order: bento -> single -> drink -> dumpling -> other -> discount
 * Empty categories are excluded from the result.
 *
 * @param items - Order items to group
 * @param discounts - Applied discounts
 * @param typeIdMap - Map from commodityId to typeId
 * @returns Ordered array of category groups (only non-empty)
 */
export function groupOrderItems(
  items: readonly OrderItem[],
  discounts: readonly OrderDiscount[],
  typeIdMap: ReadonlyMap<string, string>,
): readonly OrderItemCategoryGroup[] {
  // Build a map of category key -> items
  const itemMap = new Map<string, OrderItem[]>()
  for (const item of items) {
    const key = getCategoryKey(item, typeIdMap)
    const existing = itemMap.get(key)
    if (existing) {
      existing.push(item)
    } else {
      itemMap.set(key, [item])
    }
  }

  // Build ordered result array, skipping empty categories
  const groups: OrderItemCategoryGroup[] = []

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
