import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/modal/modal'
import { AvatarImage } from '@/components/avatar-image'
import { RippleButton } from '@/components/ui/ripple-button'
import { ShineBorder } from '@/components/ui/shine-border'
import { SHINE_COLOR_PRESETS } from '@/constants/shine-colors'
import { useDbQuery } from '@/hooks/use-db-query'
import { getEmployeeRepo } from '@/lib/repositories/provider'
import { useOrderStaffStore } from '@/stores/order-staff-store'
import type { Employee } from '@/lib/schemas'

interface OrderStaffModalProps {
  readonly open: boolean
  readonly onClose: () => void
}

export function OrderStaffModal({ open, onClose }: OrderStaffModalProps) {
  const { t } = useTranslation()
  const orderStaffId = useOrderStaffStore(s => s.orderStaffId)
  const setOrderStaff = useOrderStaffStore(s => s.setOrderStaff)

  const employees = useDbQuery<Employee[]>(
    () => getEmployeeRepo().findByStatus('active'),
    [open],
    [],
  )

  // Filter out resigned employees
  const activeEmployees = employees.filter(e => !e.resignationDate)

  function handleSelect(employee: Employee) {
    setOrderStaff(employee.id, employee.name, employee.avatar)
    onClose()
  }

  return (
    <Modal
      open={open}
      variant="blue"
      title={t('orderStaff.selectTitle')}
      width={700}
      onClose={onClose}
    >
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        {activeEmployees.map(employee => {
          const isSelected = employee.id === orderStaffId
          return (
            <RippleButton
              key={employee.id}
              data-testid={`order-staff-${employee.id}`}
              rippleColor="rgba(127, 149, 106, 0.3)"
              className="relative flex min-w-30 flex-col items-center gap-2 rounded-xl border border-transparent px-2 py-4 transition-all hover:bg-white/60"
              onClick={() => handleSelect(employee)}
            >
              {isSelected && (
                <ShineBorder
                  shineColor={SHINE_COLOR_PRESETS.rainbow}
                  borderWidth={2}
                  duration={10}
                />
              )}
              <div
                className="rounded-full p-0.5"
                style={{
                  border: isSelected
                    ? '3px solid #7f956a'
                    : '3px solid transparent',
                }}
              >
                <AvatarImage avatar={employee.avatar} size={64} />
              </div>
              <span className="text-md text-foreground">{employee.name}</span>
            </RippleButton>
          )
        })}
      </div>
    </Modal>
  )
}
