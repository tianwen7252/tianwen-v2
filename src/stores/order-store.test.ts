import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useOrderStore } from './order-store'
import type { OrderRepository } from '@/lib/repositories/order-repository'
import type { Order } from '@/lib/schemas'

// Mock the repository provider
vi.mock('@/lib/repositories/provider', () => ({
  getOrderRepo: vi.fn(),
}))

// Import after mock declaration so the mock is applied
import { getOrderRepo } from '@/lib/repositories/provider'
const mockedGetOrderRepo = vi.mocked(getOrderRepo)

/**
 * Helper to create a mock OrderRepository with default stubs.
 */
function createMockOrderRepo(
  overrides?: Partial<OrderRepository>,
): OrderRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByDateRange: vi.fn(),
    create: vi.fn().mockResolvedValue({
      id: 'order-1',
      number: 1,
      memo: [],
      soups: 0,
      total: 0,
      editor: '',
      items: [],
      discounts: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } satisfies Order),
    update: vi.fn(),
    getNextOrderNumber: vi.fn().mockResolvedValue(1),
    remove: vi.fn().mockResolvedValue(true),
    ...overrides,
  }
}

describe('useOrderStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useOrderStore.setState({
      operatorId: null,
      operatorName: null,
      items: [],
      discounts: [],
      submitSeq: 0,
    })
    vi.clearAllMocks()
  })

  // ─── Initial State ──────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('should have null operator by default', () => {
      const state = useOrderStore.getState()
      expect(state.operatorId).toBeNull()
      expect(state.operatorName).toBeNull()
    })

    it('should have empty items by default', () => {
      const state = useOrderStore.getState()
      expect(state.items).toEqual([])
    })

    it('should have empty discounts by default', () => {
      const state = useOrderStore.getState()
      expect(state.discounts).toEqual([])
    })

    it('should have submitSeq at 0 by default', () => {
      const state = useOrderStore.getState()
      expect(state.submitSeq).toBe(0)
    })
  })

  // ─── setOperator ────────────────────────────────────────────────────────────

  describe('setOperator', () => {
    it('should set operator id and name', () => {
      useOrderStore.getState().setOperator('emp-001', 'Alice')
      const state = useOrderStore.getState()
      expect(state.operatorId).toBe('emp-001')
      expect(state.operatorName).toBe('Alice')
    })

    it('should clear operator when null is passed', () => {
      useOrderStore.getState().setOperator('emp-001', 'Alice')
      useOrderStore.getState().setOperator(null, null)
      const state = useOrderStore.getState()
      expect(state.operatorId).toBeNull()
      expect(state.operatorName).toBeNull()
    })
  })

  // ─── addItem ────────────────────────────────────────────────────────────────

  describe('addItem', () => {
    it('should add a new item with quantity 1 and empty note', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      const { items } = useOrderStore.getState()
      expect(items).toHaveLength(1)
      expect(items[0]).toMatchObject({
        commodityId: 'com-1',
        name: 'Fried Rice',
        price: 100,
        quantity: 1,
        note: '',
      })
      // Cart item should have a unique id
      expect(items[0]!.id).toBeDefined()
      expect(typeof items[0]!.id).toBe('string')
      expect(items[0]!.id.length).toBeGreaterThan(0)
    })

    it('should increment quantity when adding duplicate commodity', () => {
      const store = useOrderStore.getState()
      store.addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      const { items } = useOrderStore.getState()
      expect(items).toHaveLength(1)
      expect(items[0]!.quantity).toBe(2)
    })

    it('should add separate items for different commodities', () => {
      const store = useOrderStore.getState()
      store.addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      useOrderStore.getState().addItem({
        id: 'com-2',
        name: 'Noodles',
        price: 80,
        typeId: 'food',
        includesSoup: false,
      })
      const { items } = useOrderStore.getState()
      expect(items).toHaveLength(2)
      expect(items[0]!.commodityId).toBe('com-1')
      expect(items[1]!.commodityId).toBe('com-2')
    })

    it('should store typeId on new cart item', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: '排骨飯',
        price: 100,
        typeId: 'bento',
        includesSoup: true,
      })
      const { items } = useOrderStore.getState()
      expect(items[0]!.typeId).toBe('bento')
    })

    it('should store includesSoup on new cart item', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: '排骨飯',
        price: 100,
        typeId: 'bento',
        includesSoup: true,
      })
      const { items } = useOrderStore.getState()
      expect(items[0]!.includesSoup).toBe(true)
    })

    it('should store includesSoup=false on cart item without soup', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: '加蛋',
        price: 15,
        typeId: 'bento',
        includesSoup: false,
      })
      const { items } = useOrderStore.getState()
      expect(items[0]!.includesSoup).toBe(false)
    })

    it('should preserve typeId when incrementing quantity for duplicate commodity', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: '排骨飯',
        price: 100,
        typeId: 'bento',
        includesSoup: true,
      })
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: '排骨飯',
        price: 100,
        typeId: 'bento',
        includesSoup: true,
      })
      const { items } = useOrderStore.getState()
      expect(items).toHaveLength(1)
      expect(items[0]!.typeId).toBe('bento')
      expect(items[0]!.quantity).toBe(2)
    })

    it('should store different typeIds for different commodities', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: '排骨飯',
        price: 100,
        typeId: 'bento',
        includesSoup: true,
      })
      useOrderStore.getState().addItem({
        id: 'com-2',
        name: '珍奶',
        price: 60,
        typeId: 'drink',
        includesSoup: false,
      })
      const { items } = useOrderStore.getState()
      expect(items[0]!.typeId).toBe('bento')
      expect(items[1]!.typeId).toBe('drink')
    })

    it('should not mutate the original items array', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'bento',
        includesSoup: true,
      })
      const itemsBefore = useOrderStore.getState().items
      useOrderStore.getState().addItem({
        id: 'com-2',
        name: 'Noodles',
        price: 80,
        typeId: 'noodle',
        includesSoup: false,
      })
      const itemsAfter = useOrderStore.getState().items
      // Should be a different array reference (immutable)
      expect(itemsBefore).not.toBe(itemsAfter)
    })
  })

  // ─── removeItem ─────────────────────────────────────────────────────────────

  describe('removeItem', () => {
    it('should remove item by cart item id', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      const cartItemId = useOrderStore.getState().items[0]!.id
      useOrderStore.getState().removeItem(cartItemId)
      expect(useOrderStore.getState().items).toHaveLength(0)
    })

    it('should not affect other items when removing one', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      useOrderStore.getState().addItem({
        id: 'com-2',
        name: 'Noodles',
        price: 80,
        typeId: 'food',
        includesSoup: false,
      })
      const firstItemId = useOrderStore.getState().items[0]!.id
      useOrderStore.getState().removeItem(firstItemId)
      const { items } = useOrderStore.getState()
      expect(items).toHaveLength(1)
      expect(items[0]!.commodityId).toBe('com-2')
    })

    it('should do nothing if cart item id does not exist', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      useOrderStore.getState().removeItem('non-existent-id')
      expect(useOrderStore.getState().items).toHaveLength(1)
    })
  })

  // ─── updateQuantity ─────────────────────────────────────────────────────────

  describe('updateQuantity', () => {
    it('should update quantity for a cart item', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      const cartItemId = useOrderStore.getState().items[0]!.id
      useOrderStore.getState().updateQuantity(cartItemId, 5)
      expect(useOrderStore.getState().items[0]!.quantity).toBe(5)
    })

    it('should remove item when quantity is set to 0', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      const cartItemId = useOrderStore.getState().items[0]!.id
      useOrderStore.getState().updateQuantity(cartItemId, 0)
      expect(useOrderStore.getState().items).toHaveLength(0)
    })

    it('should remove item when quantity is negative', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      const cartItemId = useOrderStore.getState().items[0]!.id
      useOrderStore.getState().updateQuantity(cartItemId, -1)
      expect(useOrderStore.getState().items).toHaveLength(0)
    })

    it('should not mutate items when updating quantity', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      const itemsBefore = useOrderStore.getState().items
      const cartItemId = itemsBefore[0]!.id
      useOrderStore.getState().updateQuantity(cartItemId, 3)
      const itemsAfter = useOrderStore.getState().items
      expect(itemsBefore).not.toBe(itemsAfter)
      // Original item object should not be mutated
      expect(itemsBefore[0]!.quantity).toBe(1)
    })
  })

  // ─── updateNote ─────────────────────────────────────────────────────────────

  describe('updateNote', () => {
    it('should update note for a cart item', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      const cartItemId = useOrderStore.getState().items[0]!.id
      useOrderStore.getState().updateNote(cartItemId, 'No egg')
      expect(useOrderStore.getState().items[0]!.note).toBe('No egg')
    })

    it('should clear note when empty string is passed', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      const cartItemId = useOrderStore.getState().items[0]!.id
      useOrderStore.getState().updateNote(cartItemId, 'No egg')
      useOrderStore.getState().updateNote(cartItemId, '')
      expect(useOrderStore.getState().items[0]!.note).toBe('')
    })

    it('should not mutate items when updating note', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      const itemsBefore = useOrderStore.getState().items
      const cartItemId = itemsBefore[0]!.id
      useOrderStore.getState().updateNote(cartItemId, 'Extra spicy')
      const itemsAfter = useOrderStore.getState().items
      expect(itemsBefore).not.toBe(itemsAfter)
      expect(itemsBefore[0]!.note).toBe('')
    })

    it('should handle Unicode characters in notes', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      const cartItemId = useOrderStore.getState().items[0]!.id
      useOrderStore.getState().updateNote(cartItemId, '不加蛋、少辣')
      expect(useOrderStore.getState().items[0]!.note).toBe('不加蛋、少辣')
    })
  })

  // ─── addDiscount ────────────────────────────────────────────────────────────

  describe('addDiscount', () => {
    it('should add a discount with a unique id', () => {
      useOrderStore.getState().addDiscount('Member Discount', 50)
      const { discounts } = useOrderStore.getState()
      expect(discounts).toHaveLength(1)
      expect(discounts[0]).toMatchObject({
        label: 'Member Discount',
        amount: 50,
      })
      expect(discounts[0]!.id).toBeDefined()
      expect(typeof discounts[0]!.id).toBe('string')
    })

    it('should allow multiple discounts', () => {
      useOrderStore.getState().addDiscount('Member Discount', 50)
      useOrderStore.getState().addDiscount('Holiday Special', 30)
      const { discounts } = useOrderStore.getState()
      expect(discounts).toHaveLength(2)
      expect(discounts[0]!.id).not.toBe(discounts[1]!.id)
    })

    it('should not mutate the original discounts array', () => {
      useOrderStore.getState().addDiscount('Discount A', 10)
      const discountsBefore = useOrderStore.getState().discounts
      useOrderStore.getState().addDiscount('Discount B', 20)
      const discountsAfter = useOrderStore.getState().discounts
      expect(discountsBefore).not.toBe(discountsAfter)
    })
  })

  // ─── removeDiscount ─────────────────────────────────────────────────────────

  describe('removeDiscount', () => {
    it('should remove discount by id', () => {
      useOrderStore.getState().addDiscount('Member Discount', 50)
      const discountId = useOrderStore.getState().discounts[0]!.id
      useOrderStore.getState().removeDiscount(discountId)
      expect(useOrderStore.getState().discounts).toHaveLength(0)
    })

    it('should not affect other discounts when removing one', () => {
      useOrderStore.getState().addDiscount('Discount A', 10)
      useOrderStore.getState().addDiscount('Discount B', 20)
      const firstDiscountId = useOrderStore.getState().discounts[0]!.id
      useOrderStore.getState().removeDiscount(firstDiscountId)
      const { discounts } = useOrderStore.getState()
      expect(discounts).toHaveLength(1)
      expect(discounts[0]!.label).toBe('Discount B')
    })

    it('should do nothing if discount id does not exist', () => {
      useOrderStore.getState().addDiscount('Discount A', 10)
      useOrderStore.getState().removeDiscount('non-existent-id')
      expect(useOrderStore.getState().discounts).toHaveLength(1)
    })
  })

  // ─── clearCart ──────────────────────────────────────────────────────────────

  describe('clearCart', () => {
    it('should clear all items', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      useOrderStore.getState().addItem({
        id: 'com-2',
        name: 'Noodles',
        price: 80,
        typeId: 'food',
        includesSoup: false,
      })
      useOrderStore.getState().clearCart()
      expect(useOrderStore.getState().items).toEqual([])
    })

    it('should clear all discounts', () => {
      useOrderStore.getState().addDiscount('Discount A', 10)
      useOrderStore.getState().addDiscount('Discount B', 20)
      useOrderStore.getState().clearCart()
      expect(useOrderStore.getState().discounts).toEqual([])
    })

    it('should NOT clear operator when clearing cart', () => {
      useOrderStore.getState().setOperator('emp-001', 'Alice')
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      useOrderStore.getState().clearCart()
      const state = useOrderStore.getState()
      expect(state.operatorId).toBe('emp-001')
      expect(state.operatorName).toBe('Alice')
    })

    it('should be safe to call on already empty cart', () => {
      useOrderStore.getState().clearCart()
      const state = useOrderStore.getState()
      expect(state.items).toEqual([])
      expect(state.discounts).toEqual([])
    })

    it('should NOT increment submitSeq on clearCart', () => {
      expect(useOrderStore.getState().submitSeq).toBe(0)
      useOrderStore.getState().clearCart()
      expect(useOrderStore.getState().submitSeq).toBe(0)
    })
  })

  // ─── getSubtotal ────────────────────────────────────────────────────────────

  describe('getSubtotal', () => {
    it('should return 0 for empty cart', () => {
      expect(useOrderStore.getState().getSubtotal()).toBe(0)
    })

    it('should calculate subtotal for a single item', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      expect(useOrderStore.getState().getSubtotal()).toBe(100)
    })

    it('should calculate subtotal with quantity', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      const cartItemId = useOrderStore.getState().items[0]!.id
      useOrderStore.getState().updateQuantity(cartItemId, 3)
      expect(useOrderStore.getState().getSubtotal()).toBe(300)
    })

    it('should sum subtotals across multiple items', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      useOrderStore.getState().addItem({
        id: 'com-2',
        name: 'Noodles',
        price: 80,
        typeId: 'food',
        includesSoup: false,
      })
      // com-1: 100 * 1 = 100, com-2: 80 * 1 = 80
      expect(useOrderStore.getState().getSubtotal()).toBe(180)
    })
  })

  // ─── getTotalDiscount ───────────────────────────────────────────────────────

  describe('getTotalDiscount', () => {
    it('should return 0 when no discounts', () => {
      expect(useOrderStore.getState().getTotalDiscount()).toBe(0)
    })

    it('should sum all discount amounts', () => {
      useOrderStore.getState().addDiscount('Discount A', 50)
      useOrderStore.getState().addDiscount('Discount B', 30)
      expect(useOrderStore.getState().getTotalDiscount()).toBe(80)
    })
  })

  // ─── getTotal ───────────────────────────────────────────────────────────────

  describe('getTotal', () => {
    it('should return 0 for empty cart', () => {
      expect(useOrderStore.getState().getTotal()).toBe(0)
    })

    it('should return subtotal when no discounts', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      expect(useOrderStore.getState().getTotal()).toBe(100)
    })

    it('should subtract discounts from subtotal', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      useOrderStore.getState().addDiscount('Discount', 30)
      expect(useOrderStore.getState().getTotal()).toBe(70)
    })

    it('should never return negative total (min 0)', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 50,
        typeId: 'food',
        includesSoup: false,
      })
      useOrderStore.getState().addDiscount('Big Discount', 200)
      expect(useOrderStore.getState().getTotal()).toBe(0)
    })
  })

  // ─── getItemCount ───────────────────────────────────────────────────────────

  describe('getItemCount', () => {
    it('should return 0 for empty cart', () => {
      expect(useOrderStore.getState().getItemCount()).toBe(0)
    })

    it('should sum all item quantities', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      useOrderStore.getState().addItem({
        id: 'com-2',
        name: 'Noodles',
        price: 80,
        typeId: 'food',
        includesSoup: false,
      })
      const cartItemId = useOrderStore.getState().items[0]!.id
      useOrderStore.getState().updateQuantity(cartItemId, 3)
      // 3 + 1 = 4
      expect(useOrderStore.getState().getItemCount()).toBe(4)
    })
  })

  // ─── getBentoCount ─────────────────────────────────────────────────────────

  describe('getBentoCount', () => {
    it('should return 0 for empty cart', () => {
      expect(useOrderStore.getState().getBentoCount()).toBe(0)
    })

    it('should count items with includesSoup=true', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: '排骨飯',
        price: 100,
        typeId: 'bento',
        includesSoup: true,
      })
      expect(useOrderStore.getState().getBentoCount()).toBe(1)
    })

    it('should NOT count items with includesSoup=false (e.g., 加蛋)', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: '加蛋',
        price: 15,
        typeId: 'bento',
        includesSoup: false,
      })
      expect(useOrderStore.getState().getBentoCount()).toBe(0)
    })

    it('should NOT count drink items even if somehow includesSoup is true', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: '炒飯',
        price: 80,
        typeId: 'noodle',
        includesSoup: false,
      })
      expect(useOrderStore.getState().getBentoCount()).toBe(0)
    })

    it('should sum quantities of items with includesSoup=true', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: '排骨飯',
        price: 100,
        typeId: 'bento',
        includesSoup: true,
      })
      // Add same item again to increment quantity to 2
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: '排骨飯',
        price: 100,
        typeId: 'bento',
        includesSoup: true,
      })
      expect(useOrderStore.getState().getBentoCount()).toBe(2)
    })

    it('should sum across multiple different soup-included bento items', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: '排骨飯',
        price: 100,
        typeId: 'bento',
        includesSoup: true,
      })
      useOrderStore.getState().addItem({
        id: 'com-2',
        name: '雞腿飯',
        price: 120,
        typeId: 'bento',
        includesSoup: true,
      })
      expect(useOrderStore.getState().getBentoCount()).toBe(2)
    })

    it('should handle mixed cart with soup/no-soup bento and non-bento items', () => {
      // includesSoup=true — should count
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: '排骨飯',
        price: 100,
        typeId: 'bento',
        includesSoup: true,
      })
      // includesSoup=false — should NOT count
      useOrderStore.getState().addItem({
        id: 'com-2',
        name: '加蛋',
        price: 15,
        typeId: 'bento',
        includesSoup: false,
      })
      // Non-bento — should NOT count
      useOrderStore.getState().addItem({
        id: 'com-3',
        name: '珍珠奶茶',
        price: 60,
        typeId: 'drink',
        includesSoup: false,
      })
      // includesSoup=true, quantity 3
      useOrderStore.getState().addItem({
        id: 'com-4',
        name: '雞腿飯',
        price: 120,
        typeId: 'bento',
        includesSoup: true,
      })
      const cartItemId = useOrderStore
        .getState()
        .items.find(item => item.commodityId === 'com-4')!.id
      useOrderStore.getState().updateQuantity(cartItemId, 3)
      // Expected: 1 (排骨飯) + 3 (雞腿飯) = 4
      expect(useOrderStore.getState().getBentoCount()).toBe(4)
    })

    it('should NOT count 加菜 (includesSoup=false)', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: '加菜',
        price: 20,
        typeId: 'bento',
        includesSoup: false,
      })
      expect(useOrderStore.getState().getBentoCount()).toBe(0)
    })

    it('should NOT count 雞胸肉沙拉 (includesSoup=false)', () => {
      useOrderStore.getState().addItem({
        id: 'com-015',
        name: '雞胸肉沙拉',
        price: 160,
        typeId: 'bento',
        includesSoup: false,
      })
      expect(useOrderStore.getState().getBentoCount()).toBe(0)
    })
  })

  // ─── getSoupCount ─────────────────────────────────────────────────────────

  describe('getSoupCount', () => {
    it('should return 0 for empty cart', () => {
      expect(useOrderStore.getState().getSoupCount()).toBe(0)
    })

    it('should equal getBentoCount (one soup per bento with includesSoup=true)', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: '排骨飯',
        price: 100,
        typeId: 'bento',
        includesSoup: true,
      })
      useOrderStore.getState().addItem({
        id: 'com-2',
        name: '雞腿飯',
        price: 120,
        typeId: 'bento',
        includesSoup: true,
      })
      const bentoCount = useOrderStore.getState().getBentoCount()
      const soupCount = useOrderStore.getState().getSoupCount()
      expect(soupCount).toBe(bentoCount)
      expect(soupCount).toBe(2)
    })

    it('should return 0 when only non-bento items in cart', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: '珍珠奶茶',
        price: 60,
        typeId: 'drink',
        includesSoup: false,
      })
      expect(useOrderStore.getState().getSoupCount()).toBe(0)
    })

    it('should return 0 when only bento items with includesSoup=false are in cart', () => {
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: '加蛋',
        price: 15,
        typeId: 'bento',
        includesSoup: false,
      })
      useOrderStore.getState().addItem({
        id: 'com-2',
        name: '加菜',
        price: 20,
        typeId: 'bento',
        includesSoup: false,
      })
      expect(useOrderStore.getState().getSoupCount()).toBe(0)
    })
  })

  // ─── submitOrder ────────────────────────────────────────────────────────────

  describe('submitOrder', () => {
    it('should call getNextOrderNumber and create with correct data', async () => {
      const mockRepo = createMockOrderRepo({
        getNextOrderNumber: vi.fn().mockResolvedValue(5),
      })
      mockedGetOrderRepo.mockReturnValue(mockRepo)

      useOrderStore.getState().setOperator('emp-001', 'Alice')
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })

      await useOrderStore.getState().submitOrder()

      expect(mockRepo.getNextOrderNumber).toHaveBeenCalled()
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          number: 5,
          total: 100,
          originalTotal: 100,
          editor: 'emp-001',
        }),
      )
    })

    it('should convert items to structured items array', async () => {
      const mockRepo = createMockOrderRepo()
      mockedGetOrderRepo.mockReturnValue(mockRepo)

      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })

      await useOrderStore.getState().submitOrder()

      const createCall = vi.mocked(mockRepo.create).mock.calls[0]![0]
      expect(createCall.items).toEqual([
        {
          commodityId: 'com-1',
          name: 'Fried Rice',
          price: 100,
          quantity: 1,
          includesSoup: false,
        },
      ])
    })

    it('should pass quantity directly in structured items (no separate qty entry)', async () => {
      const mockRepo = createMockOrderRepo()
      mockedGetOrderRepo.mockReturnValue(mockRepo)

      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      // Add the same item again (quantity becomes 2)
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })

      await useOrderStore.getState().submitOrder()

      const createCall = vi.mocked(mockRepo.create).mock.calls[0]![0]
      expect(createCall.items).toEqual([
        {
          commodityId: 'com-1',
          name: 'Fried Rice',
          price: 100,
          quantity: 2,
          includesSoup: false,
        },
      ])
    })

    it('should collect non-empty notes into memo array', async () => {
      const mockRepo = createMockOrderRepo()
      mockedGetOrderRepo.mockReturnValue(mockRepo)

      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      useOrderStore.getState().addItem({
        id: 'com-2',
        name: 'Noodles',
        price: 80,
        typeId: 'food',
        includesSoup: false,
      })
      const items = useOrderStore.getState().items
      useOrderStore.getState().updateNote(items[0]!.id, 'No egg')
      // Second item has no note (empty string)

      await useOrderStore.getState().submitOrder()

      const createCall = vi.mocked(mockRepo.create).mock.calls[0]![0]
      expect(createCall.memo).toEqual(['No egg'])
    })

    it('should use empty string as editor when no operator set', async () => {
      const mockRepo = createMockOrderRepo()
      mockedGetOrderRepo.mockReturnValue(mockRepo)

      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })

      await useOrderStore.getState().submitOrder()

      const createCall = vi.mocked(mockRepo.create).mock.calls[0]![0]
      expect(createCall.editor).toBe('')
    })

    it('should set soups to getBentoCount when bento items with includesSoup=true exist', async () => {
      const mockRepo = createMockOrderRepo()
      mockedGetOrderRepo.mockReturnValue(mockRepo)

      // Add bento items with includesSoup=true
      useOrderStore.getState().addItem({
        id: 'com-1',
        name: '排骨飯',
        price: 100,
        typeId: 'bento',
        includesSoup: true,
      })
      useOrderStore.getState().addItem({
        id: 'com-2',
        name: '雞腿飯',
        price: 120,
        typeId: 'bento',
        includesSoup: true,
      })

      await useOrderStore.getState().submitOrder()

      const createCall = vi.mocked(mockRepo.create).mock.calls[0]![0]
      expect(createCall.soups).toBe(2)
    })

    it('should set soups to 0 when no bento items with soup exist', async () => {
      const mockRepo = createMockOrderRepo()
      mockedGetOrderRepo.mockReturnValue(mockRepo)

      useOrderStore.getState().addItem({
        id: 'com-1',
        name: '珍珠奶茶',
        price: 60,
        typeId: 'drink',
        includesSoup: false,
      })

      await useOrderStore.getState().submitOrder()

      const createCall = vi.mocked(mockRepo.create).mock.calls[0]![0]
      expect(createCall.soups).toBe(0)
    })

    it('should not count bento items with includesSoup=false in soup count', async () => {
      const mockRepo = createMockOrderRepo()
      mockedGetOrderRepo.mockReturnValue(mockRepo)

      useOrderStore.getState().addItem({
        id: 'com-1',
        name: '排骨飯',
        price: 100,
        typeId: 'bento',
        includesSoup: true,
      })
      useOrderStore.getState().addItem({
        id: 'com-2',
        name: '加蛋',
        price: 15,
        typeId: 'bento',
        includesSoup: false,
      })

      await useOrderStore.getState().submitOrder()

      const createCall = vi.mocked(mockRepo.create).mock.calls[0]![0]
      // Only 排骨飯 (includesSoup=true) counts, not 加蛋 (includesSoup=false)
      expect(createCall.soups).toBe(1)
    })

    it('should clear cart after successful submit', async () => {
      const mockRepo = createMockOrderRepo()
      mockedGetOrderRepo.mockReturnValue(mockRepo)

      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      useOrderStore.getState().addDiscount('Discount', 10)

      await useOrderStore.getState().submitOrder()

      const state = useOrderStore.getState()
      expect(state.items).toEqual([])
      expect(state.discounts).toEqual([])
    })

    it('should increment submitSeq after successful submit', async () => {
      const mockRepo = createMockOrderRepo()
      mockedGetOrderRepo.mockReturnValue(mockRepo)

      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })

      expect(useOrderStore.getState().submitSeq).toBe(0)
      await useOrderStore.getState().submitOrder()
      expect(useOrderStore.getState().submitSeq).toBe(1)
    })

    it('should NOT clear cart if submit fails', async () => {
      const mockRepo = createMockOrderRepo({
        create: vi.fn().mockRejectedValue(new Error('DB error')),
      })
      mockedGetOrderRepo.mockReturnValue(mockRepo)

      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })

      await expect(useOrderStore.getState().submitOrder()).rejects.toThrow(
        'DB error',
      )

      // Cart should still have items
      expect(useOrderStore.getState().items).toHaveLength(1)
    })

    it('should handle multiple items with different quantities in structured items', async () => {
      const mockRepo = createMockOrderRepo()
      mockedGetOrderRepo.mockReturnValue(mockRepo)

      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      useOrderStore.getState().addItem({
        id: 'com-2',
        name: 'Noodles',
        price: 80,
        typeId: 'food',
        includesSoup: false,
      })
      const items = useOrderStore.getState().items
      useOrderStore.getState().updateQuantity(items[0]!.id, 2)
      // com-2 stays at quantity 1

      await useOrderStore.getState().submitOrder()

      const createCall = vi.mocked(mockRepo.create).mock.calls[0]![0]
      expect(createCall.items).toEqual([
        {
          commodityId: 'com-1',
          name: 'Fried Rice',
          price: 100,
          quantity: 2,
          includesSoup: false,
        },
        {
          commodityId: 'com-2',
          name: 'Noodles',
          price: 80,
          quantity: 1,
          includesSoup: false,
        },
      ])
    })

    it('should pass correct total with discounts applied', async () => {
      const mockRepo = createMockOrderRepo()
      mockedGetOrderRepo.mockReturnValue(mockRepo)

      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      useOrderStore.getState().addDiscount('Discount', 30)

      await useOrderStore.getState().submitOrder()

      const createCall = vi.mocked(mockRepo.create).mock.calls[0]![0]
      expect(createCall.total).toBe(70)
      expect(createCall.originalTotal).toBe(100)
    })

    it('should throw error when cart is empty', async () => {
      const mockRepo = createMockOrderRepo()
      mockedGetOrderRepo.mockReturnValue(mockRepo)

      await expect(useOrderStore.getState().submitOrder()).rejects.toThrow(
        'Cannot submit an empty order',
      )
      expect(mockRepo.create).not.toHaveBeenCalled()
    })

    it('should pass discounts as structured discounts array', async () => {
      const mockRepo = createMockOrderRepo()
      mockedGetOrderRepo.mockReturnValue(mockRepo)

      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Bento',
        price: 100,
        typeId: 'bento',
        includesSoup: true,
      })
      useOrderStore.getState().addDiscount('會員折扣', 50)

      await useOrderStore.getState().submitOrder()

      const createCall = vi.mocked(mockRepo.create).mock.calls[0]![0]
      expect(createCall.discounts).toEqual([{ label: '會員折扣', amount: 50 }])
    })
  })

  describe('addDiscount validation', () => {
    it('should ignore zero amount', () => {
      useOrderStore.getState().addDiscount('bad', 0)
      expect(useOrderStore.getState().discounts).toHaveLength(0)
    })

    it('should ignore negative amount', () => {
      useOrderStore.getState().addDiscount('bad', -50)
      expect(useOrderStore.getState().discounts).toHaveLength(0)
    })
  })

  // ─── submitOrder with memoTags ──────────────────────────────────────────

  describe('submitOrder with memoTags', () => {
    it('should prepend memoTags to memo array', async () => {
      const mockRepo = createMockOrderRepo()
      mockedGetOrderRepo.mockReturnValue(mockRepo)

      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      const items = useOrderStore.getState().items
      useOrderStore.getState().updateNote(items[0]!.id, 'No egg')

      await useOrderStore.getState().submitOrder(['外送', '急單'])

      const createCall = vi.mocked(mockRepo.create).mock.calls[0]![0]
      // memoTags should be prepended before item notes
      expect(createCall.memo).toEqual(['外送', '急單', 'No egg'])
    })

    it('should work with memoTags only (no item notes)', async () => {
      const mockRepo = createMockOrderRepo()
      mockedGetOrderRepo.mockReturnValue(mockRepo)

      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })

      await useOrderStore.getState().submitOrder(['攤位'])

      const createCall = vi.mocked(mockRepo.create).mock.calls[0]![0]
      expect(createCall.memo).toEqual(['攤位'])
    })

    it('should work with empty memoTags array', async () => {
      const mockRepo = createMockOrderRepo()
      mockedGetOrderRepo.mockReturnValue(mockRepo)

      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      const items = useOrderStore.getState().items
      useOrderStore.getState().updateNote(items[0]!.id, 'Extra spicy')

      await useOrderStore.getState().submitOrder([])

      const createCall = vi.mocked(mockRepo.create).mock.calls[0]![0]
      expect(createCall.memo).toEqual(['Extra spicy'])
    })

    it('should work without memoTags parameter (backward compatible)', async () => {
      const mockRepo = createMockOrderRepo()
      mockedGetOrderRepo.mockReturnValue(mockRepo)

      useOrderStore.getState().addItem({
        id: 'com-1',
        name: 'Fried Rice',
        price: 100,
        typeId: 'food',
        includesSoup: false,
      })
      const items = useOrderStore.getState().items
      useOrderStore.getState().updateNote(items[0]!.id, 'No egg')

      await useOrderStore.getState().submitOrder()

      const createCall = vi.mocked(mockRepo.create).mock.calls[0]![0]
      expect(createCall.memo).toEqual(['No egg'])
    })
  })

  // ─── loadOrder ──────────────────────────────────────────────────────────────

  describe('loadOrder', () => {
    const sampleOrder: Order = {
      id: 'ord-001',
      number: 5,
      memo: ['加辣'],
      soups: 2,
      total: 200,
      originalTotal: 250,
      editor: 'admin',
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
      items: [
        {
          id: 'item-001',
          orderId: 'ord-001',
          commodityId: 'com-001',
          name: '排骨飯',
          price: 100,
          quantity: 2,
          includesSoup: true,
          createdAt: 1700000000001,
        },
        {
          id: 'item-002',
          orderId: 'ord-001',
          commodityId: 'com-002',
          name: '珍珠奶茶',
          price: 60,
          quantity: 1,
          includesSoup: false,
          createdAt: 1700000000002,
        },
      ],
      discounts: [
        {
          id: 'disc-001',
          orderId: 'ord-001',
          label: '會員折扣',
          amount: 50,
          createdAt: 1700000000003,
        },
      ],
    }

    const typeIdMap: ReadonlyMap<string, string> = new Map([
      ['com-001', 'bento'],
      ['com-002', 'drink'],
    ])

    it('should clear existing cart and load order items as CartItems', () => {
      // Pre-populate cart with existing items
      useOrderStore.getState().addItem({
        id: 'existing-1',
        name: 'Old Item',
        price: 50,
        typeId: 'food',
        includesSoup: false,
      })
      useOrderStore.getState().addDiscount('Old Discount', 10)

      useOrderStore.getState().loadOrder(sampleOrder, typeIdMap)

      const state = useOrderStore.getState()
      // Old items should be cleared
      expect(state.items.every(item => item.commodityId !== 'existing-1')).toBe(
        true,
      )
      // New items from order should be loaded
      expect(state.items).toHaveLength(2)
      expect(state.items[0]).toMatchObject({
        commodityId: 'com-001',
        name: '排骨飯',
        price: 100,
        quantity: 2,
        note: '',
        includesSoup: true,
      })
      expect(state.items[1]).toMatchObject({
        commodityId: 'com-002',
        name: '珍珠奶茶',
        price: 60,
        quantity: 1,
        note: '',
        includesSoup: false,
      })
    })

    it('should map typeId from typeIdMap, fallback to "other" for unknown commodityId', () => {
      const orderWithUnknown: Order = {
        ...sampleOrder,
        items: [
          {
            id: 'item-001',
            orderId: 'ord-001',
            commodityId: 'com-001',
            name: '排骨飯',
            price: 100,
            quantity: 1,
            includesSoup: true,
            createdAt: 1700000000001,
          },
          {
            id: 'item-003',
            orderId: 'ord-001',
            commodityId: 'com-unknown',
            name: 'Unknown Item',
            price: 50,
            quantity: 1,
            includesSoup: false,
            createdAt: 1700000000004,
          },
        ],
      }

      useOrderStore.getState().loadOrder(orderWithUnknown, typeIdMap)

      const state = useOrderStore.getState()
      expect(state.items[0]!.typeId).toBe('bento')
      expect(state.items[1]!.typeId).toBe('other')
    })

    it('should load discounts from order', () => {
      useOrderStore.getState().loadOrder(sampleOrder, typeIdMap)

      const state = useOrderStore.getState()
      expect(state.discounts).toHaveLength(1)
      expect(state.discounts[0]).toMatchObject({
        label: '會員折扣',
        amount: 50,
      })
    })

    it('should generate new unique IDs for cart items (not reuse order item IDs)', () => {
      useOrderStore.getState().loadOrder(sampleOrder, typeIdMap)

      const state = useOrderStore.getState()
      // Cart item IDs should be nanoid-generated, NOT the original order item IDs
      expect(state.items[0]!.id).not.toBe('item-001')
      expect(state.items[1]!.id).not.toBe('item-002')
      // Each cart item should have a unique ID
      expect(state.items[0]!.id).not.toBe(state.items[1]!.id)
      // Discount IDs should also be new
      expect(state.discounts[0]!.id).not.toBe('disc-001')
    })

    it('should handle empty items and discounts', () => {
      const emptyOrder: Order = {
        ...sampleOrder,
        items: [],
        discounts: [],
      }

      useOrderStore.getState().loadOrder(emptyOrder, typeIdMap)

      const state = useOrderStore.getState()
      expect(state.items).toEqual([])
      expect(state.discounts).toEqual([])
    })

    it('should not mutate the original order object', () => {
      const orderCopy = JSON.parse(JSON.stringify(sampleOrder)) as Order

      useOrderStore.getState().loadOrder(sampleOrder, typeIdMap)

      // Original order should remain unchanged
      expect(sampleOrder).toEqual(orderCopy)
    })

    it('should handle order with discounts but no items', () => {
      const discountOnlyOrder: Order = {
        ...sampleOrder,
        items: [],
      }

      useOrderStore.getState().loadOrder(discountOnlyOrder, typeIdMap)

      const state = useOrderStore.getState()
      expect(state.items).toEqual([])
      expect(state.discounts).toHaveLength(1)
    })
  })
})
