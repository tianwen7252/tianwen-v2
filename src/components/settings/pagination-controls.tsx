/**
 * Reusable pagination controls component.
 * Displays Previous/Next buttons and current page indicator.
 */

import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { RippleButton } from '@/components/ui/ripple-button'

// ── Types ───────────────────────────────────────────────────────────────────

interface PaginationControlsProps {
  readonly currentPage: number
  readonly totalPages: number
  readonly onPageChange: (page: number) => void
}

// ── Component ───────────────────────────────────────────────────────────────

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  const { t } = useTranslation()

  // Don't render if there is only one page or fewer
  if (totalPages <= 1) {
    return null
  }

  const isFirstPage = currentPage <= 1
  const isLastPage = currentPage >= totalPages

  return (
    <div className="flex items-center justify-center gap-4">
      <RippleButton
        className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-base text-foreground disabled:opacity-40"
        disabled={isFirstPage}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
        {t('common.pagination.prevPage')}
      </RippleButton>

      <span className="text-base text-muted-foreground">
        {t('common.pagination.page', {
          current: currentPage,
          total: totalPages,
        })}
      </span>

      <RippleButton
        className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-base text-foreground disabled:opacity-40"
        disabled={isLastPage}
        onClick={() => onPageChange(currentPage + 1)}
      >
        {t('common.pagination.nextPage')}
        <ChevronRight className="h-4 w-4" />
      </RippleButton>
    </div>
  )
}
