/**
 * Full-screen search view for the Orders page.
 * Searches across all historical orders and groups results by date.
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import dayjs from 'dayjs'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Order } from '@/lib/schemas'
import { buttonVariants } from '@/components/ui/button'
import { RippleButton } from '@/components/ui/ripple-button'
import { OrderHistoryCard } from './order-history-card'

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 100

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OrdersSearchProps {
  readonly orders: readonly Order[]
  readonly isLoading: boolean
  readonly onClose: () => void
  readonly onDelete: (order: Order) => void
  readonly typeIdMap: ReadonlyMap<string, string>
}

interface DateGroup {
  readonly date: string
  readonly orders: readonly Order[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Check if an order matches the given query string.
 * Matches against item names, total amount, order number, and memo tags.
 */
function matchesQuery(order: Order, query: string): boolean {
  const q = query.toLowerCase().trim()
  if (!q) return false

  // Check total amount
  if (String(order.total).includes(q)) return true

  // Check order number
  if (String(order.number).includes(q)) return true

  // Check memo tags
  if (order.memo.some(tag => tag.toLowerCase().includes(q))) return true

  // Check item names
  if (order.items.some(item => item.name.toLowerCase().includes(q))) return true

  return false
}

/**
 * Group an array of orders by date (YYYY-MM-DD).
 * Returns an array of date groups sorted with most recent first.
 * Uses immutable spread to avoid mutating intermediate arrays.
 */
function groupByDate(orders: readonly Order[]): readonly DateGroup[] {
  const map = new Map<string, readonly Order[]>()

  for (const order of orders) {
    const dateKey = dayjs(order.createdAt).format('YYYY-MM-DD')
    const existing = map.get(dateKey) ?? []
    map.set(dateKey, [...existing, order])
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, groupOrders]) => ({ date, orders: groupOrders }))
}

/**
 * Distribute date groups into pages so each page has at most `pageSize` total
 * orders. Complete groups are never split across pages — a group larger than
 * `pageSize` gets its own page rather than being sliced mid-group.
 */
function buildPages(
  groups: readonly DateGroup[],
  pageSize: number,
): readonly (readonly DateGroup[])[] {
  if (groups.length === 0) return []

  const pages: DateGroup[][] = []
  let currentPage: DateGroup[] = []
  let pageOrderCount = 0

  for (const group of groups) {
    const groupSize = group.orders.length
    if (pageOrderCount + groupSize > pageSize && currentPage.length > 0) {
      pages.push(currentPage)
      currentPage = [group]
      pageOrderCount = groupSize
    } else {
      currentPage = [...currentPage, group]
      pageOrderCount += groupSize
    }
  }

  if (currentPage.length > 0) pages.push(currentPage)

  return pages
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Search panel that replaces the normal orders content area.
 * Filters across all orders and groups results by date in a 3-column grid.
 */
export function OrdersSearch({
  orders,
  isLoading,
  onClose,
  onDelete,
  typeIdMap,
}: OrdersSearchProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const inputRef = useRef<HTMLInputElement>(null)

  // Autofocus the input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Filter all orders by the query
  const filteredOrders = useMemo(() => {
    if (!query.trim()) return []
    return orders.filter(order => matchesQuery(order, query))
  }, [orders, query])

  // Reset page to 1 whenever query changes
  useEffect(() => {
    setPage(1)
  }, [query])

  const totalResults = filteredOrders.length

  // Group ALL filtered orders first, then paginate by complete groups
  const allGroups = useMemo(() => groupByDate(filteredOrders), [filteredOrders])
  const paginatedPages = useMemo(
    () => buildPages(allGroups, PAGE_SIZE),
    [allGroups],
  )

  const totalPages = paginatedPages.length > 0 ? paginatedPages.length : 1
  const showPagination = paginatedPages.length > 1
  const pageGroups = paginatedPages[page - 1] ?? []

  const hasQuery = query.trim().length > 0
  const hasResults = filteredOrders.length > 0

  return (
    <div className="flex flex-col gap-3">
      {/* Search input row */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          data-testid="orders-search-input"
          type="text"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-md outline-none focus:ring-2 focus:ring-ring"
          placeholder={t('orders.searchPlaceholder')}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <RippleButton
          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
          aria-label={t('orders.searchClose')}
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </RippleButton>
      </div>

      {/* Results section — only shown when there is a query */}
      {hasQuery && (
        <>
          {/* Loading state while fetching all orders */}
          {isLoading && (
            <div className="py-10 text-center text-muted-foreground">
              {t('orders.loading')}
            </div>
          )}

          {/* No results */}
          {!isLoading && !hasResults && (
            <div
              data-testid="orders-search-empty"
              className="py-10 text-center text-muted-foreground"
            >
              {t('orders.searchNoResults')}
            </div>
          )}

          {/* Result count and groups */}
          {!isLoading && hasResults && (
            <>
              <div className="text-sm text-muted-foreground">
                {t('orders.searchResultsCount', { count: totalResults })}
              </div>

              {/* Date groups */}
              {pageGroups.map(group => (
                <div key={group.date} data-testid="search-result-group">
                  <div
                    data-testid="search-date-label"
                    className="my-5 border-l-4 border-blue pl-3 text-lg font-medium text-muted-foreground"
                  >
                    {group.date}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {group.orders.map(order => (
                      <OrderHistoryCard
                        key={order.id}
                        order={order}
                        typeIdMap={typeIdMap}
                        onDelete={() => onDelete(order)}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {showPagination && (
                <div
                  data-testid="orders-search-pagination"
                  className="flex items-center justify-center gap-2 pt-2"
                >
                  <RippleButton
                    className={buttonVariants({
                      variant: 'outline',
                      size: 'icon',
                    })}
                    aria-label={t('orders.prevPage')}
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </RippleButton>
                  <span className="text-md">
                    {page} / {totalPages}
                  </span>
                  <RippleButton
                    className={buttonVariants({
                      variant: 'outline',
                      size: 'icon',
                    })}
                    aria-label={t('orders.nextPage')}
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </RippleButton>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
