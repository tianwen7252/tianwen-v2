import { useState } from 'react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { ConfirmModal } from '@/components/modal/modal'
import { LiveClock } from './live-clock'
import { getCurrentShift } from '@/lib/shift-checkout'
import { getShiftCheckoutRepo, getOrderRepo } from '@/lib/repositories/provider'
import {
  computeShiftStats,
  getEffectiveCutoff,
} from '@/lib/compute-shift-stats'
import { useOrderStaffStore } from '@/stores/order-staff-store'
import { notify } from '@/components/ui/sonner'
import { logError } from '@/lib/error-logger'

interface ShiftCheckoutModalProps {
  readonly open: boolean
  readonly onClose: () => void
}

export function ShiftCheckoutModal({ open, onClose }: ShiftCheckoutModalProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  const shift = getCurrentShift(dayjs())
  const headerText =
    shift === 'morning'
      ? t('shiftCheckout.morningShift')
      : t('shiftCheckout.eveningShift')

  async function handleConfirm() {
    if (!shift) return

    setLoading(true)
    try {
      const today = dayjs().format('YYYY-MM-DD')
      const existing = await getShiftCheckoutRepo().findByDateAndShift(
        today,
        shift,
      )

      if (existing) {
        notify.error(t('shiftCheckout.alreadyCheckedOut'))
        onClose()
        return
      }

      // Calculate shift revenue from today's orders using shared shift stats.
      // For evening checkout, look up morning checkout to determine effective cutoff.
      const dayStart = dayjs(today).startOf('day').valueOf()
      const dayEnd = dayjs(today).endOf('day').valueOf()
      const todayOrders = await getOrderRepo().findByDateRange(dayStart, dayEnd)

      const morningCheckout =
        shift === 'evening'
          ? await getShiftCheckoutRepo().findByDateAndShift(today, 'morning')
          : undefined
      const cutoff = getEffectiveCutoff(morningCheckout)
      const stats = computeShiftStats(todayOrders, cutoff)
      // Morning shift = stall + morning; Evening shift = evening only
      const shiftRevenue =
        shift === 'morning'
          ? stats.stall.revenue + stats.morning.revenue
          : stats.evening.revenue

      const { orderStaffId, orderStaffName } = useOrderStaffStore.getState()

      await getShiftCheckoutRepo().create({
        date: today,
        shift,
        orderStaffId: orderStaffId ?? undefined,
        orderStaffName: orderStaffName ?? '',
        revenue: shiftRevenue,
        checkoutAt: Date.now(),
      })

      notify.success(t('shiftCheckout.successToast'))
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logError(msg, 'ShiftCheckoutModal')
      notify.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ConfirmModal
      open={open}
      variant="orange"
      shineColor="orange"
      header={headerText}
      title={t('shiftCheckout.title')}
      confirmText={t('common.confirm')}
      loading={loading}
      onConfirm={handleConfirm}
      onCancel={onClose}
    >
      <div className="flex flex-col items-center gap-6 py-4">
        <p className="text-lg text-foreground">
          {t('shiftCheckout.confirmMessage')}
        </p>
        <LiveClock />
      </div>
    </ConfirmModal>
  )
}
