/**
 * AnalyticsDatePicker — date selector for the analytics page.
 * Supports single-date and date-range modes with a Switch toggle.
 * Includes quick presets (today, this week, this month, last month)
 * and prev/next day navigation.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { RippleButton } from '@/components/ui/ripple-button'
import { Calendar } from '@/components/ui/calendar'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { DateRange as DayPickerRange } from 'react-day-picker'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DatePickerMode = 'single' | 'range'

export interface AnalyticsDatePickerProps {
  readonly startDate: Date
  readonly endDate: Date
  readonly onChange: (start: Date, end: Date) => void
}

// ─── Quick preset helpers ─────────────────────────────────────────────────────

function today(): { start: Date; end: Date } {
  return {
    start: dayjs().startOf('day').toDate(),
    end: dayjs().endOf('day').toDate(),
  }
}

function thisWeek(): { start: Date; end: Date } {
  return {
    start: dayjs().startOf('week').toDate(),
    end: dayjs().endOf('week').toDate(),
  }
}

function thisMonth(): { start: Date; end: Date } {
  return {
    start: dayjs().startOf('month').toDate(),
    end: dayjs().endOf('month').toDate(),
  }
}

function lastMonth(): { start: Date; end: Date } {
  const last = dayjs().subtract(1, 'month')
  return {
    start: last.startOf('month').toDate(),
    end: last.endOf('month').toDate(),
  }
}

// ─── Preset key configuration ────────────────────────────────────────────────

const PRESET_KEYS = [
  { key: 'analytics.today', getRange: today },
  { key: 'analytics.thisWeek', getRange: thisWeek },
  { key: 'analytics.thisMonth', getRange: thisMonth },
  { key: 'analytics.lastMonth', getRange: lastMonth },
] as const

// ─── Active preset detection ──────────────────────────────────────────────────

/**
 * Returns the i18n key of the preset whose range matches the given start/end dates,
 * or null if no preset matches.
 */
export function getActivePreset(startDate: Date, endDate: Date): string | null {
  for (const preset of PRESET_KEYS) {
    const { start, end } = preset.getRange()
    if (
      dayjs(start).isSame(startDate, 'day') &&
      dayjs(end).isSame(endDate, 'day')
    ) {
      return preset.key
    }
  }
  return null
}

// ─── Date format helper ───────────────────────────────────────────────────────

function formatDisplay(date: Date): string {
  return dayjs(date).format('YYYY-MM-DD')
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Date picker with quick preset buttons, a calendar popover for custom date
 * selection, and prev/next day navigation arrows.
 * Includes a Switch to toggle between single date and date range modes.
 */
export function AnalyticsDatePicker({
  startDate,
  endDate,
  onChange,
}: AnalyticsDatePickerProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [pendingRange, setPendingRange] = useState<DayPickerRange | undefined>(
    undefined,
  )
  // Track whether the user has clicked the first date in range mode
  const [rangeClickCount, setRangeClickCount] = useState(0)
  const [mode, setMode] = useState<DatePickerMode>('single')

  function handlePreset(getRange: () => { start: Date; end: Date }) {
    const { start, end } = getRange()
    onChange(start, end)
  }

  function handlePrevDay() {
    const newStart = dayjs(startDate).subtract(1, 'day').startOf('day').toDate()
    const newEnd = dayjs(startDate).subtract(1, 'day').endOf('day').toDate()
    onChange(newStart, newEnd)
  }

  function handleNextDay() {
    const newStart = dayjs(startDate).add(1, 'day').startOf('day').toDate()
    const newEnd = dayjs(startDate).add(1, 'day').endOf('day').toDate()
    onChange(newStart, newEnd)
  }

  function handleSingleSelect(date: Date | undefined) {
    if (!date) return
    onChange(
      dayjs(date).startOf('day').toDate(),
      dayjs(date).endOf('day').toDate(),
    )
    setIsOpen(false)
  }

  function handleRangeSelect(range: DayPickerRange | undefined) {
    const nextClick = rangeClickCount + 1
    setPendingRange(range)
    setRangeClickCount(nextClick)

    // Only commit on the second click (both from and to selected)
    if (nextClick >= 2 && range?.from && range?.to) {
      onChange(
        dayjs(range.from).startOf('day').toDate(),
        dayjs(range.to).endOf('day').toDate(),
      )
      setIsOpen(false)
      setPendingRange(undefined)
      setRangeClickCount(0)
    }
  }

  function handleModeToggle(checked: boolean) {
    const newMode = checked ? 'range' : 'single'
    setMode(newMode)
    setRangeClickCount(0)
    setPendingRange(undefined)
    // When switching to single, snap to startDate only
    if (newMode === 'single') {
      onChange(
        dayjs(startDate).startOf('day').toDate(),
        dayjs(startDate).endOf('day').toDate(),
      )
    }
  }

  const isSingleDay = dayjs(startDate).isSame(endDate, 'day')
  const displayText = isSingleDay
    ? formatDisplay(startDate)
    : `${formatDisplay(startDate)} — ${formatDisplay(endDate)}`

  const activePresetKey = getActivePreset(startDate, endDate)

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Quick preset buttons */}
      {PRESET_KEYS.map(preset => {
        const isActive = activePresetKey === preset.key
        return (
          <RippleButton
            key={preset.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => handlePreset(preset.getRange)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-base',
              isActive
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            {t(preset.key)}
          </RippleButton>
        )
      })}

      {/* Month navigation arrows + calendar popover */}
      <div className="flex items-center gap-1">
        <RippleButton
          type="button"
          aria-label={t('analytics.prevDay')}
          onClick={handlePrevDay}
          className="rounded-md p-2.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </RippleButton>

        <Popover
          open={isOpen}
          onOpenChange={open => {
            setIsOpen(open)
            if (open) {
              setRangeClickCount(0)
              setPendingRange(undefined)
            }
          }}
        >
          <PopoverTrigger asChild>
            <RippleButton
              type="button"
              className={cn(
                'flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-base',
                'hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <CalendarIcon className="h-4 w-4 shrink-0 opacity-60" />
              <span>{displayText}</span>
            </RippleButton>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            {mode === 'single' ? (
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={handleSingleSelect}
                disabled={{ after: new Date() }}
              />
            ) : (
              <Calendar
                mode="range"
                selected={pendingRange ?? { from: startDate, to: endDate }}
                onSelect={handleRangeSelect}
                numberOfMonths={2}
                disabled={{ after: new Date() }}
              />
            )}
          </PopoverContent>
        </Popover>

        {/* Single / Range toggle — visible next to calendar button */}
        <div className="flex items-center gap-2">
          <Switch
            id="date-mode-switch"
            checked={mode === 'range'}
            onCheckedChange={handleModeToggle}
          />
          <Label
            htmlFor="date-mode-switch"
            className="text-base text-muted-foreground"
          >
            {mode === 'single'
              ? t('analytics.singleDate')
              : t('analytics.dateRange')}
          </Label>
        </div>

        <RippleButton
          type="button"
          aria-label={t('analytics.nextDay')}
          onClick={handleNextDay}
          className="rounded-md p-2.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </RippleButton>
      </div>
    </div>
  )
}
