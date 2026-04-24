import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { RippleButton } from '@/components/ui/ripple-button'
import { tutorialAnchor } from '@/lib/tutorial/tutorial-anchor'
import type { Discount } from '@/stores/order-store'

export interface DiscountSectionProps {
  readonly discounts: readonly Discount[]
  readonly onRemoveDiscount: (discountId: string) => void
}

/** Discount section displaying applied discount tags with remove capability */
export function DiscountSection({
  discounts,
  onRemoveDiscount,
}: DiscountSectionProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-2" {...tutorialAnchor('order.discount')}>
      <h4 className="text-sm font-medium text-muted-foreground">
        {t('order.discount')} ({t('order.discountHint')})
      </h4>

      {discounts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {discounts.map(discount => (
            <span
              key={discount.id}
              data-testid="discount-tag"
              className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-base"
            >
              {discount.label} -${discount.amount.toLocaleString()}
              <RippleButton
                aria-label="remove"
                onClick={() => onRemoveDiscount(discount.id)}
                className="inline-flex size-6 items-center justify-center rounded outline-none hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                <X className="size-3" />
              </RippleButton>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
