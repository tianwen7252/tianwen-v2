import { describe, it, expect } from 'vitest'
import type { OrderItem, OrderDiscount } from '@/lib/schemas'
import { groupOrderItems } from './group-order-items'

// ─── Factories ───────────────────────────────────────────────────────────────

function makeOrderItem(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: 'item-1',
    orderId: 'order-1',
    commodityId: 'com-1',
    name: 'Chicken Bento',
    price: 100,
    quantity: 1,
    includesSoup: true,
    createdAt: 1700000000000,
    ...overrides,
  }
}

function makeOrderDiscount(
  overrides: Partial<OrderDiscount> = {},
): OrderDiscount {
  return {
    id: 'disc-1',
    orderId: 'order-1',
    label: 'Member Discount',
    amount: 50,
    createdAt: 1700000000000,
    ...overrides,
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('groupOrderItems', () => {
  it('should return empty array when items and discounts are empty', () => {
    const typeIdMap = new Map<string, string>()
    const result = groupOrderItems([], [], typeIdMap)
    expect(result).toEqual([])
  })

  it('should group bento items with includesSoup=true under "bento" category', () => {
    const typeIdMap = new Map([
      ['com-1', 'bento'],
      ['com-2', 'bento'],
    ])
    const items = [
      makeOrderItem({
        id: 'i1',
        commodityId: 'com-1',
        name: 'Chicken Bento',
        includesSoup: true,
      }),
      makeOrderItem({
        id: 'i2',
        commodityId: 'com-2',
        name: 'Pork Bento',
        includesSoup: true,
      }),
    ]
    const result = groupOrderItems(items, [], typeIdMap)
    expect(result).toHaveLength(1)
    expect(result[0]!.key).toBe('bento')
    expect(result[0]!.label).toBe('order.categoryBento')
    expect(result[0]!.items).toHaveLength(2)
  })

  it('should group bento items with includesSoup=false under "single" category', () => {
    const typeIdMap = new Map([['com-1', 'bento']])
    const items = [
      makeOrderItem({
        id: 'i1',
        commodityId: 'com-1',
        name: 'Extra Egg',
        includesSoup: false,
      }),
    ]
    const result = groupOrderItems(items, [], typeIdMap)
    expect(result).toHaveLength(1)
    expect(result[0]!.key).toBe('single')
    expect(result[0]!.label).toBe('order.categorySingle')
    expect(result[0]!.items).toHaveLength(1)
  })

  it('should group typeId "single" items under "single" category', () => {
    const typeIdMap = new Map([['com-1', 'single']])
    const items = [
      makeOrderItem({ id: 'i1', commodityId: 'com-1', name: 'Braised Egg' }),
    ]
    const result = groupOrderItems(items, [], typeIdMap)
    expect(result).toHaveLength(1)
    expect(result[0]!.key).toBe('single')
  })

  it('should group drink items under "drink" category', () => {
    const typeIdMap = new Map([
      ['com-1', 'drink'],
      ['com-2', 'drink'],
    ])
    const items = [
      makeOrderItem({ id: 'i1', commodityId: 'com-1', name: 'Black Tea' }),
      makeOrderItem({ id: 'i2', commodityId: 'com-2', name: 'Milk Tea' }),
    ]
    const result = groupOrderItems(items, [], typeIdMap)
    expect(result).toHaveLength(1)
    expect(result[0]!.key).toBe('drink')
    expect(result[0]!.label).toBe('order.categoryDrink')
    expect(result[0]!.items).toHaveLength(2)
  })

  it('should group dumpling items under "dumpling" category', () => {
    const typeIdMap = new Map([['com-1', 'dumpling']])
    const items = [
      makeOrderItem({ id: 'i1', commodityId: 'com-1', name: 'Dumplings (10)' }),
    ]
    const result = groupOrderItems(items, [], typeIdMap)
    expect(result).toHaveLength(1)
    expect(result[0]!.key).toBe('dumpling')
    expect(result[0]!.label).toBe('order.categoryDumpling')
  })

  it('should fall back to "other" when commodityId is not found in typeIdMap', () => {
    const typeIdMap = new Map<string, string>()
    const items = [
      makeOrderItem({
        id: 'i1',
        commodityId: 'unknown-com',
        name: 'Mystery Item',
      }),
    ]
    const result = groupOrderItems(items, [], typeIdMap)
    expect(result).toHaveLength(1)
    expect(result[0]!.key).toBe('other')
    expect(result[0]!.label).toBe('order.categoryOther')
  })

  it('should fall back to "other" for unknown typeId values', () => {
    const typeIdMap = new Map([['com-1', 'special']])
    const items = [
      makeOrderItem({ id: 'i1', commodityId: 'com-1', name: 'Special Item' }),
    ]
    const result = groupOrderItems(items, [], typeIdMap)
    expect(result).toHaveLength(1)
    expect(result[0]!.key).toBe('other')
  })

  it('should include discount group only when discounts exist', () => {
    const typeIdMap = new Map<string, string>()
    const discounts = [
      makeOrderDiscount({ id: 'd1', label: 'Member Discount', amount: 50 }),
      makeOrderDiscount({
        id: 'd2',
        label: 'Full Amount Discount',
        amount: 30,
      }),
    ]
    const result = groupOrderItems([], discounts, typeIdMap)
    expect(result).toHaveLength(1)
    expect(result[0]!.key).toBe('discount')
    expect(result[0]!.label).toBe('order.categoryDiscount')
    expect(result[0]!.discounts).toHaveLength(2)
    expect(result[0]!.items).toHaveLength(0)
  })

  it('should not include discount group when discounts array is empty', () => {
    const typeIdMap = new Map([['com-1', 'drink']])
    const items = [
      makeOrderItem({ id: 'i1', commodityId: 'com-1', name: 'Tea' }),
    ]
    const result = groupOrderItems(items, [], typeIdMap)
    const discountGroup = result.find(g => g.key === 'discount')
    expect(discountGroup).toBeUndefined()
  })

  it('should maintain correct category order: bento -> single -> drink -> dumpling -> other -> discount', () => {
    const typeIdMap = new Map([
      ['com-bento', 'bento'],
      ['com-single', 'bento'],
      ['com-drink', 'drink'],
      ['com-dumpling', 'dumpling'],
      ['com-unknown', 'special'],
    ])
    const items = [
      makeOrderItem({
        id: 'i1',
        commodityId: 'com-unknown',
        name: 'Special',
        includesSoup: false,
      }),
      makeOrderItem({
        id: 'i2',
        commodityId: 'com-drink',
        name: 'Tea',
        includesSoup: false,
      }),
      makeOrderItem({
        id: 'i3',
        commodityId: 'com-single',
        name: 'Egg',
        includesSoup: false,
      }),
      makeOrderItem({
        id: 'i4',
        commodityId: 'com-bento',
        name: 'Chicken',
        includesSoup: true,
      }),
      makeOrderItem({
        id: 'i5',
        commodityId: 'com-dumpling',
        name: 'Dumplings',
        includesSoup: false,
      }),
    ]
    const discounts = [makeOrderDiscount()]
    const result = groupOrderItems(items, discounts, typeIdMap)
    const keys = result.map(g => g.key)
    expect(keys).toEqual([
      'bento',
      'single',
      'drink',
      'dumpling',
      'other',
      'discount',
    ])
  })

  it('should handle mixed bento items correctly (some with soup, some without)', () => {
    const typeIdMap = new Map([
      ['com-1', 'bento'],
      ['com-2', 'bento'],
      ['com-3', 'bento'],
      ['com-4', 'bento'],
    ])
    const items = [
      makeOrderItem({
        id: 'i1',
        commodityId: 'com-1',
        name: 'Chicken Bento',
        includesSoup: true,
      }),
      makeOrderItem({
        id: 'i2',
        commodityId: 'com-2',
        name: 'Extra Egg',
        includesSoup: false,
      }),
      makeOrderItem({
        id: 'i3',
        commodityId: 'com-3',
        name: 'Pork Bento',
        includesSoup: true,
      }),
      makeOrderItem({
        id: 'i4',
        commodityId: 'com-4',
        name: 'Salad',
        includesSoup: false,
      }),
    ]
    const result = groupOrderItems(items, [], typeIdMap)
    expect(result).toHaveLength(2)

    const bentoGroup = result.find(g => g.key === 'bento')
    const singleGroup = result.find(g => g.key === 'single')

    expect(bentoGroup?.items).toHaveLength(2)
    expect(bentoGroup?.items[0]!.name).toBe('Chicken Bento')
    expect(bentoGroup?.items[1]!.name).toBe('Pork Bento')

    expect(singleGroup?.items).toHaveLength(2)
    expect(singleGroup?.items[0]!.name).toBe('Extra Egg')
    expect(singleGroup?.items[1]!.name).toBe('Salad')
  })

  it('should exclude empty categories from results', () => {
    const typeIdMap = new Map([['com-1', 'drink']])
    const items = [
      makeOrderItem({ id: 'i1', commodityId: 'com-1', name: 'Tea' }),
    ]
    const result = groupOrderItems(items, [], typeIdMap)
    expect(result).toHaveLength(1)
    expect(result[0]!.key).toBe('drink')
  })

  it('should not mutate input arrays', () => {
    const typeIdMap = new Map([['com-1', 'bento']])
    const items = [
      makeOrderItem({
        id: 'i1',
        commodityId: 'com-1',
        name: 'Chicken',
        includesSoup: true,
      }),
    ]
    const discounts = [makeOrderDiscount()]
    const itemsCopy = [...items]
    const discountsCopy = [...discounts]

    groupOrderItems(items, discounts, typeIdMap)

    expect(items).toEqual(itemsCopy)
    expect(discounts).toEqual(discountsCopy)
  })

  it('should return readonly arrays (immutability check)', () => {
    const typeIdMap = new Map([['com-1', 'bento']])
    const items = [makeOrderItem({ commodityId: 'com-1', includesSoup: true })]
    const discounts = [makeOrderDiscount()]
    const result = groupOrderItems(items, discounts, typeIdMap)
    expect(Array.isArray(result)).toBe(true)
    expect(Array.isArray(result[0]!.items)).toBe(true)
  })

  it('should combine typeId "single" and includesSoup=false bento items into same "single" group', () => {
    const typeIdMap = new Map([
      ['com-1', 'bento'],
      ['com-2', 'single'],
    ])
    const items = [
      makeOrderItem({
        id: 'i1',
        commodityId: 'com-1',
        name: 'Extra Egg',
        includesSoup: false,
      }),
      makeOrderItem({
        id: 'i2',
        commodityId: 'com-2',
        name: 'Braised Egg',
        includesSoup: false,
      }),
    ]
    const result = groupOrderItems(items, [], typeIdMap)
    expect(result).toHaveLength(1)
    expect(result[0]!.key).toBe('single')
    expect(result[0]!.items).toHaveLength(2)
  })
})
