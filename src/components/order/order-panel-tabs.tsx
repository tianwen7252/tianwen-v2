/**
 * OrderPanelTabs — tabbed wrapper for the order page right panel.
 * Provides "目前訂單" (Current Order) and "近期訂單" (Recent Orders) tabs.
 */

import { useState, useEffect } from 'react'
import { ClipboardList, ListOrdered } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/cn'
import { RippleButton } from '@/components/ui/ripple-button'
import { useOrderStore } from '@/stores/order-store'
import { OrderPanel } from './order-panel'
import { RecentOrdersList } from './recent-orders-list'

// ─── Types ───────────────────────────────────────────────────────────────────

type OrderTab = 'current' | 'recent'

interface TabDef {
  readonly value: OrderTab
  readonly labelKey: string
  readonly icon: React.ReactNode
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EDIT_BUTTON_COLOR = '#4A90D9'

const TABS: readonly TabDef[] = [
  { value: 'current', labelKey: 'order.currentOrder', icon: <ClipboardList size={16} /> },
  { value: 'recent', labelKey: 'order.recentOrders', icon: <ListOrdered size={16} /> },
]

// ─── Component ───────────────────────────────────────────────────────────────

export function OrderPanelTabs() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<OrderTab>('current')

  const editingOrderId = useOrderStore(s => s.editingOrderId)
  const editingOrderNumber = useOrderStore(s => s.editingOrderNumber)

  // Auto-switch to current tab when edit mode is activated
  useEffect(() => {
    if (editingOrderId) {
      setActiveTab('current')
    }
  }, [editingOrderId])

  // Invalidate recent orders query when switching to recent tab
  const handleTabChange = (tab: OrderTab) => {
    setActiveTab(tab)
    if (tab === 'recent') {
      queryClient.invalidateQueries({ queryKey: ['orders', 'recent'] })
    }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Tab bar */}
      <div role="tablist" className="flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map(tab => (
          <RippleButton
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={activeTab === tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-md px-4 py-2 text-base font-normal transition-colors',
              activeTab === tab.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.icon}
            {t(tab.labelKey)}
          </RippleButton>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'current' ? (
        <OrderPanel
          submitLabel={
            editingOrderId
              ? `${t('order.editOrderButton')}#${editingOrderNumber}`
              : undefined
          }
          submitColor={editingOrderId ? EDIT_BUTTON_COLOR : undefined}
        />
      ) : (
        <RecentOrdersList />
      )}
    </div>
  )
}
