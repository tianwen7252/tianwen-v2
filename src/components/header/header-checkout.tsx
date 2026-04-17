import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { Receipt } from 'lucide-react'
import { RippleButton } from '@/components/ui/ripple-button'
import { ShineBorder } from '@/components/ui/shine-border'
import { ShiftCheckoutModal } from '@/components/shift-checkout/shift-checkout-modal'
import { getCurrentShift, isInCheckoutWindow } from '@/lib/shift-checkout'
import { getShiftCheckoutRepo } from '@/lib/repositories/provider'
import { SHINE_COLOR_PRESETS } from '@/constants/shine-colors'
import { useInitStore } from '@/stores/init-store'
import { notify } from '@/components/ui/sonner'

export function HeaderCheckout() {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCheckoutTime, setIsCheckoutTime] = useState(() =>
    isInCheckoutWindow(dayjs()),
  )
  // null = not yet checked, true = checked out, false = not checked out
  const [checkedOutStatus, setCheckedOutStatus] = useState<boolean | null>(null)
  const bootstrapDone = useInitStore(s => s.bootstrapDone)

  // Poll checkout window every second (pure math, no DB)
  useEffect(() => {
    const timer = setInterval(() => {
      setIsCheckoutTime(isInCheckoutWindow(dayjs()))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Check DB for existing checkout when in window + DB is ready
  useEffect(() => {
    if (!isCheckoutTime || !bootstrapDone) {
      setCheckedOutStatus(null)
      return
    }

    let cancelled = false
    const shift = getCurrentShift(dayjs())
    if (!shift) return

    const today = dayjs().format('YYYY-MM-DD')
    getShiftCheckoutRepo()
      .findByDateAndShift(today, shift)
      .then(existing => {
        if (!cancelled) setCheckedOutStatus(existing !== undefined)
      })
      .catch(() => {
        // Provider may not be ready
      })

    return () => {
      cancelled = true
    }
  }, [isCheckoutTime, bootstrapDone])

  function handleModalClose() {
    setIsModalOpen(false)
    setCheckedOutStatus(true)
  }

  function handleClick() {
    if (!isCheckoutTime) {
      notify.error(t('shiftCheckout.notInWindow'), {
        description: t('shiftCheckout.windowInfo'),
      })
      return
    }
    setIsModalOpen(true)
  }

  // Show highlight only when: in window + DB confirmed not checked out
  const showHighlight = isCheckoutTime && checkedOutStatus === false

  return (
    <>
      <div className="relative">
        <RippleButton
          data-testid="header-checkout-btn"
          rippleColor="rgba(0,0,0,0.1)"
          className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          onClick={handleClick}
        >
          <Receipt size={20} />
        </RippleButton>
        {showHighlight && (
          <ShineBorder
            shineColor={SHINE_COLOR_PRESETS.rainbow}
            borderWidth={2}
            duration={8}
          />
        )}
      </div>
      {isModalOpen && (
        <ShiftCheckoutModal open={isModalOpen} onClose={handleModalClose} />
      )}
    </>
  )
}
