import { useEffect } from 'react'
import { ProductGrid } from '@/components/order'
import { OrderPanelTabs } from '@/components/order/order-panel-tabs'

/** Main order page combining product menu (left) and order summary (right) */
export function OrderPage() {
  // Lock body scroll on order page; reset scroll to clear header glassmorphism shadow
  useEffect(() => {
    window.scrollTo(0, 0)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
      window.scrollTo(0, 0)
    }
  }, [])

  return (
    <div className="flex h-[calc(100vh-57px)] gap-0 overflow-hidden">
      {/* Left panel — product menu (65%), relative for calculator overlay */}
      <div className="relative flex-64">
        <div className="h-full overflow-y-auto px-4 py-2">
          <ProductGrid />
        </div>
      </div>

      {/* Right panel — order summary (35%) */}
      <div className="flex-36 overflow-y-auto border-l border-border bg-card p-4">
        <OrderPanelTabs />
      </div>
    </div>
  )
}
