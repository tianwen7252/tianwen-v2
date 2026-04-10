import { describe, it, expect } from 'vitest'
import type { CartItem, Discount } from '@/stores/order-store'
import { groupCartItems } from './group-cart-items'

// ─── Factories ───────────────────────────────────────────────────────────────

function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 'item-1',
    commodityId: 'com-1',
    typeId: 'bento',
    name: '雞腿飯',
    price: 100,
    quantity: 1,
    note: '',
    includesSoup: true,
    ...overrides,
  }
}

function makeDiscount(overrides: Partial<Discount> = {}): Discount {
  return {
    id: 'disc-1',
    label: '會員折扣',
    amount: 50,
    ...overrides,
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('groupCartItems', () => {
  it('should return empty array when cart is empty and no discounts', () => {
    const result = groupCartItems([], [])
    expect(result).toEqual([])
  })

  it('should group bento items with includesSoup=true under "bento" category', () => {
    const items = [
      makeCartItem({
        id: '1',
        name: '雞腿飯',
        typeId: 'bento',
        includesSoup: true,
      }),
      makeCartItem({
        id: '2',
        name: '排骨飯',
        typeId: 'bento',
        includesSoup: true,
      }),
    ]
    const result = groupCartItems(items, [])
    expect(result).toHaveLength(1)
    expect(result[0]!.key).toBe('bento')
    expect(result[0]!.label).toBe('order.categoryBento')
    expect(result[0]!.items).toHaveLength(2)
  })

  it('should group bento items with includesSoup=false under "single" category', () => {
    const items = [
      makeCartItem({
        id: '1',
        name: '加蛋',
        typeId: 'bento',
        includesSoup: false,
      }),
      makeCartItem({
        id: '2',
        name: '加菜',
        typeId: 'bento',
        includesSoup: false,
      }),
      makeCartItem({
        id: '3',
        name: '雞胸肉沙拉',
        typeId: 'bento',
        includesSoup: false,
      }),
    ]
    const result = groupCartItems(items, [])
    expect(result).toHaveLength(1)
    expect(result[0]!.key).toBe('single')
    expect(result[0]!.label).toBe('order.categorySingle')
    expect(result[0]!.items).toHaveLength(3)
  })

  it('should group typeId "single" items under "single" category', () => {
    const items = [makeCartItem({ id: '1', name: '滷蛋', typeId: 'single' })]
    const result = groupCartItems(items, [])
    expect(result).toHaveLength(1)
    expect(result[0]!.key).toBe('single')
    expect(result[0]!.label).toBe('order.categorySingle')
    expect(result[0]!.items).toHaveLength(1)
  })

  it('should group drink items under "drink" category', () => {
    const items = [
      makeCartItem({ id: '1', name: '紅茶', typeId: 'drink' }),
      makeCartItem({ id: '2', name: '奶茶', typeId: 'drink' }),
    ]
    const result = groupCartItems(items, [])
    expect(result).toHaveLength(1)
    expect(result[0]!.key).toBe('drink')
    expect(result[0]!.label).toBe('order.categoryDrink')
    expect(result[0]!.items).toHaveLength(2)
  })

  it('should group dumpling items under "dumpling" category', () => {
    const items = [
      makeCartItem({ id: '1', name: '水餃(10)', typeId: 'dumpling' }),
    ]
    const result = groupCartItems(items, [])
    expect(result).toHaveLength(1)
    expect(result[0]!.key).toBe('dumpling')
    expect(result[0]!.label).toBe('order.categoryDumpling')
    expect(result[0]!.items).toHaveLength(1)
  })

  it('should group unknown typeId under "other" category', () => {
    const items = [
      makeCartItem({ id: '1', name: '特殊商品', typeId: 'special' }),
    ]
    const result = groupCartItems(items, [])
    expect(result).toHaveLength(1)
    expect(result[0]!.key).toBe('other')
    expect(result[0]!.label).toBe('order.categoryOther')
    expect(result[0]!.items).toHaveLength(1)
  })

  it('should group discounts under "discount" category', () => {
    const discounts = [
      makeDiscount({ id: 'd1', label: '會員折扣', amount: 50 }),
      makeDiscount({ id: 'd2', label: '滿額折', amount: 30 }),
    ]
    const result = groupCartItems([], discounts)
    expect(result).toHaveLength(1)
    expect(result[0]!.key).toBe('discount')
    expect(result[0]!.label).toBe('order.categoryDiscount')
    expect(result[0]!.discounts).toHaveLength(2)
    expect(result[0]!.items).toHaveLength(0)
  })

  it('should exclude empty categories', () => {
    const items = [makeCartItem({ id: '1', name: '紅茶', typeId: 'drink' })]
    const result = groupCartItems(items, [])
    // Only drink category should appear
    expect(result).toHaveLength(1)
    expect(result[0]!.key).toBe('drink')
  })

  it('should maintain correct category order: bento -> single -> drink -> dumpling -> stall -> other -> discount', () => {
    const items = [
      makeCartItem({
        id: '1',
        name: '特殊商品',
        typeId: 'special',
        includesSoup: false,
      }), // other
      makeCartItem({
        id: '2',
        name: '紅茶',
        typeId: 'drink',
        includesSoup: false,
      }), // drink
      makeCartItem({
        id: '3',
        name: '加蛋',
        typeId: 'bento',
        includesSoup: false,
      }), // single (no soup)
      makeCartItem({
        id: '4',
        name: '雞腿飯',
        typeId: 'bento',
        includesSoup: true,
      }), // bento (has soup)
      makeCartItem({
        id: '5',
        name: '水餃(10)',
        typeId: 'dumpling',
        includesSoup: false,
      }), // dumpling
      makeCartItem({
        id: '6',
        name: '滷蛋',
        typeId: 'single',
        includesSoup: false,
      }), // single
      makeCartItem({
        id: '7',
        name: '京醬肉絲飯',
        typeId: 'stall',
        includesSoup: false,
      }), // stall
    ]
    const discounts = [
      makeDiscount({ id: 'd1', label: '會員折扣', amount: 50 }),
    ]
    const result = groupCartItems(items, discounts)
    const keys = result.map(g => g.key)
    expect(keys).toEqual([
      'bento',
      'single',
      'drink',
      'dumpling',
      'stall',
      'other',
      'discount',
    ])
  })

  it('should group stall items under "stall" category', () => {
    const items = [
      makeCartItem({
        id: '1',
        name: '京醬肉絲飯',
        typeId: 'stall',
        includesSoup: false,
      }),
    ]
    const result = groupCartItems(items, [])
    expect(result).toHaveLength(1)
    expect(result[0]!.key).toBe('stall')
    expect(result[0]!.label).toBe('order.categoryStall')
    expect(result[0]!.items).toHaveLength(1)
  })

  it('should handle mixed bento items correctly (some with includesSoup, some without)', () => {
    const items = [
      makeCartItem({
        id: '1',
        name: '雞腿飯',
        typeId: 'bento',
        includesSoup: true,
      }), // bento
      makeCartItem({
        id: '2',
        name: '加蛋',
        typeId: 'bento',
        includesSoup: false,
      }), // single
      makeCartItem({
        id: '3',
        name: '排骨飯',
        typeId: 'bento',
        includesSoup: true,
      }), // bento
      makeCartItem({
        id: '4',
        name: '雞胸肉沙拉',
        typeId: 'bento',
        includesSoup: false,
      }), // single
    ]
    const result = groupCartItems(items, [])
    expect(result).toHaveLength(2)

    const bentoGroup = result.find(g => g.key === 'bento')
    const singleGroup = result.find(g => g.key === 'single')

    expect(bentoGroup?.items).toHaveLength(2)
    expect(bentoGroup?.items[0]!.name).toBe('雞腿飯')
    expect(bentoGroup?.items[1]!.name).toBe('排骨飯')

    expect(singleGroup?.items).toHaveLength(2)
    expect(singleGroup?.items[0]!.name).toBe('加蛋')
    expect(singleGroup?.items[1]!.name).toBe('雞胸肉沙拉')
  })

  it('should combine typeId "single" and includesSoup=false bento items into same "single" group', () => {
    const items = [
      makeCartItem({
        id: '1',
        name: '加蛋',
        typeId: 'bento',
        includesSoup: false,
      }), // single (bento no soup)
      makeCartItem({
        id: '2',
        name: '滷蛋',
        typeId: 'single',
        includesSoup: false,
      }), // single (typeId)
    ]
    const result = groupCartItems(items, [])
    expect(result).toHaveLength(1)
    expect(result[0]!.key).toBe('single')
    expect(result[0]!.items).toHaveLength(2)
  })

  it('should return readonly arrays (immutability check)', () => {
    const items = [makeCartItem()]
    const discounts = [makeDiscount()]
    const result = groupCartItems(items, discounts)
    // TypeScript readonly ensures compile-time safety;
    // verify the result is a proper array at runtime
    expect(Array.isArray(result)).toBe(true)
    expect(Array.isArray(result[0]!.items)).toBe(true)
  })

  it('should use includesSoup (not name) to categorize bento items', () => {
    // A bento item with "飯" in name but includesSoup=false goes to "single"
    const items = [
      makeCartItem({
        id: '1',
        name: '特製便當(大份)飯',
        typeId: 'bento',
        includesSoup: false,
      }),
    ]
    const result = groupCartItems(items, [])
    expect(result).toHaveLength(1)
    expect(result[0]!.key).toBe('single')
    expect(result[0]!.items[0]!.name).toBe('特製便當(大份)飯')
  })

  it('should use includesSoup=true even when name does not contain "飯"', () => {
    // A bento item without "飯" in name but includesSoup=true goes to "bento"
    const items = [
      makeCartItem({
        id: '1',
        name: '特製套餐',
        typeId: 'bento',
        includesSoup: true,
      }),
    ]
    const result = groupCartItems(items, [])
    expect(result).toHaveLength(1)
    expect(result[0]!.key).toBe('bento')
    expect(result[0]!.items[0]!.name).toBe('特製套餐')
  })

  it('should not include discount group items array', () => {
    const discounts = [makeDiscount()]
    const result = groupCartItems([], discounts)
    expect(result[0]!.items).toHaveLength(0)
    expect(result[0]!.discounts).toHaveLength(1)
  })

  it('should not mutate input arrays', () => {
    const items = [
      makeCartItem({ id: '1', name: '雞腿飯', typeId: 'bento' }),
      makeCartItem({ id: '2', name: '紅茶', typeId: 'drink' }),
    ]
    const discounts = [makeDiscount()]
    const itemsCopy = [...items]
    const discountsCopy = [...discounts]

    groupCartItems(items, discounts)

    expect(items).toEqual(itemsCopy)
    expect(discounts).toEqual(discountsCopy)
  })
})
