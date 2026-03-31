import { useMemo, useState, useRef, useEffect } from 'react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, MoveDown } from 'lucide-react'
import { SwipeActions } from '@/components/ui/swipe-actions'
import type { Order } from '@/lib/schemas'
import { formatCurrency } from '@/lib/currency'
import { groupOrderItems } from '@/lib/group-order-items'
import {
  CATEGORY_ACCENT,
  DEFAULT_ACCENT,
} from '@/lib/constants/category-accent'
import type { SwipeAction } from '@/components/ui/swipe-actions'
import { RippleButton } from '@/components/ui/ripple-button'

// ─── Constants ───────────────────────────────────────────────────────────────

const EDIT_ACTION_COLOR = '#a1c185'
const DELETE_ACTION_COLOR = '#ef4444'
const CARD_MAX_HEIGHT = 400

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OrderHistoryCardProps {
  readonly order: Order
  readonly typeIdMap: ReadonlyMap<string, string>
  readonly onDelete: () => void
  readonly onEdit?: () => void
  /** When changed, close any open swipe actions on this card */
  readonly resetKey?: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build the list of swipe actions — always includes edit and delete */
function buildSwipeActions(
  onDelete: () => void,
  t: (key: string) => string,
  onEdit?: () => void,
): readonly SwipeAction[] {
  return [
    {
      key: 'edit',
      icon: <Pencil size={20} color="#fff" />,
      color: EDIT_ACTION_COLOR,
      label: t('common.edit'),
      onClick: onEdit ?? (() => {}),
    },
    {
      key: 'delete',
      icon: <Trash2 size={20} color="#fff" />,
      color: DELETE_ACTION_COLOR,
      label: t('common.delete'),
      onClick: onDelete,
    },
  ]
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Displays a single historical order as a card wrapped in SwipeActions.
 * Shows categorized item list grouped by commodity type.
 * Swipe left to reveal edit and delete action buttons.
 */
export function OrderHistoryCard({
  order,
  typeIdMap,
  onDelete,
  onEdit,
  resetKey,
}: OrderHistoryCardProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Detect if card content exceeds max height
  useEffect(() => {
    const el = cardRef.current
    if (!el || expanded) return
    setOverflows(el.scrollHeight > CARD_MAX_HEIGHT)
  }, [order, expanded])

  // AM/PM format for time display
  const formattedTime = dayjs(order.createdAt).format('h:mm A')
  const isDiscounted =
    order.originalTotal !== undefined && order.originalTotal > order.total
  const actions = buildSwipeActions(onDelete, t, onEdit)
  const hasUpdate = order.updatedAt !== order.createdAt

  // Group items by category using the commodity lookup map
  const groups = useMemo(
    () => groupOrderItems(order.items, order.discounts, typeIdMap),
    [order.items, order.discounts, typeIdMap],
  )

  return (
    <SwipeActions
      actions={actions}
      className="rounded-xl border border-border"
      resetKey={resetKey}
    >
      <div
        ref={cardRef}
        data-testid="order-history-card"
        className="relative rounded-xl bg-card p-4 flex flex-col overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={expanded ? undefined : { maxHeight: CARD_MAX_HEIGHT }}
      >
        {/* Row 1: Order number + time */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-base">#{order.number}</span>
          <span className="text-sm text-muted-foreground">{formattedTime}</span>
        </div>

        {/* Row 2: Categorized items */}
        <div className="flex flex-col gap-2 mb-2">
          {groups.map(group => {
            const accent = CATEGORY_ACCENT[group.key] ?? DEFAULT_ACCENT
            return (
              <div
                key={group.key}
                className={`border-l-3 pl-3 ${accent.border}`}
              >
                <div className={`mb-1 text-md tracking-wide ${accent.text}`}>
                  {t(group.label)}
                </div>
                {group.items.map(item => (
                  <div
                    key={item.id}
                    className="flex items-baseline justify-between py-[3px]"
                  >
                    <span
                      className={`text-md ${item.commodityId.startsWith('custom-') ? 'text-(--color-red)' : 'text-gray-800'}`}
                    >
                      {item.name}
                    </span>
                    <span className="mx-2 flex-1 border-b border-dotted border-gray-300" />
                    <span className="text-gray-400">x{item.quantity}</span>
                    <span className="ml-2 text-md text-gray-600">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
                {group.discounts?.map(discount => (
                  <div
                    key={discount.id}
                    className="flex items-baseline justify-between py-[3px]"
                  >
                    <span className="text-md text-gray-800">
                      {discount.label}
                    </span>
                    <span className="mx-2 flex-1 border-b border-dotted border-gray-300" />
                    <span className="ml-2 text-md text-(--color-red)">
                      -{formatCurrency(discount.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {/* Row 3: Memo tags */}
        {order.memo.length > 0 && (
          <div data-testid="memo-tags" className="flex gap-1.5 mb-2">
            {order.memo.map(tag => (
              <span
                key={tag}
                className="inline-block px-2 py-0.5 text-xs rounded-lg bg-[#F8F4EC] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Row 4: Update time (left) + Total price (right) */}
        <div className="flex items-baseline justify-between mt-auto">
          {/* Left: update time */}
          {hasUpdate ? (
            <span className="text-xs text-muted-foreground flex gap-1">
              <Pencil size={14} />
              {dayjs(order.updatedAt).format('YYYY/MM/DD HH:mm:ss')}
            </span>
          ) : (
            <span />
          )}
          {/* Right: total price */}
          <div className="flex items-baseline gap-2">
            {isDiscounted && (
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(order.originalTotal, { allowEmpty: true })}
              </span>
            )}
            <span className="text-lg">{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Gradient overlay + expand button — only when content exceeds max height */}
        {overflows && !expanded && (
          <div
            data-testid="card-expand-overlay"
            className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center justify-end rounded-b-xl pb-3 pt-16"
            style={{
              background:
                'linear-gradient(to bottom, transparent, rgba(255,255,255,0.85) 40%, rgba(255,255,255,1))',
            }}
          >
            <RippleButton
              rippleColor="rgba(0,0,0,0.1)"
              className="pointer-events-auto flex items-center gap-1 text-md text-muted-foreground transition hover:text-foreground"
              onClick={e => {
                e.stopPropagation()
                setExpanded(true)
              }}
            >
              <MoveDown size={16} />
              {t('orders.viewAll')}
            </RippleButton>
          </div>
        )}
      </div>
    </SwipeActions>
  )
}
