/**
 * Pure utility functions for shift checkout time window validation.
 * No DB access, no side effects — purely functional.
 */

import type { Dayjs } from 'dayjs'
import {
  MORNING_CHECKOUT_START,
  MORNING_CHECKOUT_END,
  EVENING_CHECKOUT_START,
  EVENING_CHECKOUT_END,
} from '@/constants/app'
import type { ShiftType, Order } from '@/lib/schemas'

/**
 * Returns the current shift if `now` falls within a checkout window, or null otherwise.
 * Morning: MORNING_CHECKOUT_START ~ MORNING_CHECKOUT_END (inclusive start, exclusive end)
 * Evening: EVENING_CHECKOUT_START ~ EVENING_CHECKOUT_END (inclusive start, exclusive end)
 */
export function getCurrentShift(now: Dayjs): ShiftType | null {
  const time = now.format('HH:mm')
  if (time >= MORNING_CHECKOUT_START && time < MORNING_CHECKOUT_END) {
    return 'morning'
  }
  if (time >= EVENING_CHECKOUT_START && time < EVENING_CHECKOUT_END) {
    return 'evening'
  }
  return null
}

/**
 * Returns true if `now` falls within any checkout window.
 */
export function isInCheckoutWindow(now: Dayjs): boolean {
  return getCurrentShift(now) !== null
}

/**
 * Returns true if the order has the "攤位" memo tag.
 */
export function isStallOrder(order: Order): boolean {
  return order.memo.includes('攤位')
}
