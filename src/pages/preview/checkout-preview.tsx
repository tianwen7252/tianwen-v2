/**
 * Dev-only shift checkout page — allows manual checkout at any date/time.
 * Writes a shift_checkouts record with the chosen timestamp.
 */

import { useState } from 'react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { Receipt, Loader2, CheckCircle, Trash2, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { getShiftCheckoutRepo, getOrderRepo } from '@/lib/repositories/provider'
import {
  computeShiftStats,
  getEffectiveCutoff,
} from '@/lib/compute-shift-stats'
import { useDbQuery } from '@/hooks/use-db-query'
import { useOrderStaffStore } from '@/stores/order-staff-store'
import { notify } from '@/components/ui/sonner'
import { logError } from '@/lib/error-logger'
import { formatCurrency } from '@/lib/currency'
import type { ShiftType, ShiftCheckout } from '@/lib/schemas'

// ─── State ──────────────────────────────────────────────────────────────────

type Status = 'idle' | 'saving' | 'deleting'

// ─── Component ──────────────────────────────────────────────────────────────

export function CheckoutPreview() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<Status>('idle')
  const [calculating, setCalculating] = useState(false)
  const [date, setDate] = useState(() => dayjs().format('YYYY-MM-DD'))
  const [time, setTime] = useState(() => dayjs().format('HH:mm'))
  const [shift, setShift] = useState<ShiftType>('morning')
  const [revenue, setRevenue] = useState('0')
  const [refreshKey, setRefreshKey] = useState(0)

  // Fetch existing checkouts for selected date
  const checkouts = useDbQuery(
    () => getShiftCheckoutRepo().findByDate(date),
    [date, refreshKey],
    [],
  )

  async function handleCreate() {
    setStatus('saving')
    try {
      const checkoutAt = dayjs(`${date} ${time}`, 'YYYY-MM-DD HH:mm').valueOf()
      const { orderStaffId, orderStaffName } = useOrderStaffStore.getState()

      await getShiftCheckoutRepo().create({
        date,
        shift,
        orderStaffId: orderStaffId ?? undefined,
        orderStaffName: orderStaffName ?? '',
        revenue: Number(revenue) || 0,
        checkoutAt,
      })

      notify.success(`Created ${shift} checkout for ${date} at ${time}`)
      setRefreshKey(k => k + 1)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logError(msg, 'CheckoutPreview')
      notify.error(msg)
    } finally {
      setStatus('idle')
    }
  }

  async function handleDelete(checkout: ShiftCheckout) {
    setStatus('deleting')
    try {
      await getShiftCheckoutRepo().remove(checkout.id)
      notify.success(`Deleted ${checkout.shift} checkout for ${checkout.date}`)
      setRefreshKey(k => k + 1)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logError(msg, 'CheckoutPreview')
      notify.error(msg)
    } finally {
      setStatus('idle')
    }
  }

  async function handleCalcRevenue() {
    setCalculating(true)
    try {
      const dayStart = dayjs(date).startOf('day').valueOf()
      const dayEnd = dayjs(date).endOf('day').valueOf()
      const orders = await getOrderRepo().findByDateRange(dayStart, dayEnd)

      const morningCheckout = checkouts.find(c => c.shift === 'morning')
      const cutoff = getEffectiveCutoff(morningCheckout)
      const stats = computeShiftStats(orders, cutoff)

      const value =
        shift === 'morning'
          ? stats.stall.revenue + stats.morning.revenue
          : stats.evening.revenue
      setRevenue(String(value))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logError(msg, 'CheckoutPreview')
      notify.error(msg)
    } finally {
      setCalculating(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <h2 className="flex items-center gap-2 text-lg text-primary">
        <Receipt size={20} />
        Dev Shift Checkout
      </h2>

      {/* Create form */}
      <Card shadow>
        <CardHeader>
          <CardTitle fontSize="text-md">Create Checkout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="checkout-date">Date</Label>
              <Input
                id="checkout-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="checkout-time">Time</Label>
              <Input
                id="checkout-time"
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="checkout-shift">Shift</Label>
              <select
                id="checkout-shift"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors"
                value={shift}
                onChange={e => setShift(e.target.value as ShiftType)}
              >
                <option value="morning">Morning (早班)</option>
                <option value="evening">Evening (晚班)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="checkout-revenue">Revenue</Label>
              <div className="flex gap-2">
                <Input
                  id="checkout-revenue"
                  type="number"
                  value={revenue}
                  onChange={e => setRevenue(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  disabled={calculating}
                  onClick={handleCalcRevenue}
                  title="Calculate shift revenue from orders"
                >
                  {calculating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Calculator className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <Button
            className="mt-4"
            disabled={status !== 'idle'}
            onClick={handleCreate}
          >
            {status === 'saving' ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 size-4" />
            )}
            Create Checkout
          </Button>
        </CardContent>
      </Card>

      {/* Existing checkouts for selected date */}
      <Card shadow>
        <CardHeader>
          <CardTitle fontSize="text-md">
            Checkouts for {date} ({checkouts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checkouts.length === 0 ? (
            <p className="text-muted-foreground">
              {t('shiftCheckout.notCheckedOut')}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {checkouts.map(c => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-base">
                      {c.shift === 'morning' ? '早班' : '晚班'} —{' '}
                      {dayjs(c.checkoutAt).format('HH:mm:ss')}
                    </span>
                    <span className="text-base text-(--color-gold)">
                      {formatCurrency(c.revenue)}
                    </span>
                    {c.orderStaffName && (
                      <span className="text-muted-foreground text-base">
                        {c.orderStaffName}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={status !== 'idle'}
                    onClick={() => handleDelete(c)}
                  >
                    <Trash2 size={16} className="text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
