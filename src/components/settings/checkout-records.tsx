/**
 * CheckoutRecords — displays all shift checkout records in a paginated table.
 * Records are grouped by date. Supports search by date, staff name, and revenue.
 */

import { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { Receipt } from 'lucide-react'
import { useDbQuery } from '@/hooks/use-db-query'
import { getShiftCheckoutRepo } from '@/lib/repositories/provider'
import { formatCurrency } from '@/lib/currency'
import { PaginationControls } from '@/components/settings/pagination-controls'
import type { ShiftCheckout } from '@/lib/schemas'

const PAGE_SIZE = 20

export function CheckoutRecords() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const allRecords = useDbQuery<ShiftCheckout[]>(
    () => getShiftCheckoutRepo().findAll(),
    [],
    [],
  )

  // Filter by search query (date, staff name, revenue)
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return allRecords
    const q = searchQuery.trim().toLowerCase()
    return allRecords.filter(r => {
      const date = r.date.toLowerCase()
      const staff = r.orderStaffName.toLowerCase()
      const revenue = String(r.revenue)
      const shift = r.shift === 'morning' ? '早班' : '晚班'
      return (
        date.includes(q) ||
        staff.includes(q) ||
        revenue.includes(q) ||
        shift.includes(q)
      )
    })
  }, [allRecords, searchQuery])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)

  const pageRecords = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, safePage])

  // Build grouped rows for rendering
  const groupedRows = useMemo(() => {
    const rows:
      | { type: 'date'; date: string }[]
      | { type: 'record'; record: ShiftCheckout }[] = []
    let lastDate = ''
    for (const record of pageRecords) {
      if (record.date !== lastDate) {
        lastDate = record.date
        ;(
          rows as { type: string; date?: string; record?: ShiftCheckout }[]
        ).push({ type: 'date', date: record.date })
      }
      ;(rows as { type: string; date?: string; record?: ShiftCheckout }[]).push(
        { type: 'record', record },
      )
    }
    return rows as (
      | { type: 'date'; date: string }
      | { type: 'record'; record: ShiftCheckout }
    )[]
  }, [pageRecords])

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Header + search */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl">{t('shiftCheckout.recordsTitle')}</h3>
        <input
          type="text"
          placeholder={t('shiftCheckout.searchPlaceholder')}
          className="h-10 w-64 rounded-lg border border-border bg-background px-3 text-md outline-none focus:border-primary"
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value)
            setCurrentPage(1)
          }}
        />
      </div>

      {/* Table */}
      {pageRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Receipt
            size={40}
            className="text-muted-foreground"
            strokeWidth={1.2}
          />
          <p className="text-muted-foreground">
            {t('shiftCheckout.noRecords')}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-md text-muted-foreground">
                  {t('shiftCheckout.shiftColumn')}
                </th>
                <th className="px-4 py-3 text-left text-md text-muted-foreground">
                  {t('shiftCheckout.staffColumn')}
                </th>
                <th className="px-4 py-3 text-right text-md text-muted-foreground">
                  {t('shiftCheckout.revenueColumn')}
                </th>
                <th className="px-4 py-3 text-right text-md text-muted-foreground">
                  {t('shiftCheckout.timeColumn')}
                </th>
              </tr>
            </thead>
            <tbody>
              {groupedRows.map(row => {
                if (row.type === 'date') {
                  return (
                    <tr key={`date-${row.date}`} className="bg-muted/50">
                      <td
                        colSpan={4}
                        className="px-4 py-2 text-md text-muted-foreground"
                      >
                        {row.date}
                      </td>
                    </tr>
                  )
                }
                const record = row.record
                return (
                  <tr
                    key={record.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 text-md">
                      {record.shift === 'morning'
                        ? t('shiftCheckout.morning')
                        : t('shiftCheckout.evening')}
                    </td>
                    <td className="px-4 py-3 text-md">
                      {record.orderStaffName || '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-md text-(--color-gold)">
                      {formatCurrency(record.revenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-md text-muted-foreground">
                      {dayjs(record.checkoutAt).format('h:mm A')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <PaginationControls
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}
