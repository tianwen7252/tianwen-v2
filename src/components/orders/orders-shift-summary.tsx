/**
 * Shift summary cards for the Orders page.
 * Splits orders into stall/morning/evening shifts and displays
 * count + revenue for each category plus a grand total.
 */

import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { Sun, MoonStar, CircleDollarSign, Store } from 'lucide-react'
import type { Order, ShiftCheckout } from '@/lib/schemas'
import { formatCurrency } from '@/lib/currency'
import {
  computeShiftStats,
  getEffectiveCutoff,
} from '@/lib/compute-shift-stats'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OrdersShiftSummaryProps {
  readonly orders: readonly Order[]
  readonly checkouts?: readonly ShiftCheckout[]
}

// ─── Component ───────────────────────────────────────────────────────────────

export function OrdersShiftSummary({
  orders,
  checkouts = [],
}: OrdersShiftSummaryProps) {
  const { t } = useTranslation()
  const morningCheckout = checkouts.find(c => c.shift === 'morning')
  const cutoff = getEffectiveCutoff(morningCheckout)
  const { stall, morning, evening, total } = computeShiftStats(orders, cutoff)
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
              {t('orders.orderCount', { count: evening.count })}
              <span className="text-(--color-gold)">
                {formatCurrency(evening.revenue)}
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
