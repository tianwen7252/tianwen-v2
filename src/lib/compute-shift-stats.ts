/**
 * Shared shift stats computation — single source of truth for
 * stall / morning / evening / total revenue and order counts.
 *
 * Used by: OrdersShiftSummary, ShiftCheckoutModal, and (indirectly)
 * StatisticsRepository which mirrors the same classification rules in SQL.
 *
 * Classification rules:
 *  - Stall:   order.memo includes '攤位'
 *  - Morning: non-stall order created before the effective cutoff
 *  - Evening: non-stall order created at or after the effective cutoff
 *
 * Effective cutoff:
 *  - Default: MORNING_SHIFT (13:30)
 *  - If a morning checkout exists with checkoutAt in
 *    [MORNING_CHECKOUT_START, MORNING_SHIFT], the cutoff shifts to that time.
 */

import dayjs from 'dayjs'
import { MORNING_SHIFT, MORNING_CHECKOUT_START } from '@/constants/app'
import { isStallOrder } from '@/lib/shift-checkout'
import type { Order, ShiftCheckout } from '@/lib/schemas'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ShiftStats {
  readonly count: number
  readonly revenue: number
}

export interface AllShiftStats {
  readonly stall: ShiftStats
  readonly morning: ShiftStats
  readonly evening: ShiftStats
  readonly total: ShiftStats
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseHHMM(hhmm: string): [number, number] {
  return hhmm.split(':').map(Number) as [number, number]
}

function isBeforeCutoff(
  orderTime: dayjs.Dayjs,
  cutoffH: number,
  cutoffM: number,
): boolean {
  const h = orderTime.hour()
  return h < cutoffH || (h === cutoffH && orderTime.minute() < cutoffM)
}

/**
 * Determine the effective morning/evening cutoff time (HH:mm).
 *
 * If a morning checkout was performed between MORNING_CHECKOUT_START and
 * MORNING_SHIFT, orders created after that checkout are counted as evening.
 * Otherwise the default MORNING_SHIFT cutoff applies.
 */
export function getEffectiveCutoff(
  morningCheckout: ShiftCheckout | undefined,
): string {
  if (!morningCheckout) return MORNING_SHIFT

  const checkoutTime = dayjs(morningCheckout.checkoutAt).format('HH:mm')
  if (checkoutTime >= MORNING_CHECKOUT_START && checkoutTime <= MORNING_SHIFT) {
    return checkoutTime
  }

  return MORNING_SHIFT
}

/** Returns true if the order was created before the given cutoff. */
export function isMorningOrder(
  order: Order,
  cutoff: string = MORNING_SHIFT,
): boolean {
  const [cutoffH, cutoffM] = parseHHMM(cutoff)
  return isBeforeCutoff(dayjs(order.createdAt), cutoffH, cutoffM)
}

// ─── Main computation ───────────────────────────────────────────────────────

/**
 * Classify orders into stall / morning / evening and compute counts + revenue.
 *
 * @param orders       The orders to classify
 * @param cutoffTime   HH:mm cutoff between morning and evening (default: MORNING_SHIFT).
 *                     Use getEffectiveCutoff() to compute this from checkout data.
 */
export function computeShiftStats(
  orders: readonly Order[],
  cutoffTime: string = MORNING_SHIFT,
): AllShiftStats {
  const [cutoffH, cutoffM] = parseHHMM(cutoffTime)

  let stallCount = 0
  let stallRevenue = 0
  let morningCount = 0
  let morningRevenue = 0
  let eveningCount = 0
  let eveningRevenue = 0

  for (const order of orders) {
    if (isStallOrder(order)) {
      stallCount += 1
      stallRevenue += order.total
    } else if (isBeforeCutoff(dayjs(order.createdAt), cutoffH, cutoffM)) {
      morningCount += 1
      morningRevenue += order.total
    } else {
      eveningCount += 1
      eveningRevenue += order.total
    }
  }

  return {
    stall: { count: stallCount, revenue: stallRevenue },
    morning: { count: morningCount, revenue: morningRevenue },
    evening: { count: eveningCount, revenue: eveningRevenue },
    total: {
      count: stallCount + morningCount + eveningCount,
      revenue: stallRevenue + morningRevenue + eveningRevenue,
    },
  }
}
