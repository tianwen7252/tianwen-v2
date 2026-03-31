import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/modal/modal'
import { groupCartItems } from '@/lib/group-cart-items'
import type { CartItem, Discount } from '@/stores/order-store'
import { CircleCheckBig, LoaderCircle } from 'lucide-react'
import { RippleButton } from '@/components/ui/ripple-button'
import { ConfirmOrderContent } from './confirm-order-content'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConfirmOrderModalProps {
  readonly open: boolean
  readonly onClose: () => void
  readonly onConfirm: (memoTags: string[]) => void
  readonly items: readonly CartItem[]
  readonly discounts: readonly Discount[]
  readonly total: number
  readonly bentoCount: number
  readonly soupCount: number
  readonly isSubmitting: boolean
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Confirmation modal that displays cart items grouped by category.
 * Delegates inner content rendering to ConfirmOrderContent.
 */
export function ConfirmOrderModal({
  open,
  onClose,
  onConfirm,
  items,
  discounts,
  total,
  bentoCount,
  soupCount,
  isSubmitting,
}: ConfirmOrderModalProps) {
  const { t } = useTranslation()
  const groups = groupCartItems(items, discounts)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Reset selected tags when modal opens
  useEffect(() => {
    if (open) setSelectedTags([])
  }, [open])

  return (
    <Modal
      animated
      open={open}
      header={
        <>
          <CircleCheckBig /> {t('order.confirmTitle')}
        </>
      }
      title={
        <div
          data-testid="confirm-total-row"
          className="text-[2rem] text-[#ecb05d]"
        >
          {t('order.total')}: ${total.toLocaleString()}
        </div>
      }
      width={960}
      height={560}
      closeOnBackdropClick={false}
      onClose={onClose}
      footer={
        <div className="flex w-full gap-3">
          <RippleButton
            onClick={onClose}
            rippleColor="rgba(0, 0, 0, 0.1)"
            className="flex-1 rounded-lg border h-14 border-black/8 bg-white/50 px-4 py-3 text-md text-gray-600 transition hover:-translate-y-0.5"
          >
            {t('common.cancel')}
          </RippleButton>
          <RippleButton
            onClick={() => onConfirm(selectedTags)}
            disabled={isSubmitting}
            className="flex flex-1 items-center h-14 justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-md text-white transition hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
            {t('order.confirmSubmit')}
          </RippleButton>
        </div>
      }
    >
      <ConfirmOrderContent
        groups={groups}
        selectedTags={selectedTags}
        onSelectedTagsChange={setSelectedTags}
        bentoCount={bentoCount}
        soupCount={soupCount}
        total={total}
      />
    </Modal>
  )
}
