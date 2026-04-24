import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CircleCheckBig, LoaderCircle } from 'lucide-react'
import { Modal } from '@/components/modal/modal'
import { RippleButton } from '@/components/ui/ripple-button'
import { logError } from '@/lib/error-logger'
import { ProductGrid } from '@/components/order/product-grid'
import { OrderPanel } from '@/components/order/order-panel'
import { ConfirmOrderContent } from '@/components/order/confirm-order-content'
import { useOrderStore } from '@/stores/order-store'
import { getOrderRepo } from '@/lib/repositories/provider'
import { groupCartItems } from '@/lib/group-cart-items'
import { notify } from '@/components/ui/sonner'
import type { Order } from '@/lib/schemas'

// ─── Constants ───────────────────────────────────────────────────────────────

const EDIT_BUTTON_COLOR = '#4A90D9'

// ─── Types ───────────────────────────────────────────────────────────────────

type EditMode = 'ordering' | 'confirming'

interface EditOrderModalProps {
  readonly open: boolean
  readonly order: Order | null
  readonly typeIdMap: ReadonlyMap<string, string>
  readonly onClose: () => void
  readonly onSaved: () => void
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Modal for editing an existing order.
 * Two modes:
 * - ordering: Large modal with ProductGrid + OrderPanel (same layout as OrderPage)
 * - confirming: Small modal with ConfirmOrderContent and confirm/cancel buttons
 *
 * Transitions between modes animate smoothly using the Modal's transition prop.
 */
export function EditOrderModal({
  open,
  order,
  typeIdMap,
  onClose,
  onSaved,
}: EditOrderModalProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<EditMode>('ordering')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Read cart state from store for confirming mode
  const items = useOrderStore(s => s.items)
  const discounts = useOrderStore(s => s.discounts)
  const getTotal = useOrderStore(s => s.getTotal)
  const getBentoCount = useOrderStore(s => s.getBentoCount)
  const getSoupCount = useOrderStore(s => s.getSoupCount)

  // Load order into store when modal opens; clear cart when it closes
  useEffect(() => {
    if (open && order) {
      useOrderStore.getState().loadOrder(order, typeIdMap)
      setMode('ordering')
      setSelectedTags([])
    } else if (!open) {
      useOrderStore.getState().clearCart()
    }
  }, [open, order, typeIdMap])

  // Derive values for confirming mode
  const total = getTotal()
  const bentoCount = getBentoCount()
  const soupCount = getSoupCount()
  const groups = groupCartItems(items, discounts)

  /** Handle confirm edit — update the order via repository */
  async function handleConfirm() {
    if (!order) return
    setIsSubmitting(true)
    try {
      const repo = getOrderRepo()
      // Collect non-empty notes, prepended by memoTags
      const itemNotes = items.map(item => item.note).filter(note => note !== '')
      const memo = [...selectedTags, ...itemNotes]

      await repo.update(order.id, {
        number: order.number,
        items: items.map(item => ({
          commodityId: item.commodityId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          includesSoup: item.includesSoup,
        })),
        discounts: discounts.map(d => ({
          label: d.label,
          amount: d.amount,
        })),
        memo,
        soups: soupCount,
        total,
        originalTotal: useOrderStore.getState().getSubtotal(),
        editor: useOrderStore.getState().operatorId ?? '',
      })

      onClose()
      onSaved()
      notify.success(t('order.editSuccess'))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logError(
        msg,
        'EditOrderModal.handleConfirm',
        err instanceof Error ? err.stack : undefined,
      )
      notify.error(t('order.editError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Ordering mode ──────────────────────────────────────────────────────────
  if (mode === 'ordering') {
    return (
      <Modal
        animated
        transition
        open={open}
        width="95vw"
        height="90vh"
        closeOnBackdropClick={false}
        onClose={onClose}
      >
        <div className="flex h-full gap-0">
          <div className="relative flex-60">
            <div className="h-full overflow-y-auto px-4 pl-0 py-2">
              <ProductGrid compactCalculator />
            </div>
          </div>
          <div className="flex-40 overflow-y-auto border-l border-border">
            <OrderPanel
              onSubmitClick={() => setMode('confirming')}
              submitLabel={`${t('order.editOrder')}#${order?.number ?? ''}`}
              submitColor={EDIT_BUTTON_COLOR}
              swipeForegroundClassName="bg-transparent"
            />
          </div>
        </div>
      </Modal>
    )
  }

  // ─── Confirming mode ────────────────────────────────────────────────────────
  return (
    <Modal
      animated
      transition
      open={open}
      width={960}
      height={560}
      closeOnBackdropClick={false}
      onClose={onClose}
      header={
        <>
          <CircleCheckBig /> {t('order.editTitle')}#{order?.number ?? ''}
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
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex flex-1 items-center h-14 justify-center gap-2 rounded-lg px-4 py-3 text-md text-white transition hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: EDIT_BUTTON_COLOR }}
          >
            {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
            {t('order.confirmEdit')}
          </RippleButton>
        </div>
      }
    >
      {/* ArrowLeft back button — positioned in top-left */}
      <RippleButton
        data-testid="edit-order-back-button"
        onClick={() => setMode('ordering')}
        rippleColor="rgba(0,0,0,0.1)"
        className="absolute left-2 top-2 z-10 flex size-10 items-center justify-center rounded-full text-gray-400 hover:text-gray-600"
      >
        <ArrowLeft size={24} />
      </RippleButton>

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
