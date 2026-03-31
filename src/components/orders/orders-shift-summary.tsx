/**
 * Shift summary cards for the Orders page.
 * Splits orders into morning/afternoon shifts based on MORNING_SHIFT cutoff
 * and displays count + revenue for each shift plus a grand total.
 */

import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { Sun, MoonStar, CircleDollarSign } from 'lucide-react'
import type { Order } from '@/lib/schemas'
import { formatCurrency } from '@/lib/currency'
import { MORNING_SHIFT } from '@/constants/app'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OrdersShiftSummaryProps {
  readonly orders: readonly Order[]
}

interface ShiftStats {
  readonly count: number
  readonly revenue: number
}

// ─── Constants ──────────────────────────────────────────────────────────────

// Parse MORNING_SHIFT ('HH:mm') into numeric hour and minute for comparison
const [CUTOFF_HOUR, CUTOFF_MINUTE] = MORNING_SHIFT.split(':').map(Number) as [
  number,
  number,
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Check if an order was placed during morning shift (before cutoff) */
function isMorningOrder(order: Order): boolean {
  const orderTime = dayjs(order.createdAt)
  return (
    orderTime.hour() < CUTOFF_HOUR ||
    (orderTime.hour() === CUTOFF_HOUR && orderTime.minute() < CUTOFF_MINUTE)
  )
}

/** Split orders into morning and afternoon based on MORNING_SHIFT cutoff */
function computeShiftStats(orders: readonly Order[]): {
  readonly morning: ShiftStats
  readonly afternoon: ShiftStats
  readonly total: ShiftStats
} {
  let morningCount = 0
  let morningRevenue = 0
  let afternoonCount = 0
  let afternoonRevenue = 0

  for (const order of orders) {
    if (isMorningOrder(order)) {
      morningCount += 1
      morningRevenue += order.total
    } else {
      afternoonCount += 1
      afternoonRevenue += order.total
    }
  }

  return {
    morning: { count: morningCount, revenue: morningRevenue },
    afternoon: { count: afternoonCount, revenue: afternoonRevenue },
    total: {
      count: morningCount + afternoonCount,
      revenue: morningRevenue + afternoonRevenue,
    },
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Displays three summary cards: morning shift, afternoon shift, and grand total.
 * Each card shows order count and total revenue.
 */
export function OrdersShiftSummary({ orders }: OrdersShiftSummaryProps) {
  const { t } = useTranslation()
  const { morning, afternoon, total } = computeShiftStats(orders)

  return (
    <div data-testid="shift-summary" className="grid grid-cols-3 gap-3">
      {/* Morning shift card */}
      <Card shadow data-testid="morning-card" className="py-3">
        <CardHeader className="px-3 py-0">
          <CardTitle fontSize="text-md" className="text-muted-foreground">
            <div className="flex justify-between">
              {t('orders.morningShift')}
              <Sun />
            </div>
          </CardTitle>
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
