import { useState } from 'react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { ConfirmModal } from '@/components/modal/modal'
import { LiveClock } from './live-clock'
import { getCurrentShift } from '@/lib/shift-checkout'
import { getShiftCheckoutRepo, getOrderRepo } from '@/lib/repositories/provider'
import { MORNING_SHIFT } from '@/constants/app'
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

      // Calculate shift revenue from today's orders (all orders including stall)
      const dayStart = dayjs(today).startOf('day').valueOf()
      const dayEnd = dayjs(today).endOf('day').valueOf()
      const todayOrders = await getOrderRepo().findByDateRange(dayStart, dayEnd)

      const [cutoffHour, cutoffMinute] = MORNING_SHIFT.split(':').map(Number) as [number, number]
      const shiftRevenue = todayOrders
        .filter(o => {
          const h = dayjs(o.createdAt).hour()
          const m = dayjs(o.createdAt).minute()
          const isMorning =
            h < cutoffHour || (h === cutoffHour && m < cutoffMinute)
          return shift === 'morning' ? isMorning : !isMorning
        })
        .reduce((sum, o) => sum + o.total, 0)

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
