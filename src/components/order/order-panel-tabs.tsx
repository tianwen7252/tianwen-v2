/**
 * OrderPanelTabs — tabbed wrapper for the order page right panel.
 * Provides "餐點項目" (Order Items) and "近期訂單" (Recent Orders) tabs.
 * Uses underline-style tabs matching the settings page pattern.
 *
 * Both tab panels stay mounted (using absolute positioning + visibility)
 * so RecentOrdersList keeps its query cache and ScrollArea layout intact.
 */

import { useState, useEffect, useRef } from 'react'
import { ClipboardList, ListOrdered, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/cn'
import { RippleButton } from '@/components/ui/ripple-button'
import { useOrderStore } from '@/stores/order-store'
import { OrderPanel } from './order-panel'
import { RecentOrdersList } from './recent-orders-list'

// ─── Types ───────────────────────────────────────────────────────────────────

type OrderTab = 'current' | 'recent'

// ─── Constants ───────────────────────────────────────────────────────────────

const EDIT_BUTTON_COLOR = '#4A90D9'

// ─── Component ───────────────────────────────────────────────────────────────

export function OrderPanelTabs() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<OrderTab>('current')

  const editingOrderId = useOrderStore(s => s.editingOrderId)
  const editingOrderNumber = useOrderStore(s => s.editingOrderNumber)
  const items = useOrderStore(s => s.items)
  const clearCart = useOrderStore(s => s.clearCart)

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  // Track previous items count to detect additions while on recent tab
  const prevItemsLenRef = useRef(items.length)
  const activeTabRef = useRef(activeTab)
  activeTabRef.current = activeTab

  // Auto-switch to current tab when edit mode is activated
  useEffect(() => {
    if (editingOrderId) {
      setActiveTab('current')
    }
  }, [editingOrderId])

  // Auto-switch to current tab when items are added while on recent tab
  // Covers: product button clicks, calculator submit (addCustomItem), addItem
  useEffect(() => {
    const prevLen = prevItemsLenRef.current
    prevItemsLenRef.current = items.length
    if (items.length > prevLen && activeTabRef.current === 'recent') {
      setActiveTab('current')
    }
  }, [items.length])

  // Invalidate recent orders query when switching to recent tab
  const handleTabChange = (tab: OrderTab) => {
    setActiveTab(tab)
    if (tab === 'recent') {
      queryClient.invalidateQueries({ queryKey: ['orders', 'recent'] })
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar — underline style */}
      <div className="flex items-center border-b border-border">
        {/* Order Items tab */}
        <RippleButton
          role="tab"
          type="button"
          aria-selected={activeTab === 'current'}
          onClick={() => handleTabChange('current')}
          className={cn(
            'flex items-center gap-1.5 border-b-2 px-4 py-3 text-base transition-colors',
            activeTab === 'current'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
          )}
        >
          <ClipboardList size={16} />
          {t('order.currentOrder')}
          {itemCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {itemCount}
            </span>
          )}
        </RippleButton>

        {/* Recent Orders tab */}
        <RippleButton
          role="tab"
          type="button"
          aria-selected={activeTab === 'recent'}
          onClick={() => handleTabChange('recent')}
          className={cn(
            'flex items-center gap-1.5 border-b-2 px-4 py-3 text-base transition-colors',
            activeTab === 'recent'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
          )}
        >
          <ListOrdered size={16} />
          {t('order.recentOrders')}
        </RippleButton>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Delete (clear cart) button — only visible on current order tab */}
        {activeTab === 'current' && itemCount > 0 && (
          <RippleButton
            aria-label={t('order.clearCart')}
            onClick={clearCart}
            rippleColor="rgba(0, 0, 0, 0.1)"
            className="mr-1 size-8 rounded-md border border-border bg-background text-muted-foreground shadow-xs flex items-center justify-center hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </RippleButton>
        )}
      </div>

      {/* Tab content — both panels always mounted via absolute positioning.
          visibility:hidden keeps layout intact (unlike display:none) so
          ScrollArea calculates dimensions correctly and queries run on mount. */}
      <div className="relative flex-1 pt-3">
        <div
          className={cn(
            'absolute inset-0 flex flex-col pt-3',
            activeTab !== 'current' && 'invisible pointer-events-none',
          )}
        >
          <OrderPanel
            submitLabel={
              editingOrderId
                ? `${t('order.editOrderButton')}#${editingOrderNumber}`
                : undefined
            }
            submitColor={editingOrderId ? EDIT_BUTTON_COLOR : undefined}
            hideHeader
          />
        </div>
        <div
          className={cn(
            'absolute inset-0 flex flex-col pt-3',
            activeTab !== 'recent' && 'invisible pointer-events-none',
          )}
        >
          <RecentOrdersList />
        </div>
      </div>
    </div>
  )
}
