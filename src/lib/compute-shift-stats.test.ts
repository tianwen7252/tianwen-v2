/**
 * Tests for compute-shift-stats — shared shift classification logic.
 * Covers: getEffectiveCutoff, isMorningOrder, computeShiftStats.
 */

import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import {
  getEffectiveCutoff,
  isMorningOrder,
  computeShiftStats,
} from './compute-shift-stats'
import type { Order, ShiftCheckout } from '@/lib/schemas'

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeOrder(
  hour: number,
  minute: number,
  total: number,
  memo: string[] = [],
): Order {
  const createdAt = dayjs()
    .hour(hour)
    .minute(minute)
    .second(0)
    .millisecond(0)
    .valueOf()
  return {
    id: `o-${hour}:${minute}`,
    number: 1,
    memo,
    soups: 0,
    total,
    editor: '',
    isServed: false,
    createdAt,
    updatedAt: createdAt,
    items: [],
    discounts: [],
  }
}

function makeCheckout(hour: number, minute: number): ShiftCheckout {
  const checkoutAt = dayjs()
    .hour(hour)
    .minute(minute)
    .second(0)
    .millisecond(0)
    .valueOf()
  return {
    id: 'sc-1',
    date: dayjs().format('YYYY-MM-DD'),
    shift: 'morning',
    orderStaffName: '',
    revenue: 0,
    checkoutAt,
    createdAt: checkoutAt,
    updatedAt: checkoutAt,
  }
}

// ─── getEffectiveCutoff ─────────────────────────────────────────────────────

describe('getEffectiveCutoff', () => {
  it('returns default MORNING_SHIFT (13:30) when no checkout', () => {
    expect(getEffectiveCutoff(undefined)).toBe('13:30')
  })

  it('returns checkout time when checkout is at 13:15 (in window)', () => {
    expect(getEffectiveCutoff(makeCheckout(13, 15))).toBe('13:15')
  })

  it('returns checkout time when checkout is at 13:00 (window start)', () => {
    expect(getEffectiveCutoff(makeCheckout(13, 0))).toBe('13:00')
  })

  it('returns checkout time when checkout is at 13:30 (window end = MORNING_SHIFT)', () => {
    expect(getEffectiveCutoff(makeCheckout(13, 30))).toBe('13:30')
  })

  it('returns default when checkout is at 14:00 (after MORNING_SHIFT)', () => {
    expect(getEffectiveCutoff(makeCheckout(14, 0))).toBe('13:30')
  })

  it('returns default when checkout is at 12:59 (before MORNING_CHECKOUT_START)', () => {
    expect(getEffectiveCutoff(makeCheckout(12, 59))).toBe('13:30')
  })
})

// ─── isMorningOrder ─────────────────────────────────────────────────────────

describe('isMorningOrder', () => {
  it('returns true for order at 12:00 with default cutoff', () => {
    expect(isMorningOrder(makeOrder(12, 0, 100))).toBe(true)
  })

  it('returns true for order at 13:29 with default cutoff', () => {
    expect(isMorningOrder(makeOrder(13, 29, 100))).toBe(true)
  })

  it('returns false for order at 13:30 with default cutoff', () => {
    expect(isMorningOrder(makeOrder(13, 30, 100))).toBe(false)
  })

  it('returns false for order at 13:20 with cutoff 13:15', () => {
    expect(isMorningOrder(makeOrder(13, 20, 100), '13:15')).toBe(false)
  })

  it('returns true for order at 13:10 with cutoff 13:15', () => {
    expect(isMorningOrder(makeOrder(13, 10, 100), '13:15')).toBe(true)
  })
})

// ─── computeShiftStats with early checkout ──────────────────────────────────

describe('computeShiftStats', () => {
  const orders: readonly Order[] = [
    makeOrder(11, 0, 100), // 11:00 → morning
    makeOrder(12, 30, 200), // 12:30 → morning
    makeOrder(13, 10, 300), // 13:10 → depends on cutoff
    makeOrder(13, 20, 400), // 13:20 → depends on cutoff
    makeOrder(17, 0, 500), // 17:00 → evening
    makeOrder(11, 30, 150, ['攤位']), // 11:30 + 攤位 → stall
  ]

  it('classifies with default cutoff (13:30)', () => {
    const stats = computeShiftStats(orders)
    // stall: 150 (攤位 order)
    // morning: 100 + 200 + 300 + 400 = 1000 (all before 13:30)
    // evening: 500 (17:00)
    expect(stats.stall.revenue).toBe(150)
    expect(stats.stall.count).toBe(1)
    expect(stats.morning.revenue).toBe(1000)
    expect(stats.morning.count).toBe(4)
    expect(stats.evening.revenue).toBe(500)
    expect(stats.evening.count).toBe(1)
    expect(stats.total.revenue).toBe(1650)
    expect(stats.total.count).toBe(6)
  })

  it('classifies with early cutoff (13:15) — shifts 13:20 order to evening', () => {
    const stats = computeShiftStats(orders, '13:15')
    // stall: 150
    // morning: 100 + 200 + 300 = 600 (before 13:15)
    // evening: 400 + 500 = 900 (13:20 is now evening)
    expect(stats.stall.revenue).toBe(150)
    expect(stats.morning.revenue).toBe(600)
    expect(stats.morning.count).toBe(3)
    expect(stats.evening.revenue).toBe(900)
    expect(stats.evening.count).toBe(2)
    expect(stats.total.revenue).toBe(1650)
  })

  it('classifies with cutoff at 13:00 — all non-stall afternoon orders go to evening', () => {
    const stats = computeShiftStats(orders, '13:00')
    // stall: 150
    // morning: 100 + 200 = 300 (before 13:00)
    // evening: 300 + 400 + 500 = 1200 (13:10, 13:20, 17:00)
    expect(stats.morning.revenue).toBe(300)
    expect(stats.morning.count).toBe(2)
    expect(stats.evening.revenue).toBe(1200)
    expect(stats.evening.count).toBe(3)
  })

  it('returns all zeros for empty orders', () => {
    const stats = computeShiftStats([])
    expect(stats.total.revenue).toBe(0)
    expect(stats.total.count).toBe(0)
  })

  it('stall orders are not affected by cutoff', () => {
    const stallOrders = [makeOrder(13, 20, 100, ['攤位'])]
    const stats1 = computeShiftStats(stallOrders, '13:00')
    const stats2 = computeShiftStats(stallOrders, '13:30')
    expect(stats1.stall.revenue).toBe(100)
    expect(stats2.stall.revenue).toBe(100)
    expect(stats1.morning.revenue).toBe(0)
    expect(stats2.morning.revenue).toBe(0)
  })
})
