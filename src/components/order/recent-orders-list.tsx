/**
 * RecentOrdersList — displays the 10 most recent orders from today.
 * Used inside the "近期訂單" tab of OrderPanelTabs.
 */

import { useState, useMemo, useCallback } from 'react'
import { PackageOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ScrollArea } from '@/components/ui/scroll-area'
import { OrderHistoryCard } from '@/components/orders/order-history-card'
import { DeleteOrderModal } from '@/components/orders/delete-order-modal'
import { notify } from '@/components/ui/sonner'
import { useOrderStore } from '@/stores/order-store'
import { getOrderRepo, getCommodityRepo } from '@/lib/repositories/provider'
import type { Order } from '@/lib/schemas'

// ─── Component ───────────────────────────────────────────────────────────────

export function RecentOrdersList() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const submitSeq = useOrderStore(s => s.submitSeq)
  const startEditOrder = useOrderStore(s => s.startEditOrder)

  // Swipe reset key — increment to close any open swipe actions
  const [swipeResetKey, setSwipeResetKey] = useState(0)

  // Delete order state
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch recent 10 orders (refetch when submitSeq changes)
  const { data: orders = [] } = useQuery({
    queryKey: ['orders', 'recent', submitSeq],
    queryFn: () => getOrderRepo().findRecent(10),
    staleTime: 0,
  })

  // Fetch commodities for typeIdMap (category grouping in cards)
  const { data: commodities = [] } = useQuery({
    queryKey: ['commodities', 'all'],
    queryFn: () => getCommodityRepo().findAll(),
    staleTime: 60_000,
  })

  // Build commodityId -> typeId lookup
  const typeIdMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of commodities) {
      map.set(c.id, c.typeId)
    }
    return map
  }, [commodities])

  // Toggle served status for an order
  const handleToggleServed = useCallback(
    async (orderId: string, currentlyServed: boolean) => {
      const repo = getOrderRepo()
      await repo.toggleServed(orderId, !currentlyServed)
      queryClient.invalidateQueries({ queryKey: ['orders', 'recent'] })
    },
    [queryClient],
  )

  // Handle edit — load order into store (OrderPanelTabs will auto-switch to current tab)
  const handleEdit = useCallback(
    (order: (typeof orders)[number]) => {
      startEditOrder(order.id, order.number, order, typeIdMap)
    },
    [startEditOrder, typeIdMap],
  )

  // Handle delete — remove order and invalidate query
  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingOrder) return
    setIsDeleting(true)
    try {
      const repo = getOrderRepo()
      await repo.remove(deletingOrder.id)
      queryClient.invalidateQueries({ queryKey: ['orders', 'recent'] })
      notify.success(t('orders.deleteSuccess'))
    } catch {
      notify.error(t('orders.deleteError'))
    } finally {
      setIsDeleting(false)
      setDeletingOrder(null)
    }
  }, [deletingOrder, queryClient, t])

  // Close swipe actions when tapping background
  const handleBackgroundTap = useCallback(() => {
    setSwipeResetKey(k => k + 1)
  }, [])

  // Empty state
  if (orders.length === 0) {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center gap-3"
        onClick={handleBackgroundTap}
      >
        <PackageOpen size={40} className="text-muted-foreground" strokeWidth={1.2} />
        <p className="text-muted-foreground">{t('order.noRecentOrders')}</p>
      </div>
    )
  }

  return (
    <>
      <ScrollArea className="flex-1">
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div className="flex flex-col gap-3 pr-2 pb-4" onClick={handleBackgroundTap}>
          {orders.map(order => (
            <OrderHistoryCard
              key={order.id}
              order={order}
              typeIdMap={typeIdMap}
              onDelete={() => setDeletingOrder(order)}
              onEdit={() => handleEdit(order)}
              resetKey={swipeResetKey}
              isServed={order.isServed}
              onTap={() => handleToggleServed(order.id, order.isServed)}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Delete confirmation modal — reuses the same modal as orders page */}
      <DeleteOrderModal
        open={deletingOrder !== null}
        orderNumber={deletingOrder?.number ?? 0}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingOrder(null)}
        loading={isDeleting}
      />
    </>
  )
}
