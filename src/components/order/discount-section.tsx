import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    <div className="flex flex-col gap-2">
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
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="remove"
                onClick={() => onRemoveDiscount(discount.id)}
                className="size-4 hover:text-destructive"
              >
                <X className="size-3" />
              </Button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
