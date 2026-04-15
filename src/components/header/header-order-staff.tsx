import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ContactRound } from 'lucide-react'
import { RippleButton } from '@/components/ui/ripple-button'
import { OrderStaffModal } from '@/components/order-staff-modal'
import { useOrderStaffStore } from '@/stores/order-staff-store'
import { cn } from '@/lib/cn'

export function HeaderOrderStaff() {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const orderStaffName = useOrderStaffStore(s => s.orderStaffName)

  return (
    <>
      <RippleButton
        data-testid="header-order-staff-btn"
        rippleColor="rgba(0,0,0,0.1)"
        className={cn(
          'flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors hover:bg-accent hover:text-accent-foreground',
          orderStaffName ? 'text-primary' : 'text-muted-foreground',
        )}
        onClick={() => setIsModalOpen(true)}
      >
        <ContactRound size={18} />
        {orderStaffName && (
          <span className="text-md">
            {t('orderStaff.currentlyTaking', { name: orderStaffName })}
          </span>
        )}
      </RippleButton>
      {isModalOpen && (
        <OrderStaffModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  )
}
