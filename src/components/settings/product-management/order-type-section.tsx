/**
 * OrderTypeSection -- Section with sortable list of order types.
 * All changes are local-only until the parent calls save() via SectionRef.
 * Supports add/edit/delete with modals, drag reorder, and max of 10 types.
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { nanoid } from 'nanoid'
import { Plus } from 'lucide-react'
import { ConfirmModal } from '@/components/modal'
import { RippleButton } from '@/components/ui/ripple-button'
import { SwipeToDelete } from '@/components/ui/swipe-to-delete'
import { getOrderTypeRepo } from '@/lib/repositories'
import { useDbQuery } from '@/hooks/use-db-query'
import { SortableList } from './sortable-list'
import { OrderTypeCard } from './order-type-card'
import { OrderTypeForm } from './order-type-form'
import type { OrderType } from '@/lib/schemas'
import type { OrderTypeFormValues } from '@/lib/form-schemas'
import type { SectionRef, ChangeSummaryItem } from './types'

// ── Constants ─────────────────────────────────────────────────────────────

const MAX_ORDER_TYPES = 10
const TEMP_ID_PREFIX = 'temp-'

function isTempId(id: string): boolean {
  return id.startsWith(TEMP_ID_PREFIX)
}

// ── Pending change types ─────────────────────────────────────────────────

interface PendingAdd {
  readonly orderType: OrderType
}

interface PendingEdit {
  readonly id: string
  readonly originalName: string
  readonly changes: Partial<{ name: string; color: string }>
}

// ── Component ─────────────────────────────────────────────────────────────

interface OrderTypeSectionProps {
  readonly refreshKey: number
  readonly onHasChanges: (has: boolean) => void
  readonly sectionRef: React.RefObject<SectionRef | null>
}

export function OrderTypeSection({
  refreshKey,
  onHasChanges,
  sectionRef,
}: OrderTypeSectionProps) {
  const { t } = useTranslation()

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingOrderType, setEditingOrderType] = useState<OrderType | null>(
    null,
  )
  const [deleteTarget, setDeleteTarget] = useState<OrderType | null>(null)

  // Pending local changes
  const [pendingAdds, setPendingAdds] = useState<readonly PendingAdd[]>([])
  const [pendingEdits, setPendingEdits] = useState<readonly PendingEdit[]>([])
  const [pendingDeletes, setPendingDeletes] = useState<ReadonlySet<string>>(
    new Set(),
  )
  const [reorderedIds, setReorderedIds] = useState<readonly string[] | null>(
    null,
  )

  // Load order types from DB
  const dbOrderTypes = useDbQuery(
    () => getOrderTypeRepo().findAll(),
    [refreshKey],
    [] as OrderType[],
  )

  // Reset local state on refreshKey change
  const [prevRefreshKey, setPrevRefreshKey] = useState(refreshKey)
  if (prevRefreshKey !== refreshKey) {
    setPrevRefreshKey(refreshKey)
    setPendingAdds([])
    setPendingEdits([])
    setPendingDeletes(new Set())
    setReorderedIds(null)
  }

  // Build displayed order types
  const displayedOrderTypes = useMemo(() => {
    // Start with DB items, filter out pending deletes
    let items = dbOrderTypes.filter(ot => !pendingDeletes.has(ot.id))

    // Apply pending edits
    items = items.map(ot => {
      const edit = pendingEdits.find(e => e.id === ot.id)
      if (!edit) return ot
      return { ...ot, ...edit.changes }
    })

    // Add pending adds
    const addsItems = pendingAdds.map(a => a.orderType)
    items = [...items, ...addsItems]

    // Apply reorder if present
    if (reorderedIds) {
      const ordered: OrderType[] = []
      for (const id of reorderedIds) {
        const item = items.find(ot => ot.id === id)
        if (item) ordered.push(item)
      }
      // Add items not in the reorder list
      for (const item of items) {
        if (!reorderedIds.includes(item.id)) ordered.push(item)
      }
      items = ordered.map((ot, i) => ({ ...ot, priority: i + 1 }))
    }

    return items
  }, [dbOrderTypes, pendingAdds, pendingEdits, pendingDeletes, reorderedIds])

  const isMaxReached = displayedOrderTypes.length >= MAX_ORDER_TYPES

  // Check if there are any pending changes
  const hasChanges =
    pendingAdds.length > 0 ||
    pendingEdits.length > 0 ||
    pendingDeletes.size > 0 ||
    reorderedIds !== null

  // Notify parent of changes
  useEffect(() => {
    onHasChanges(hasChanges)
  }, [hasChanges, onHasChanges])

  // Expose SectionRef
  const sectionRefValue: SectionRef = useMemo(
    () => ({
      async save(): Promise<void> {
        // Write pending adds
        for (const add of pendingAdds) {
          const {
            id: _tempId,
            createdAt: _c,
            updatedAt: _u,
            ...data
          } = add.orderType
          await getOrderTypeRepo().create(data)
        }

        // Write pending edits
        for (const edit of pendingEdits) {
          await getOrderTypeRepo().update(edit.id, edit.changes)
        }

        // Write pending deletes
        for (const id of pendingDeletes) {
          await getOrderTypeRepo().remove(id)
        }

        // Write reorder
        if (reorderedIds) {
          const realIds = [...reorderedIds].filter(id => !isTempId(id))
          if (realIds.length > 0) {
            await getOrderTypeRepo().updatePriorities(realIds)
          }
        }
      },

      getChangeSummary(): readonly ChangeSummaryItem[] {
        const items: ChangeSummaryItem[] = []

        for (const add of pendingAdds) {
          items.push({
            type: 'add',
            description: t('productMgmt.orderTypes.summaryAdded', {
              name: add.orderType.name,
            }),
          })
        }

        for (const edit of pendingEdits) {
          const details: string[] = []
          if (edit.changes.name)
            details.push(
              `${t('productMgmt.orderTypes.summaryFieldName')}: ${edit.changes.name}`,
            )
          if (edit.changes.color !== undefined)
            details.push(
              `${t('productMgmt.orderTypes.summaryFieldColor')}: ${edit.changes.color || t('productMgmt.orderTypes.summaryFieldColorNone')}`,
            )
          items.push({
            type: 'edit',
            description: `${t('productMgmt.orderTypes.summaryEdited', { name: edit.originalName })}${details.length > 0 ? `（${details.join('、')}）` : ''}`,
          })
        }

        for (const id of pendingDeletes) {
          const item = dbOrderTypes.find(ot => ot.id === id)
          items.push({
            type: 'delete',
            description: t('productMgmt.orderTypes.summaryDeleted', {
              name: item?.name ?? id,
            }),
          })
        }

        if (reorderedIds) {
          const names = reorderedIds
            .map(id => {
              const db = dbOrderTypes.find(ot => ot.id === id)
              const added = pendingAdds.find(a => a.orderType.id === id)
              return db?.name ?? added?.orderType.name ?? id
            })
            .join(' → ')
          items.push({
            type: 'reorder',
            description: `${t('productMgmt.orderTypes.title')}：${names}`,
          })
        }

        return items
      },
    }),
    [pendingAdds, pendingEdits, pendingDeletes, reorderedIds, dbOrderTypes, t],
  )

  // Keep sectionRef.current up to date
  useEffect(() => {
    if (sectionRef) {
      ;(sectionRef as React.MutableRefObject<SectionRef | null>).current =
        sectionRefValue
    }
  }, [sectionRef, sectionRefValue])

  // ── Handlers ──────────────────────────────────────────────────────────

  // Add order type
  const handleAdd = useCallback(() => {
    setEditingOrderType(null)
    setIsFormOpen(true)
  }, [])

  // Edit order type
  const handleEdit = useCallback((orderType: OrderType) => {
    setEditingOrderType(orderType)
    setIsFormOpen(true)
  }, [])

  // Close form modal
  const handleFormClose = useCallback(() => {
    setIsFormOpen(false)
    setEditingOrderType(null)
  }, [])

  // Form submit (add or edit) -- local only
  const handleFormSubmit = useCallback(
    async (values: OrderTypeFormValues) => {
      if (editingOrderType) {
        // Edit mode
        if (isTempId(editingOrderType.id)) {
          // Update within pendingAdds
          setPendingAdds(prev =>
            prev.map(a =>
              a.orderType.id === editingOrderType.id
                ? {
                    ...a,
                    orderType: {
                      ...a.orderType,
                      name: values.name,
                      color: values.color,
                    },
                  }
                : a,
            ),
          )
        } else {
          // Add or update in pendingEdits
          setPendingEdits(prev => {
            const existing = prev.find(e => e.id === editingOrderType.id)
            if (existing) {
              return prev.map(e =>
                e.id === editingOrderType.id
                  ? {
                      ...e,
                      changes: {
                        ...e.changes,
                        name: values.name,
                        color: values.color,
                      },
                    }
                  : e,
              )
            }
            return [
              ...prev,
              {
                id: editingOrderType.id,
                originalName: editingOrderType.name,
                changes: { name: values.name, color: values.color },
              },
            ]
          })
        }
      } else {
        // Add mode -- create temp order type locally
        const maxPriority = displayedOrderTypes.reduce(
          (max, ot) => Math.max(max, ot.priority),
          0,
        )

        const tempOrderType: OrderType = {
          id: `${TEMP_ID_PREFIX}${nanoid()}`,
          name: values.name,
          priority: maxPriority + 1,
          type: 'order',
          color: values.color,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        setPendingAdds(prev => [...prev, { orderType: tempOrderType }])
      }

      handleFormClose()
    },
    [editingOrderType, displayedOrderTypes, handleFormClose],
  )

  // Delete order type
  const handleDeleteClick = useCallback((orderType: OrderType) => {
    setDeleteTarget(orderType)
  }, [])

  // Confirm deletion -- local only
  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return

    if (isTempId(deleteTarget.id)) {
      // Remove from pendingAdds
      setPendingAdds(prev =>
        prev.filter(a => a.orderType.id !== deleteTarget.id),
      )
    } else {
      // Add to pendingDeletes
      setPendingDeletes(prev => new Set([...prev, deleteTarget.id]))
      // Remove any pending edits
      setPendingEdits(prev => prev.filter(e => e.id !== deleteTarget.id))
    }

    setDeleteTarget(null)
  }, [deleteTarget])

  // Cancel deletion
  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null)
  }, [])

  // Drag reorder -- local only
  const handleReorder = useCallback((orderedIds: readonly string[]) => {
    setReorderedIds(orderedIds)
  }, [])

  return (
    <section className="mb-8">
      {/* Header with title and add button */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg text-foreground">
          {t('productMgmt.orderTypes.title')}
        </h2>
        <RippleButton
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-base text-foreground hover:bg-accent disabled:opacity-50"
          onClick={handleAdd}
          disabled={isMaxReached}
          title={
            isMaxReached ? t('productMgmt.orderTypes.maxReached') : undefined
          }
        >
          <Plus size={16} />
          {t('productMgmt.orderTypes.addType')}
        </RippleButton>
      </div>

      {/* Sortable order type list */}
      <SortableList
        items={displayedOrderTypes}
        getId={ot => ot.id}
        renderItem={(orderType, dragHandleProps) => {
          const card = (
            <OrderTypeCard
              orderType={orderType}
              dragHandleProps={dragHandleProps}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          )
          return dragHandleProps.isOverlay ? (
            card
          ) : (
            <SwipeToDelete onDelete={() => handleDeleteClick(orderType)}>
              {card}
            </SwipeToDelete>
          )
        }}
        onReorder={handleReorder}
      />

      {/* Add/Edit form modal */}
      <OrderTypeForm
        open={isFormOpen}
        orderType={editingOrderType}
        onSubmit={handleFormSubmit}
        onClose={handleFormClose}
      />

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title={t('productMgmt.orderTypes.deleteConfirmTitle')}
        variant="red"
        shineColor="red"
        confirmText={t('common.confirm')}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      >
        {deleteTarget && (
          <p className="text-center text-base text-foreground">
            {t('productMgmt.orderTypes.deleteConfirmMessage', {
              name: deleteTarget.name,
            })}
          </p>
        )}
      </ConfirmModal>
    </section>
  )
}
