import { Utensils, Soup } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export interface OrderSummaryProps {
  readonly bentoCount: number
  readonly soupCount: number
  readonly total: number
  /** Optional content rendered between bento/soup counts and total (e.g., ChangePrediction) */
  readonly children?: React.ReactNode
}

/** Order summary displaying bento/soup counts and total */
export function OrderSummary({
  bentoCount,
  soupCount,
  total,
  children,
}: OrderSummaryProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-2">
      {/* Bento + Soup count row (only when bento items exist) */}
      {bentoCount > 0 && (
        <div
          data-testid="bento-soup-row"
          className="flex items-center gap-4 text-base text-muted-foreground"
        >
          <span className="flex items-center gap-1">
            <Utensils className="size-4" />
            {t('order.bentoCount', { count: bentoCount })}
          </span>
          <span className="flex items-center gap-1">
            <Soup className="size-4" />
            {t('order.soupCount', { count: soupCount })}
          </span>
        </div>
      )}

      {/* Optional slot (e.g., ChangePrediction in quick submit mode) */}
      {children}

      {/* Total row */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xl">{t('order.total')}</span>
        <span data-testid="total-value" className="text-3xl">
          ${total.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
