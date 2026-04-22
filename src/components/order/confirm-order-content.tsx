import { useTranslation } from 'react-i18next'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Utensils, Soup } from 'lucide-react'
import { ChangePrediction } from './change-prediction'
import { OrderNoteTags } from './order-note-tags'
import {
  CATEGORY_ACCENT,
  DEFAULT_ACCENT,
} from '@/lib/constants/category-accent'
import type { CategoryGroup } from '@/lib/group-cart-items'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConfirmOrderContentProps {
  readonly groups: readonly CategoryGroup[]
  readonly selectedTags: readonly string[]
  readonly onSelectedTagsChange: (tags: string[]) => void
  readonly bentoCount: number
  readonly soupCount: number
  readonly total: number
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Inner content for the order confirmation modal.
 * Left panel shows categorized items; right panel contains order note tags,
 * change prediction, bento/soup counts.
 */
export function ConfirmOrderContent({
  groups,
  selectedTags,
  onSelectedTagsChange,
  bentoCount,
  soupCount,
  total,
}: ConfirmOrderContentProps) {
  const { t } = useTranslation()

  return (
    <div className="flex h-full gap-0">
      {/* ── Left panel: categorized items ── */}
      <ScrollArea className="flex-5" watchDeps={[groups]}>
        <div className="space-y-4 pr-5">
          {groups.map(group => {
            const accent = CATEGORY_ACCENT[group.key] ?? DEFAULT_ACCENT
            return (
              <div
                key={group.key}
                className={`border-l-3 pl-3 ${accent.border}`}
              >
                {/* Category label */}
                <div className={`mb-1.5 text-lg tracking-wide ${accent.text}`}>
                  {t(group.label)}
                </div>
                {/* Regular items */}
                {group.items.map(item => (
                  <div
                    key={item.id}
                    className="flex items-baseline justify-between py-[5px]"
                  >
                    <span
                      className={`text-lg ${item.commodityId.startsWith('custom-') ? 'text-(--color-red)' : 'text-gray-800'}`}
                    >
                      {item.name}
                    </span>
                    <span className="mx-2 flex-1 border-b border-dotted border-gray-300" />
                    <span className="text-gray-400">x{item.quantity}</span>
                    <span className="ml-3 min-w-[3.5rem] text-lg text-right tabular-nums text-gray-700">
                      ${(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
                {/* Discount items */}
                {group.discounts?.map(discount => (
                  <div
                    key={discount.id}
                    className="flex items-baseline justify-between py-[5px] text-[15px]"
                  >
                    <span className="text-lg text-gray-800">
                      {discount.label}
                    </span>
                    <span className="mx-2 flex-1 border-b border-dotted border-gray-300" />
                    <span className="min-w-[3.5rem] text-right tabular-nums text-(--color-red)">
                      -${discount.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* ── Divider ── */}
      <div className="mx-1 w-px bg-black/8" />

      {/* ── Right panel ── */}
      <div className="flex flex-5 flex-col gap-5 pl-5">
        {/* Order note tags */}
        <OrderNoteTags
          selectedTags={selectedTags}
          onSelectedTagsChange={onSelectedTagsChange}
        />

        {/* Change prediction + Bento/Soup counts + Total — pinned to bottom */}
        <div className="mt-auto flex flex-col gap-3">
          {bentoCount > 0 && (
            <div
              data-testid="confirm-bento-soup-row"
              className="flex items-center gap-4 text-sm text-gray-500"
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
          <ChangePrediction total={total} compact />
        </div>
      </div>
    </div>
  )
}
