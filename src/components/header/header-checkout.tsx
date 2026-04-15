import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { Receipt } from 'lucide-react'
import { RippleButton } from '@/components/ui/ripple-button'
import { ShineBorder } from '@/components/ui/shine-border'
import { ShiftCheckoutModal } from '@/components/shift-checkout/shift-checkout-modal'
import { isInCheckoutWindow } from '@/lib/shift-checkout'
import { notify } from '@/components/ui/sonner'

export function HeaderCheckout() {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCheckoutTime, setIsCheckoutTime] = useState(() =>
    isInCheckoutWindow(dayjs()),
  )

  // Check checkout window every second
  useEffect(() => {
    const timer = setInterval(() => {
      setIsCheckoutTime(isInCheckoutWindow(dayjs()))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  function handleClick() {
    if (!isCheckoutTime) {
      notify.error(
        `${t('shiftCheckout.notInWindow')}\n${t('shiftCheckout.windowInfo')}`,
      )
      return
    }
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="relative">
        <RippleButton
          data-testid="header-checkout-btn"
          rippleColor="rgba(0,0,0,0.1)"
          className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          onClick={handleClick}
        >
          <Receipt size={18} />
        </RippleButton>
        {isCheckoutTime && (
          <ShineBorder
            shineColor={['#d4a76a', '#e0bf8a', '#edd5aa']}
            borderWidth={2}
            duration={8}
          />
        )}
      </div>
      {isModalOpen && (
        <ShiftCheckoutModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  )
}
