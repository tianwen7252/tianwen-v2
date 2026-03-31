/**
 * CommodityCard -- Draggable product card for the sortable list.
 * Displays product info, tags, and edit/delete action buttons.
 * Drag handle receives DragHandleProps from SortableList.
 */

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { GripVertical, Pencil, Trash2, Soup } from 'lucide-react'
import { RippleButton } from '@/components/ui/ripple-button'
import { ShineBorder } from '@/components/ui/shine-border'
import { cn } from '@/lib/cn'
import type { Commodity } from '@/lib/schemas'
import type { DragHandleProps } from './sortable-list'

interface CommodityCardProps {
  readonly commodity: Commodity
  readonly dragHandleProps: DragHandleProps
  readonly onEdit: (commodity: Commodity) => void
  readonly onDelete: (commodity: Commodity) => void
}

export function CommodityCard({
  commodity,
  dragHandleProps,
  onEdit,
  onDelete,
}: CommodityCardProps) {
  const { t } = useTranslation()

  const handleEdit = useCallback(() => {
    onEdit(commodity)
  }, [commodity, onEdit])

  const handleDelete = useCallback(() => {
    onDelete(commodity)
  }, [commodity, onDelete])

  return (
    <div className={cn(
      'relative flex items-center gap-3 rounded-lg border border-border bg-card p-3',
    )}>
      {dragHandleProps.isOverlay && (
        <ShineBorder shineColor={['#a8c896', '#c8deb8', '#e4fad9']} duration={4} borderWidth={2} />
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
        {commodity.priority}
      </span>

      {/* Name and price */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="truncate text-base text-foreground">
          {commodity.name}
        </span>
        <span className="shrink-0 text-base text-muted-foreground">
          ${commodity.price}
        </span>
      </div>

      {/* Tags row */}
      <div className="flex shrink-0 items-center gap-2">
        {commodity.includesSoup && (
          <span
            data-testid="soup-tag"
            className="flex items-center gap-1 px-2 py-0.5 text-base"
            style={{ color: '#a3c8d7' }}
          >
            <Soup size={14} />
            {t('productMgmt.commodities.includesSoup')}
          </span>
        )}
      </div>

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
        <RippleButton
          data-testid="delete-button"
          aria-label={t('common.delete')}
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 size={16} />
        </RippleButton>
      </div>
    </div>
  )
}
