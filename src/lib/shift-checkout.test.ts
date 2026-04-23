import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import {
  getCurrentShift,
  isInCheckoutWindow,
  isStallOrder,
} from './shift-checkout'
import type { Order } from '@/lib/schemas'

function makeTime(hour: number, minute: number) {
  return dayjs().hour(hour).minute(minute).second(0)
}

function makeOrder(memo: string[] = []): Order {
  return {
    id: 'o1',
    number: 1,
    memo,
    soups: 0,
    total: 100,
    editor: '',
    isServed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    items: [],
    discounts: [],
  }
}

// Window times from constants/app.ts:
// MORNING_CHECKOUT_START = '13:00', MORNING_CHECKOUT_END = '14:00'
// EVENING_CHECKOUT_START = '19:00', EVENING_CHECKOUT_END = '20:30'

describe('getCurrentShift', () => {
  it('returns null before morning window (12:59)', () => {
    expect(getCurrentShift(makeTime(12, 59))).toBeNull()
  })

  it('returns morning at window start (13:00)', () => {
    expect(getCurrentShift(makeTime(13, 0))).toBe('morning')
  })

  it('returns morning inside window (13:30)', () => {
    expect(getCurrentShift(makeTime(13, 30))).toBe('morning')
  })

  it('returns morning at last minute (13:59)', () => {
    expect(getCurrentShift(makeTime(13, 59))).toBe('morning')
  })

  it('returns null at morning window end (14:00)', () => {
    expect(getCurrentShift(makeTime(14, 0))).toBeNull()
  })

  it('returns null between windows (15:00)', () => {
    expect(getCurrentShift(makeTime(15, 0))).toBeNull()
  })

  it('returns null before evening window (18:59)', () => {
    expect(getCurrentShift(makeTime(18, 59))).toBeNull()
  })

  it('returns evening at window start (19:00)', () => {
    expect(getCurrentShift(makeTime(19, 0))).toBe('evening')
  })

  it('returns evening inside window (19:45)', () => {
    expect(getCurrentShift(makeTime(19, 45))).toBe('evening')
  })

  it('returns evening at last minute (20:29)', () => {
    expect(getCurrentShift(makeTime(20, 29))).toBe('evening')
  })

  it('returns null at evening window end (20:30)', () => {
    expect(getCurrentShift(makeTime(20, 30))).toBeNull()
  })

  it('returns null early morning (09:00)', () => {
    expect(getCurrentShift(makeTime(9, 0))).toBeNull()
  })
})

describe('isInCheckoutWindow', () => {
  it('returns true during morning window', () => {
    expect(isInCheckoutWindow(makeTime(13, 0))).toBe(true)
  })

  it('returns true during evening window', () => {
    expect(isInCheckoutWindow(makeTime(19, 45))).toBe(true)
  })

  it('returns false outside windows', () => {
    expect(isInCheckoutWindow(makeTime(12, 0))).toBe(false)
  })
})

describe('isStallOrder', () => {
  it('returns true for order with 攤位 tag', () => {
    expect(isStallOrder(makeOrder(['攤位', '外送']))).toBe(true)
  })

  it('returns false for order without 攤位 tag', () => {
    expect(isStallOrder(makeOrder(['外送']))).toBe(false)
  })

  it('returns false for order with empty memo', () => {
    expect(isStallOrder(makeOrder())).toBe(false)
  })
})
