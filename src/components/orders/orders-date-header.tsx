/**
 * Date header for the Orders page.
 * Shows formatted date with relative label, prev/next day navigation,
 * a calendar popover for date selection, and a search button.
 */

import { useState } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { CalendarDays, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatOrderDate } from '@/lib/format-order-date'
import { buttonVariants } from '@/components/ui/button'
import { RippleButton } from '@/components/ui/ripple-button'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OrdersDateHeaderProps {
  readonly selectedDate: Dayjs
  readonly onDateChange: (date: Dayjs) => void
  readonly onSearchOpen: () => void
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Displays the currently selected date with a relative label (today/yesterday/weekday),
 * prev/next day navigation buttons, a calendar popover for date selection,
 * and a search button to open the search view.
 */
export function OrdersDateHeader({
  selectedDate,
  onDateChange,
  onSearchOpen,
}: OrdersDateHeaderProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { formatted, label } = formatOrderDate(selectedDate)

  /** Handle calendar date selection */
  function handleSelect(date: Date | undefined) {
    if (!date) return
    onDateChange(dayjs(date))
    setOpen(false)
  }

  /** Navigate to the previous day */
  function handlePrevDay() {
    onDateChange(selectedDate.subtract(1, 'day'))
  }

  /** Navigate to the next day */
  function handleNextDay() {
    onDateChange(selectedDate.add(1, 'day'))
  }

  return (
    <div
      data-testid="orders-date-header"
      className="flex items-center justify-between"
    >
      {/* Left group: date text + prev/next + calendar */}
      <div className="flex items-center gap-1">
        <span className="text-lg text-primary">
          {formatted} ({label})
        </span>

        {/* Prev day button */}
        <RippleButton
          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
          aria-label={t('orders.prevDay')}
          onClick={handlePrevDay}
        >
          <ChevronLeft className="h-5 w-5" />
        </RippleButton>

        {/* Calendar popover */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <RippleButton
              className={buttonVariants({ variant: 'outline', size: 'icon' })}
              aria-label="Select date"
            >
              <CalendarDays className="h-5 w-5" />
            </RippleButton>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              captionLayout="dropdown"
              selected={selectedDate.toDate()}
              onSelect={handleSelect}
              startMonth={new Date(2024, 0)}
              endMonth={new Date(2030, 11)}
            />
          </PopoverContent>
        </Popover>

        {/* Next day button */}
        <RippleButton
          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
          aria-label={t('orders.nextDay')}
          onClick={handleNextDay}
        >
          <ChevronRight className="h-5 w-5" />
        </RippleButton>

        {/* Right: search button */}
        <RippleButton
          className={buttonVariants({ variant: 'outline', size: 'icon' })}
          aria-label={t('common.search')}
          onClick={onSearchOpen}
        >
          <Search className="h-5 w-5" />
        </RippleButton>
      </div>
    </div>
  )
}
