/**
 * OrderTypeCard -- Draggable order type card for the sortable list.
 * Displays type info, color dot, default badge, and edit/delete action buttons.
 * Default order types (id starts with 'ot-') cannot be deleted.
 */

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import { RippleButton } from '@/components/ui/ripple-button'
import { ShineBorder } from '@/components/ui/shine-border'
import { SHINE_COLOR_PRESETS } from '@/constants/shine-colors'
import { cn } from '@/lib/cn'
import type { OrderType } from '@/lib/schemas'
import type { DragHandleProps } from './sortable-list'

interface OrderTypeCardProps {
  readonly orderType: OrderType
  readonly dragHandleProps: DragHandleProps
  readonly onEdit: (orderType: OrderType) => void
  readonly onDelete: (orderType: OrderType) => void
}

/** Check whether an order type is a system default (id starts with 'ot-'). */
function isDefaultOrderType(id: string): boolean {
  return id.startsWith('ot-')
}

export function OrderTypeCard({
  orderType,
  dragHandleProps,
  onEdit,
  onDelete,
}: OrderTypeCardProps) {
  const { t } = useTranslation()

  const isDefault = isDefaultOrderType(orderType.id)

  const handleEdit = useCallback(() => {
    onEdit(orderType)
  }, [orderType, onEdit])

  const handleDelete = useCallback(() => {
    onDelete(orderType)
  }, [orderType, onDelete])

  return (
    <div
      className={cn(
        'relative flex items-center gap-3 rounded-lg border border-border bg-card p-3',
      )}
    >
      {dragHandleProps.isOverlay && (
        <ShineBorder
          shineColor={SHINE_COLOR_PRESETS.green}
          duration={4}
          borderWidth={2}
        />
      )}
      {/* Drag handle */}
      <div
        data-testid="drag-handle"
        className="flex shrink-0 cursor-grab items-center justify-center touch-none"
        style={{ width: 44, height: 44 }}
        {...dragHandleProps.attributes}
        {...dragHandleProps.listeners}
      >
        <GripVertical size={20} className="text-muted-foreground" />
      </div>

      {/* Priority badge */}
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-base text-muted-foreground">
        {orderType.priority}
      </span>

      {/* Name */}
      <span className="min-w-0 flex-1 truncate text-base text-foreground">
        {orderType.name}
      </span>

      {/* Default badge */}
      {isDefault && (
        <span
          data-testid="default-badge"
          className="shrink-0 px-2 py-0.5 text-base"
          style={{ color: '#a3c8d7' }}
        >
          {t('productMgmt.orderTypes.defaultBadge')}
        </span>
      )}

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <RippleButton
          data-testid="edit-button"
          aria-label={t('common.edit')}
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={handleEdit}
        >
          <Pencil size={16} />
        </RippleButton>
        {!isDefault && (
          <RippleButton
            data-testid="delete-button"
            aria-label={t('common.delete')}
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 size={16} />
          </RippleButton>
        )}
      </div>
    </div>
  )
}
