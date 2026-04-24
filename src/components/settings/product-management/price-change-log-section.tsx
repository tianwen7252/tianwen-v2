/**
 * PriceChangeLogSection -- Displays a paginated, date-grouped table
 * of commodity price changes using shadcn Table + Collapsible.
 */

import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, ChevronDown, FileText } from 'lucide-react'
import { RippleButton } from '@/components/ui/ripple-button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { getPriceChangeLogRepo } from '@/lib/repositories'
import { useDbQuery } from '@/hooks/use-db-query'
import type { PriceChangeLog } from '@/lib/schemas'

// ── Constants ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

// ── Types ──────────────────────────────────────────────────────────────────

interface DateGroup {
  readonly date: string
  readonly items: readonly PriceChangeLog[]
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Format a timestamp to YYYY-MM-DD. */
function formatDate(timestamp: number): string {
  const d = new Date(timestamp)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** Format a timestamp to HH:mm. */
function formatTime(timestamp: number): string {
  const d = new Date(timestamp)
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${min}`
}

/** Group price change logs by date, preserving DESC order from query. */
function groupByDate(logs: readonly PriceChangeLog[]): readonly DateGroup[] {
  const map = new Map<string, PriceChangeLog[]>()
  const order: string[] = []

  for (const log of logs) {
    const date = formatDate(log.createdAt)
    if (!map.has(date)) {
      map.set(date, [])
      order.push(date)
    }
    map.get(date)!.push(log)
  }

  return order.map(date => ({
    date,
    items: map.get(date)!,
  }))
}

// ── Component ──────────────────────────────────────────────────────────────

interface PriceChangeLogSectionProps {
  readonly refreshKey: number
}

export function PriceChangeLogSection({
  refreshKey,
}: PriceChangeLogSectionProps) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)

  // Reset page when refreshKey changes
  const [prevRefreshKey, setPrevRefreshKey] = useState(refreshKey)
  if (prevRefreshKey !== refreshKey) {
    setPrevRefreshKey(refreshKey)
    setPage(1)
  }

  // Load data
  const offset = (page - 1) * PAGE_SIZE

  const logs = useDbQuery(
    () => getPriceChangeLogRepo().findAll(PAGE_SIZE, offset),
    [page, refreshKey],
    [] as PriceChangeLog[],
  )

  const totalCount = useDbQuery(
    () => getPriceChangeLogRepo().count(),
    [refreshKey],
    0,
  )

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const dateGroups = useMemo(() => groupByDate(logs), [logs])
  const showPagination = totalCount > PAGE_SIZE

  // Pagination handlers
  const handlePrevious = useCallback(() => {
    setPage(p => Math.max(1, p - 1))
  }, [])

  const handleNext = useCallback(() => {
    setPage(p => Math.min(totalPages, p + 1))
  }, [totalPages])

  return (
    <section>
      <h2 className="mb-4 text-lg text-foreground">
        {t('productMgmt.priceLog.title')}
      </h2>

      {logs.length === 0 ? (
        <div className="flex items-center gap-2 text-base text-muted-foreground">
          <FileText size={16} />
          <span>{t('productMgmt.priceLog.empty')}</span>
        </div>
      ) : (
        <div className="space-y-2">
          {dateGroups.map(group => (
            <Collapsible key={group.date} defaultOpen>
              <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg bg-muted/50 px-4 py-2 text-base text-muted-foreground hover:bg-muted transition-colors [&[data-state=open]>svg]:rotate-0 [&[data-state=closed]>svg]:-rotate-90">
                <ChevronDown size={16} className="transition-transform" />
                <span>{group.date}</span>
                <span className="ml-auto" style={{ color: '#a3c8d7' }}>
                  {group.items.length}
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Table className="text-base">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('productMgmt.priceLog.time')}</TableHead>
                      <TableHead>{t('productMgmt.priceLog.product')}</TableHead>
                      <TableHead className="text-right">
                        {t('productMgmt.priceLog.oldPrice')}
                      </TableHead>
                      <TableHead />
                      <TableHead className="text-right">
                        {t('productMgmt.priceLog.newPrice')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.items.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="text-muted-foreground">
                          {formatTime(log.createdAt)}
                        </TableCell>
                        <TableCell>{log.commodityName}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          ${log.oldPrice}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          &rarr;
                        </TableCell>
                        <TableCell className="text-right">
                          ${log.newPrice}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CollapsibleContent>
            </Collapsible>
          ))}

          {/* Pagination */}
          {showPagination && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <RippleButton
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-base text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handlePrevious}
              >
                <ChevronLeft size={16} />
                {t('productMgmt.priceLog.previous')}
              </RippleButton>

              <span className="text-base text-muted-foreground">
                {t('productMgmt.priceLog.page', {
                  current: page,
                  total: totalPages,
                })}
              </span>

              <RippleButton
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-base text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleNext}
              >
                {t('productMgmt.priceLog.next')}
                <ChevronRight size={16} />
              </RippleButton>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
