import { useTranslation } from 'react-i18next'
import { HandCoins } from 'lucide-react'
import { getChange } from '@/lib/get-change'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChangePredictionProps {
  readonly total: number
  /** Use smaller text for compact contexts (e.g., confirm modal) */
  readonly compact?: boolean
}

// ─── Color Map ──────────────────────────────────────────────────────────────

/** Background color class per bill denomination. */
const BILL_COLOR_MAP: Record<number, string> = {
  1000: 'text-[#3f6ab0]',
  500: 'text-[#ae917d]',
  100: 'text-[#f38590]',
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Renders colored pill badges predicting change for common bill denominations.
 * Returns null when no predictions are available.
 */
export function ChangePrediction({
  total,
  compact = false,
}: ChangePredictionProps) {
  const { t } = useTranslation()
  const predictions = getChange(total)

  if (!predictions || predictions.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <HandCoins className="text-gray-500" />
        {predictions.map(([bill, money, change]) => (
          <span
            key={`${bill}-${money}`}
            data-testid="change-badge"
            className={`inline-flex items-center ml-0 mr-2 ${compact ? 'text-base' : 'text-md'} ${BILL_COLOR_MAP[bill] ?? ''}`}
          >
            ${money} {t('order.change')} ${change}
          </span>
        ))}
      </div>
    </div>
  )
}
