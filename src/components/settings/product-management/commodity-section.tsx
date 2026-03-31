/**
 * CommoditySection -- Tabbed product management with drag-and-drop reordering.
 * All changes are local-only until the parent calls save() via SectionRef.
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { nanoid } from 'nanoid'
import { Plus } from 'lucide-react'
import { ConfirmModal } from '@/components/modal'
import { RippleButton } from '@/components/ui/ripple-button'
import { SwipeToDelete } from '@/components/ui/swipe-to-delete'
import {
  getCommodityTypeRepo,
  getCommodityRepo,
  getPriceChangeLogRepo,
} from '@/lib/repositories'
import { useDbQuery } from '@/hooks/use-db-query'
import { SortableList } from './sortable-list'
import { CommodityCard } from './commodity-card'
import { CommodityForm } from './commodity-form'
import type { CommodityType, Commodity } from '@/lib/schemas'
import type { CommodityFormValues } from '@/lib/form-schemas'
import type { SectionRef, ChangeSummaryItem } from './types'

// ── Color mapping for tab pill styling using theme variables ──────────────

const TAB_COLOR_MAP: Record<string, string> = {
  bento: '#7f956a',
  single: '#d4a76a',
  drink: '#6aa3d4',
  dumpling: '#c47fd4',
}

function resolveTabColor(typeId: string): string {
  return TAB_COLOR_MAP[typeId] ?? '#7f956a'
}

// ── Temp ID helper ────────────────────────────────────────────────────────

const TEMP_ID_PREFIX = 'temp-'

function isTempId(id: string): boolean {
  return id.startsWith(TEMP_ID_PREFIX)
}

// ── Pending change types ─────────────────────────────────────────────────

interface PendingAdd {
  readonly commodity: Commodity
}

interface PendingEdit {
  readonly id: string
  readonly originalName: string
  readonly changes: Partial<{
    name: string
    price: number
    includesSoup: boolean
  }>
}

// ── Component ─────────────────────────────────────────────────────────────

interface CommoditySectionProps {
  readonly refreshKey: number
  readonly onHasChanges: (has: boolean) => void
  readonly sectionRef: React.RefObject<SectionRef | null>
}

export function CommoditySection({
  refreshKey,
  onHasChanges,
  sectionRef,
}: CommoditySectionProps) {
  const { t } = useTranslation()
  const [activeTypeId, setActiveTypeId] = useState<string | null>(null)

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCommodity, setEditingCommodity] = useState<Commodity | null>(
    null,
  )
  const [deleteTarget, setDeleteTarget] = useState<Commodity | null>(null)

  // Pending local changes
  const [pendingAdds, setPendingAdds] = useState<readonly PendingAdd[]>([])
  const [pendingEdits, setPendingEdits] = useState<readonly PendingEdit[]>([])
  const [pendingDeletes, setPendingDeletes] = useState<ReadonlySet<string>>(
    new Set(),
  )
  const [reorderedIds, setReorderedIds] = useState<
    ReadonlyMap<string, readonly string[]>
  >(new Map())

  // Load commodity types
  const commodityTypes = useDbQuery(
    () => getCommodityTypeRepo().findAll(),
    [refreshKey],
    [] as CommodityType[],
  )

  // Determine the selected type (first type as default)
  const selectedTypeId = activeTypeId ?? commodityTypes[0]?.typeId ?? null

  // Load commodities for the selected type
  const dbCommodities = useDbQuery(
    () =>
      selectedTypeId
        ? getCommodityRepo().findByTypeId(selectedTypeId)
        : Promise.resolve([]),
    [selectedTypeId, refreshKey],
    [] as Commodity[],
  )

  // Load all commodities for tab count badges
  const allDbCommodities = useDbQuery(
    () => getCommodityRepo().findOnMarket(),
    [refreshKey],
    [] as Commodity[],
  )

  // Reset local state on refreshKey change
  const [prevRefreshKey, setPrevRefreshKey] = useState(refreshKey)
  if (prevRefreshKey !== refreshKey) {
    setPrevRefreshKey(refreshKey)
    setPendingAdds([])
    setPendingEdits([])
    setPendingDeletes(new Set())
    setReorderedIds(new Map())
  }

  // Build the displayed commodities for current tab
  const displayedCommodities = useMemo(() => {
    if (!selectedTypeId) return []

    // Start with DB items, filter out pending deletes
    let items = dbCommodities.filter(c => !pendingDeletes.has(c.id))

    // Apply pending edits to existing items
    items = items.map(c => {
      const edit = pendingEdits.find(e => e.id === c.id)
      if (!edit) return c
      return { ...c, ...edit.changes }
    })

    // Add pending adds for this type
    const addsForType = pendingAdds
      .filter(a => a.commodity.typeId === selectedTypeId)
      .map(a => a.commodity)
    items = [...items, ...addsForType]

    // Apply reorder if present
    const typeReorder = reorderedIds.get(selectedTypeId)
    if (typeReorder) {
      const ordered: Commodity[] = []
      for (const id of typeReorder) {
        const item = items.find(c => c.id === id)
        if (item) ordered.push(item)
      }
      // Add any items not in the reorder list (newly added after reorder)
      for (const item of items) {
        if (!typeReorder.includes(item.id)) ordered.push(item)
      }
      items = ordered.map((c, i) => ({ ...c, priority: i + 1 }))
    }

    return items
  }, [
    selectedTypeId,
    dbCommodities,
    pendingAdds,
    pendingEdits,
    pendingDeletes,
    reorderedIds,
  ])

  // Count commodities per type for tab badges (including pending changes)
  const countByType = useCallback(
    (typeId: string) => {
      const dbCount = allDbCommodities.filter(
        c => c.typeId === typeId && !pendingDeletes.has(c.id),
      ).length
      const addCount = pendingAdds.filter(
        a => a.commodity.typeId === typeId,
      ).length
      return dbCount + addCount
    },
    [allDbCommodities, pendingDeletes, pendingAdds],
  )

  // Check if there are any pending changes
  const hasChanges =
    pendingAdds.length > 0 ||
    pendingEdits.length > 0 ||
    pendingDeletes.size > 0 ||
    reorderedIds.size > 0

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
          } = add.commodity
          await getCommodityRepo().create(data)
        }

        // Write pending edits and log price changes
        for (const edit of pendingEdits) {
          if (edit.changes.price !== undefined) {
            // Look up current price from the DB snapshot
            const current = dbCommodities.find(c => c.id === edit.id)
            if (current && current.price !== edit.changes.price) {
              await getPriceChangeLogRepo().create({
                commodityId: edit.id,
                commodityName: edit.changes.name ?? current.name,
                oldPrice: current.price,
                newPrice: edit.changes.price,
              })
            }
          }
          await getCommodityRepo().update(edit.id, edit.changes)
        }

        // Write pending deletes (soft delete)
        for (const id of pendingDeletes) {
          await getCommodityRepo().update(id, { onMarket: false })
        }

        // Write reorder
        for (const [_typeId, ids] of reorderedIds) {
          // Filter out temp IDs (they were just created above with new real IDs)
          const realIds = [...ids].filter(id => !isTempId(id))
          if (realIds.length > 0) {
            await getCommodityRepo().updatePriorities(realIds)
          }
        }
      },

      getChangeSummary(): readonly ChangeSummaryItem[] {
        const items: ChangeSummaryItem[] = []

        for (const add of pendingAdds) {
          items.push({
            type: 'add',
            description: t('productMgmt.commodities.summaryAdded', {
              name: add.commodity.name,
            }),
          })
        }

        for (const edit of pendingEdits) {
          const details: string[] = []
          if (edit.changes.name)
            details.push(
              `${t('productMgmt.commodities.summaryFieldName')}: ${edit.changes.name}`,
            )
          if (edit.changes.price !== undefined)
            details.push(
              `${t('productMgmt.commodities.summaryFieldPrice')}: ${edit.changes.price}`,
            )
          items.push({
            type: 'edit',
            description: `${t('productMgmt.commodities.summaryEdited', { name: edit.originalName })}${details.length > 0 ? `（${details.join('、')}）` : ''}`,
          })
        }

        for (const id of pendingDeletes) {
          const item =
            dbCommodities.find(c => c.id === id) ??
            allDbCommodities.find(c => c.id === id)
          items.push({
            type: 'delete',
            description: t('productMgmt.commodities.summaryDeleted', {
              name: item?.name ?? id,
            }),
          })
        }

        for (const [typeId, ids] of reorderedIds) {
          // Build ordered name list from displayed items
          const typeLabel =
            commodityTypes.find(ct => ct.typeId === typeId)?.label ?? typeId
          const names = ids
            .map(id => {
              const db = allDbCommodities.find(c => c.id === id)
              const added = pendingAdds.find(a => a.commodity.id === id)
              return db?.name ?? added?.commodity.name ?? id
            })
            .join(' → ')
          items.push({
            type: 'reorder',
            description: `${typeLabel}：${names}`,
          })
        }

        return items
      },
    }),
    [
      pendingAdds,
      pendingEdits,
      pendingDeletes,
      reorderedIds,
      dbCommodities,
      allDbCommodities,
      commodityTypes,
      t,
    ],
  )

  // Keep sectionRef.current up to date
  useEffect(() => {
    if (sectionRef) {
      ;(sectionRef as React.MutableRefObject<SectionRef | null>).current =
        sectionRefValue
    }
  }, [sectionRef, sectionRefValue])

  // ── Handlers ──────────────────────────────────────────────────────────

  // Tab click
  const handleTabClick = useCallback((typeId: string) => {
    setActiveTypeId(typeId)
  }, [])

  // Add product
  const handleAdd = useCallback(() => {
    setEditingCommodity(null)
    setIsFormOpen(true)
  }, [])

  // Edit product
  const handleEdit = useCallback((commodity: Commodity) => {
    setEditingCommodity(commodity)
    setIsFormOpen(true)
  }, [])

  // Close form modal
  const handleFormClose = useCallback(() => {
    setIsFormOpen(false)
    setEditingCommodity(null)
  }, [])

  // Form submit (add or edit) -- local only
  const handleFormSubmit = useCallback(
    async (values: CommodityFormValues) => {
      if (editingCommodity) {
        // Edit mode
        if (isTempId(editingCommodity.id)) {
          // Update within pendingAdds
          setPendingAdds(prev =>
            prev.map(a =>
              a.commodity.id === editingCommodity.id
                ? {
                    ...a,
                    commodity: {
                      ...a.commodity,
                      name: values.name,
                      price: values.price,
                      includesSoup: values.includesSoup ?? false,
                    },
                  }
                : a,
            ),
          )
        } else {
          // Add or update in pendingEdits
          setPendingEdits(prev => {
            const existing = prev.find(e => e.id === editingCommodity.id)
            if (existing) {
              return prev.map(e =>
                e.id === editingCommodity.id
                  ? {
                      ...e,
                      changes: {
                        ...e.changes,
                        name: values.name,
                        price: values.price,
                        includesSoup: values.includesSoup ?? false,
                      },
                    }
                  : e,
              )
            }
            return [
              ...prev,
              {
                id: editingCommodity.id,
                originalName: editingCommodity.name,
                changes: {
                  name: values.name,
                  price: values.price,
                  includesSoup: values.includesSoup ?? false,
                },
              },
            ]
          })
        }
      } else {
        // Add mode -- create temp commodity locally
        if (!selectedTypeId) return

        const maxPriority = displayedCommodities.reduce(
          (max, c) => Math.max(max, c.priority),
          0,
        )

        const tempCommodity: Commodity = {
          id: `${TEMP_ID_PREFIX}${nanoid()}`,
          typeId: selectedTypeId,
          name: values.name,
          price: values.price,
          priority: maxPriority + 1,
          onMarket: true,
          includesSoup: values.includesSoup ?? false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        setPendingAdds(prev => [...prev, { commodity: tempCommodity }])
      }

      handleFormClose()
    },
    [editingCommodity, selectedTypeId, displayedCommodities, handleFormClose],
  )

  // Delete product
  const handleDeleteClick = useCallback((commodity: Commodity) => {
    setDeleteTarget(commodity)
  }, [])

  // Confirm deletion -- local only
  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return

    if (isTempId(deleteTarget.id)) {
      // Remove from pendingAdds
      setPendingAdds(prev =>
        prev.filter(a => a.commodity.id !== deleteTarget.id),
      )
    } else {
      // Add to pendingDeletes
      setPendingDeletes(prev => new Set([...prev, deleteTarget.id]))
      // Remove any pending edits for this item
      setPendingEdits(prev => prev.filter(e => e.id !== deleteTarget.id))
    }

    setDeleteTarget(null)
  }, [deleteTarget])

  // Cancel deletion
  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null)
  }, [])

  // Drag reorder -- local only
  const handleReorder = useCallback(
    (orderedIds: readonly string[]) => {
      if (!selectedTypeId) return
      setReorderedIds(prev => new Map([...prev, [selectedTypeId, orderedIds]]))
    },
    [selectedTypeId],
  )

  return (
    <section>
      {/* Header with title and add button */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg text-foreground">
          {t('productMgmt.commodities.title')}
        </h2>
        <RippleButton
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-base text-foreground hover:bg-accent"
          onClick={handleAdd}
        >
          <Plus size={16} />
          {t('productMgmt.commodities.addProduct')}
        </RippleButton>
      </div>

      {/* Category tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {commodityTypes.map(ct => {
          const isActive = ct.typeId === selectedTypeId
          const themeColor = resolveTabColor(ct.typeId)
          return (
            <RippleButton
              key={ct.typeId}
              data-testid={`category-tab-${ct.typeId}`}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-base transition-colors"
              style={
                isActive
                  ? { backgroundColor: themeColor, color: '#fff' }
                  : {
                      backgroundColor: `color-mix(in srgb, ${themeColor} 15%, transparent)`,
                      color: themeColor,
                    }
              }
              onClick={() => handleTabClick(ct.typeId)}
            >
              {ct.label}
              <span
                className="inline-flex size-6 items-center justify-center rounded-full text-base"
                style={{
                  backgroundColor: isActive
                    ? 'rgba(255,255,255,0.2)'
                    : 'rgba(0,0,0,0.05)',
                }}
              >
                {countByType(ct.typeId)}
              </span>
            </RippleButton>
          )
        })}
      </div>

      {/* Sortable commodity list */}
      <SortableList
        items={displayedCommodities}
        getId={c => c.id}
        renderItem={(commodity, dragHandleProps) => {
          const card = (
            <CommodityCard
              commodity={commodity}
              dragHandleProps={dragHandleProps}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          )
          // Skip SwipeToDelete in DragOverlay (overflow-hidden clips the ring)
          return dragHandleProps.isOverlay ? (
            card
          ) : (
            <SwipeToDelete onDelete={() => handleDeleteClick(commodity)}>
              {card}
            </SwipeToDelete>
          )
        }}
        onReorder={handleReorder}
      />

      {/* Add/Edit form modal */}
      <CommodityForm
        open={isFormOpen}
        commodity={editingCommodity}
        onSubmit={handleFormSubmit}
        onClose={handleFormClose}
      />

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title={t('productMgmt.commodities.deleteConfirmTitle')}
        variant="red"
        shineColor="red"
        confirmText={t('common.confirm')}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      >
        {deleteTarget && (
          <p className="text-center text-base text-foreground">
            {t('productMgmt.commodities.deleteConfirmMessage', {
              name: deleteTarget.name,
            })}
          </p>
        )}
      </ConfirmModal>
    </section>
  )
}
