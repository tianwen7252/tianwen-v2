/**
 * Shift summary cards for the Orders page.
 * Splits orders into stall/morning/afternoon shifts and displays
 * count + revenue for each category plus a grand total.
 */

import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { Sun, MoonStar, CircleDollarSign, Store } from 'lucide-react'
import type { Order, ShiftCheckout } from '@/lib/schemas'
import { formatCurrency } from '@/lib/currency'
import { MORNING_SHIFT } from '@/constants/app'
import { isStallOrder } from '@/lib/shift-checkout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OrdersShiftSummaryProps {
  readonly orders: readonly Order[]
  readonly checkouts?: readonly ShiftCheckout[]
}

interface ShiftStats {
  readonly count: number
  readonly revenue: number
}

// ─── Constants ──────────────────────────────────────────────────────────────

const [CUTOFF_HOUR, CUTOFF_MINUTE] = MORNING_SHIFT.split(':').map(Number) as [
  number,
  number,
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isMorningOrder(order: Order): boolean {
  const orderTime = dayjs(order.createdAt)
  return (
    orderTime.hour() < CUTOFF_HOUR ||
    (orderTime.hour() === CUTOFF_HOUR && orderTime.minute() < CUTOFF_MINUTE)
  )
}

function computeShiftStats(orders: readonly Order[]): {
  readonly stall: ShiftStats
  readonly morning: ShiftStats
  readonly afternoon: ShiftStats
  readonly total: ShiftStats
} {
  let stallCount = 0
  let stallRevenue = 0
  let morningCount = 0
  let morningRevenue = 0
  let afternoonCount = 0
  let afternoonRevenue = 0

  for (const order of orders) {
    if (isStallOrder(order)) {
      stallCount += 1
      stallRevenue += order.total
    } else if (isMorningOrder(order)) {
      morningCount += 1
      morningRevenue += order.total
    } else {
      afternoonCount += 1
      afternoonRevenue += order.total
    }
  }

  return {
    stall: { count: stallCount, revenue: stallRevenue },
    morning: { count: morningCount, revenue: morningRevenue },
    afternoon: { count: afternoonCount, revenue: afternoonRevenue },
    total: {
      count: stallCount + morningCount + afternoonCount,
      revenue: stallRevenue + morningRevenue + afternoonRevenue,
    },
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function OrdersShiftSummary({
  orders,
  checkouts = [],
}: OrdersShiftSummaryProps) {
  const { t } = useTranslation()
  const { stall, morning, afternoon, total } = computeShiftStats(orders)
  const morningCheckout = checkouts.find(c => c.shift === 'morning')
  const eveningCheckout = checkouts.find(c => c.shift === 'evening')

  return (
    <div data-testid="shift-summary" className="grid grid-cols-4 gap-3">
      {/* Stall card */}
      <Card shadow data-testid="stall-card" className="py-3">
        <CardHeader className="px-3 py-0">
          <CardTitle fontSize="text-md" className="text-muted-foreground">
            <div className="flex justify-between">
              {t('orders.stallShift')}
              <Store />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3">
          <div className="text-base text-primary">
            <div className="flex justify-between">
              {t('orders.orderCount', { count: stall.count })}
              <span className="text-(--color-gold)">
                {formatCurrency(stall.revenue)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Morning shift card */}
      <Card shadow data-testid="morning-card" className="py-3">
        <CardHeader className="px-3 py-0">
          <CardTitle fontSize="text-md" className="text-muted-foreground">
            <div className="flex justify-between">
              {t('orders.morningShift')}
              <Sun />
            </div>
          </CardTitle>
          {morningCheckout && (
            <p className="text-xs text-muted-foreground">
              {t('shiftCheckout.checkoutTime', {
                time: dayjs(morningCheckout.checkoutAt).format('h:mm A'),
              })}
            </p>
          )}
        </CardHeader>
        <CardContent className="px-3">
          <div className="text-base text-primary">
            <div className="flex justify-between">
              {t('orders.orderCount', { count: morning.count })}
              <span className="text-(--color-gold)">
                {formatCurrency(morning.revenue)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Afternoon shift card */}
      <Card shadow data-testid="afternoon-card" className="py-3">
        <CardHeader className="px-3 py-0">
          <CardTitle fontSize="text-md" className="text-muted-foreground">
            <div className="flex justify-between">
              {t('orders.afternoonShift')}
              <MoonStar />
            </div>
          </CardTitle>
          {eveningCheckout && (
            <p className="text-xs text-muted-foreground">
              {t('shiftCheckout.checkoutTime', {
                time: dayjs(eveningCheckout.checkoutAt).format('h:mm A'),
              })}
            </p>
          )}
        </CardHeader>
        <CardContent className="px-3">
          <div className="text-base text-primary">
            <div className="flex justify-between">
              {t('orders.orderCount', { count: afternoon.count })}
              <span className="text-(--color-gold)">
                {formatCurrency(afternoon.revenue)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grand total card */}
      <Card shadow data-testid="total-card" className="py-3">
        <CardHeader className="px-3 py-0">
          <CardTitle fontSize="text-md" className="text-muted-foreground">
            <div className="flex justify-between">
              {t('orders.grandTotal')}
              <CircleDollarSign />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3">
          <div className="text-base text-primary">
            <div className="flex justify-between">
              {t('orders.orderCount', { count: total.count })}
              <span className="text-(--color-gold)">
                {formatCurrency(total.revenue)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
