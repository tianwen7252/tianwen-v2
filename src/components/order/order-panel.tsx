import { useState, useRef, useEffect } from 'react'
import { ClipboardList, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { notify } from '@/components/ui/sonner'
import { ScrollArea, type ScrollAreaHandle } from '@/components/ui/scroll-area'
import { RippleButton } from '@/components/ui/ripple-button'
import { useOrderStore } from '@/stores/order-store'
import { SwipeToDelete } from '@/components/ui/swipe-to-delete'
import { OrderItemRow } from './order-item-row'
import { OrderSummary } from './order-summary'
import { ConfirmOrderModal } from './confirm-order-modal'
import { ChangePrediction } from './change-prediction'

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderPanelProps {
  /** Override submit button behavior. When provided, clicking submit calls this instead of opening ConfirmOrderModal. */
  readonly onSubmitClick?: () => void
  /** Custom submit button label (default: t('order.submit')) */
  readonly submitLabel?: string
  /** Custom submit button color (CSS color value) */
  readonly submitColor?: string
  /** Override SwipeToDelete foreground background class (default: 'bg-card'). Use 'bg-transparent' inside modals. */
  readonly swipeForegroundClassName?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

/** Main order panel (right sidebar) wiring store data to presentational components */
export function OrderPanel({
  onSubmitClick,
  submitLabel,
  submitColor,
  swipeForegroundClassName,
}: OrderPanelProps) {
  const items = useOrderStore(s => s.items)
  const discounts = useOrderStore(s => s.discounts)
  const removeItem = useOrderStore(s => s.removeItem)
  const updateQuantity = useOrderStore(s => s.updateQuantity)
  const updateNote = useOrderStore(s => s.updateNote)
  const getTotal = useOrderStore(s => s.getTotal)
  const getBentoCount = useOrderStore(s => s.getBentoCount)
  const getSoupCount = useOrderStore(s => s.getSoupCount)
  const getItemCount = useOrderStore(s => s.getItemCount)
  const clearCart = useOrderStore(s => s.clearCart)
  const submitOrder = useOrderStore(s => s.submitOrder)
  const lastAddedItem = useOrderStore(s => s.lastAddedItem)

  const quickSubmit = useOrderStore(s => s.quickSubmit)

  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const scrollRef = useRef<ScrollAreaHandle>(null)

  // Scroll to the last added/updated item
  useEffect(() => {
    if (!lastAddedItem) return
    const el = scrollRef.current?.el
    if (!el) return
    const target = el.querySelector(`[data-cart-item-id="${lastAddedItem[0]}"]`)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [lastAddedItem])

  const total = getTotal()
  const bentoCount = getBentoCount()
  const soupCount = getSoupCount()
  const itemCount = getItemCount()
  const isEmpty = items.length === 0

  const handleSubmit = async (memoTags: string[]) => {
    setIsSubmitting(true)
    try {
      await submitOrder(memoTags)
      setConfirmOpen(false)
      notify.success(t('order.submitSuccess'))
    } catch {
      notify.error(t('order.submitError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  /** Quick submit — bypass confirmation modal and submit immediately */
  const handleQuickSubmit = async () => {
    setIsSubmitting(true)
    try {
      await submitOrder([])
      notify.success(t('order.submitSuccess'))
    } catch {
      notify.error(t('order.submitError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Determine the effective submit handler: custom > quick > default (open modal)
  const isQuickMode = quickSubmit && !onSubmitClick

  return (
    <div className="flex h-full flex-col gap-4 px-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ClipboardList className="size-5" />
        <h3 className="text-base">{t('order.currentOrder')}</h3>
        {itemCount > 0 && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
            {itemCount}
          </span>
        )}
        <div className="flex-1" />
        {itemCount > 0 && (
          <RippleButton
            aria-label={t('order.clearCart')}
            disabled={isEmpty}
            onClick={clearCart}
            rippleColor="rgba(0, 0, 0, 0.1)"
            className="size-8 rounded-md border border-border bg-background text-muted-foreground shadow-xs flex items-center gap-2 justify-center hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </RippleButton>
        )}
      </div>

      {/* Order items list */}
      <ScrollArea
        ref={scrollRef}
        className="flex-1"
        watchDeps={[items.length, lastAddedItem]}
      >
        {isEmpty ? (
          <p className="py-8 text-center text-muted-foreground">
            {t('order.emptyOrder')}
          </p>
        ) : (
          <div className="divide-y divide-border pr-2">
            {items.map(item => (
              <div key={item.id} data-cart-item-id={item.id}>
                <SwipeToDelete
                  onDelete={() => removeItem(item.id)}
                  foregroundClassName={swipeForegroundClassName}
                >
                  <OrderItemRow
                    item={item}
                    onRemove={removeItem}
                    onUpdateQuantity={updateQuantity}
                    onUpdateNote={updateNote}
                  />
                </SwipeToDelete>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Divider */}
      <hr className="border-border" />

      {/* Order summary with optional change prediction */}
      <OrderSummary bentoCount={bentoCount} soupCount={soupCount} total={total}>
        {isQuickMode && <ChangePrediction total={total} />}
      </OrderSummary>

      {/* Submit button */}
      <RippleButton
        className="h-14 w-full rounded-md bg-primary px-6 text-md text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        disabled={isEmpty || isSubmitting}
        onClick={
          onSubmitClick ??
          (isQuickMode ? handleQuickSubmit : () => setConfirmOpen(true))
        }
        style={submitColor ? { backgroundColor: submitColor } : undefined}
      >
        {submitLabel ?? t('order.submit')}
      </RippleButton>

      {/* Confirm order modal — only rendered when using default non-quick submit behavior */}
      {!onSubmitClick && !quickSubmit && (
        <ConfirmOrderModal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleSubmit}
          items={items}
          discounts={discounts}
          total={total}
          bentoCount={bentoCount}
          soupCount={soupCount}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}
