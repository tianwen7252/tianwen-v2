import { useTranslation } from 'react-i18next'
import { ConfirmModal } from '@/components/modal'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DeleteOrderModalProps {
  readonly open: boolean
  readonly orderNumber: number
  readonly onConfirm: () => void
  readonly onCancel: () => void
  readonly loading?: boolean
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Thin wrapper around ConfirmModal for order deletion confirmation.
 * Uses variant="red" to visually signal a destructive action.
 */
export function DeleteOrderModal({
  open,
  orderNumber,
  onConfirm,
  onCancel,
  loading = false,
}: DeleteOrderModalProps) {
  const { t } = useTranslation()

  return (
    <ConfirmModal
      open={open}
      variant="red"
      title={t('orders.confirmDeleteTitle', { number: orderNumber })}
      confirmText={t('orders.confirmDeleteBtn')}
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
