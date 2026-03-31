/**
 * Orders history page.
 * Shows date header, shift summary, and a grid of order history cards.
 * Supports date navigation, order deletion, and full-text search.
 */

import { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PackageOpen } from 'lucide-react'
import { getOrderRepo, getCommodityRepo } from '@/lib/repositories/provider'
import { notify } from '@/components/ui/sonner'
import {
  OrdersDateHeader,
  OrdersShiftSummary,
  OrderHistoryCard,
  DeleteOrderModal,
  EditOrderModal,
  OrdersSearch,
} from '@/components/orders'
import type { Order } from '@/lib/schemas'

// ─── Types ───────────────────────────────────────────────────────────────────

interface DeleteTarget {
  readonly id: string
  readonly number: number
}

// ─── Component ───────────────────────────────────────────────────────────────

/** Main orders history page with date filtering, shift summary, order grid, and search */
export function OrdersPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [swipeResetKey, setSwipeResetKey] = useState(0)

  // Fetch orders for the selected date
  const dayStart = selectedDate.startOf('day').valueOf()
  const dayEnd = selectedDate.endOf('day').valueOf()

  const {
    data: orders = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['orders', selectedDate.format('YYYY-MM-DD')],
    queryFn: () => getOrderRepo().findByDateRange(dayStart, dayEnd),
    staleTime: 0,
  })

  // Fetch all orders — only when search is open, refresh at most once per minute
  const { data: allOrders = [], isLoading: isAllLoading } = useQuery({
    queryKey: ['orders', 'all'],
    queryFn: () => getOrderRepo().findAll(),
    enabled: isSearchOpen,
    staleTime: 60_000,
  })

  // Fetch commodities for typeIdMap (needed for category grouping)
  const { data: commodities = [] } = useQuery({
    queryKey: ['commodities', 'all'],
    queryFn: () => getCommodityRepo().findAll(),
    staleTime: 60_000,
  })

  // Build a commodityId -> typeId lookup map from the commodity list
  const typeIdMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of commodities) {
      map.set(c.id, c.typeId)
    }
    return map
  }, [commodities])

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => getOrderRepo().remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      notify.success(t('orders.toastDeleted'))
      setDeleteTarget(null)
    },
    onError: () => {
      notify.error(t('orders.toastDeleteError'))
      setDeleteTarget(null)
    },
  })

  /** Handle date change from the date header calendar */
  function handleDateChange(date: Dayjs) {
    setSelectedDate(date)
  }

  /** Open the delete confirmation modal for a given order */
  function handleDeleteRequest(order: Order) {
    setDeleteTarget({ id: order.id, number: order.number })
  }

  /** Confirm deletion of the targeted order */
  function handleDeleteConfirm() {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id)
    }
  }

  /** Cancel deletion and close the modal */
  function handleDeleteCancel() {
    setDeleteTarget(null)
  }

  /** Reset all swiped-open cards when clicking outside any card */
  function handlePageClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement
    if (!target.closest('[data-testid="swipe-actions"]')) {
      setSwipeResetKey(k => k + 1)
    }
  }

  return (
    <div className="min-h-[calc(100vh-57px)] p-4" onClick={handlePageClick}>
      {/* Search view — replaces normal content when open */}
      {isSearchOpen ? (
        <OrdersSearch
          orders={allOrders}
          isLoading={isAllLoading}
          onClose={() => setIsSearchOpen(false)}
          onDelete={handleDeleteRequest}
          typeIdMap={typeIdMap}
        />
      ) : (
        <>
          {/* Date header */}
          <OrdersDateHeader
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            onSearchOpen={() => setIsSearchOpen(true)}
          />

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              {t('orders.loading')}
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="flex items-center justify-center py-20 text-destructive">
              {t('orders.loadError')}
            </div>
          )}

          {/* Content: summary + grid */}
          {!isLoading && !isError && (
            <>
              {/* Shift summary */}
              <div className="mt-4">
                <OrdersShiftSummary orders={orders} />
              </div>

              {/* Empty state */}
              {orders.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
                  <PackageOpen className="size-12 opacity-40" />
                  <span className="text-base">{t('orders.noOrders')}</span>
                </div>
              )}

              {/* Order cards grid — 3 per row */}
              {orders.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {orders.map(order => (
                    <OrderHistoryCard
                      key={order.id}
                      order={order}
                      typeIdMap={typeIdMap}
                      onDelete={() => handleDeleteRequest(order)}
                      onEdit={() => {
                        setTimeout(() => setEditingOrder(order), 50)
                      }}
                      resetKey={swipeResetKey}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Delete confirmation modal — always rendered */}
      <DeleteOrderModal
        open={deleteTarget !== null}
        orderNumber={deleteTarget?.number ?? 0}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={deleteMutation.isPending}
      />

      {/* Edit order modal — opened when editing an order */}
      <EditOrderModal
        open={editingOrder !== null}
        order={editingOrder}
        typeIdMap={typeIdMap}
        onClose={() => setEditingOrder(null)}
        onSaved={() => {
          setEditingOrder(null)
          queryClient.invalidateQueries({ queryKey: ['orders'] })
        }}
      />
    </div>
  )
}
