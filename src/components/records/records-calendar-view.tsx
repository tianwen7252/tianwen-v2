/**
 * RecordsCalendarView - 7-column grid calendar showing attendance data per day.
 * Weekday header row, 6 rows x 7 columns, employee cards with time labels.
 */

import { useTranslation } from 'react-i18next'
import {
  WEEKDAY_LABELS,
  getCellDisplayType,
  dayRowHasAttendance,
} from '@/lib/records-utils'
import { calcTotalHours, formatTotalHours } from '@/lib/attendance-utils'
import { cn } from '@/lib/cn'
import { AvatarImage } from '@/components/avatar-image'
import type { Employee, Attendance } from '@/lib/schemas'
import type { CalendarDay } from '@/lib/records-utils'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RecordsCalendarViewProps {
  readonly calendarGrid: readonly (readonly CalendarDay[])[]
  readonly onEditRecord: (
    employee: Employee,
    date: string,
    record: Attendance,
  ) => void
  readonly onAddRecord: (employee: Employee, date: string) => void
  readonly onCellClick?: (date: string) => void
}

// ─── Sub-components ─────────────────────────────────────────────────────────

/** Render employee attendance cards inside a calendar day cell. */
function DayCellContent({
  day,
  onEditRecord,
  onAddRecord: _onAddRecord,
}: {
  readonly day: CalendarDay
  readonly onEditRecord: (
    employee: Employee,
    date: string,
    record: Attendance,
  ) => void
  readonly onAddRecord: (employee: Employee, date: string) => void
}) {
  const { t } = useTranslation()
  if (!day.isCurrentMonth) return null

  const hasAttendance = dayRowHasAttendance(day)

  // Weekend with no attendance shows translated label
  if (day.isWeekend && !hasAttendance) {
    return (
      <div className="mt-1 text-[#cbd5e1] font-medium">
        {t('records.weekendLabel')}
      </div>
    )
  }

  // No cells or empty cells
  if (day.cells.length === 0) return null

  // Filter cells that have attendance
  const activeCells = day.cells.filter((cell) => cell.attendances.length > 0)
  if (activeCells.length === 0) return null

  return (
    <div className="mt-1 flex flex-col gap-1">
      {activeCells.map((cell, cellIdx) => {
        const { employee, attendances } = cell
        const hasVacation = attendances.some(
          (a) => getCellDisplayType(a) === 'vacation',
        )
        const totalHours = calcTotalHours(attendances)

        return (
          <button
            key={employee.id}
            type="button"
            className={cn(
              'rounded px-1.5 py-1 cursor-pointer text-left w-full flex items-center gap-1 flex-wrap',
              cellIdx > 0 && 'border-t border-blue-grey/30',
            )}
            style={{
              backgroundColor:
                'color-mix(in srgb, var(--color-blue-grey) 10%, transparent)',
            }}
            onClick={(e) => {
              e.stopPropagation()
              onEditRecord(employee, day.date, attendances[0]!)
            }}
          >
            <AvatarImage avatar={employee.avatar} size={18} />
            <span className="text-md text-regal-navy">{employee.name}</span>
            <span className="text-md text-regal-navy ml-auto">
              {hasVacation
                ? t('records.vacation')
                : formatTotalHours(totalHours)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function RecordsCalendarView({
  calendarGrid,
  onEditRecord,
  onAddRecord,
  onCellClick,
}: RecordsCalendarViewProps) {
  const { t } = useTranslation()
  return (
    <div className="rounded-xl border border-regal-navy/10 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-px bg-regal-navy/10">
        {WEEKDAY_LABELS.map((label, idx) => (
          <div
            key={label}
            className={cn(
              'bg-regal-navy px-2 py-2 text-center text-[15px] font-bold text-lemon-chiffon',
              idx < 6 && 'border-r border-regal-navy/80',
            )}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-regal-navy/10">
        {calendarGrid.map((week, _weekIdx) =>
          week.map((day) => {
            const dateNum = parseInt(day.date.split('-')[2] ?? '0', 10)

            return (
              <div
                key={day.date}
                data-testid={`calendar-cell-${day.date}`}
                className={cn(
                  'min-h-[140px] bg-lemon-chiffon/40 p-3',
                  !day.isCurrentMonth && 'opacity-40',
                  day.isWeekend && 'bg-lemon-chiffon/20',
                  day.isToday &&
                    'border-2 border-blue-grey bg-lemon-chiffon/70',
                )}
                onClick={() => onCellClick?.(day.date)}
              >
                {/* Date label */}
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      'text-[15px] font-bold',
                      day.isCurrentMonth
                        ? 'text-regal-navy'
                        : 'text-regal-navy/40',
                    )}
                  >
                    {dateNum}
                  </span>
                  {day.isToday && (
                    <span className="rounded-full bg-blue-grey px-2 py-0.5 text-base font-bold text-white">
                      {t('records.todayBadge')}
                    </span>
                  )}
                </div>

                {/* Cell content */}
                <DayCellContent
                  day={day}
                  onEditRecord={onEditRecord}
                  onAddRecord={onAddRecord}
                />
              </div>
            )
          }),
        )}
      </div>
    </div>
  )
}
