/**
 * AttendanceCalendar — monthly calendar grid showing per-day headcount.
 * Each cell is colored by attendance ratio: full=green, partial=yellow, none=gray.
 * Clicking a day fetches and displays the list of employees who attended.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import type {
  DailyHeadcount,
  StatisticsRepository,
} from '@/lib/repositories/statistics-repository'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttendanceCalendarProps {
  data: DailyHeadcount[]
  statisticsRepo: StatisticsRepository
  totalEmployees: number
  startDate: Date
}

type AttendanceLevel = 'full' | 'partial' | 'none'

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_HEADER_KEYS = [
  'analytics.daySun',
  'analytics.dayMon',
  'analytics.dayTue',
  'analytics.dayWed',
  'analytics.dayThu',
  'analytics.dayFri',
  'analytics.daySat',
] as const

const LEVEL_BG: Record<AttendanceLevel, string> = {
  full: 'bg-green-100 dark:bg-green-950',
  partial: 'bg-yellow-100 dark:bg-yellow-950',
  none: 'bg-gray-100 dark:bg-gray-800',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAttendanceLevel(
  count: number,
  totalEmployees: number,
): AttendanceLevel {
  if (totalEmployees > 0 && count >= totalEmployees) return 'full'
  if (count > 0) return 'partial'
  return 'none'
}

function formatDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// ─── Calendar cell type ───────────────────────────────────────────────────────

interface DayCell {
  day: number
  dateStr: string
}

function buildCells(year: number, month: number): Array<DayCell | null> {
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  const cells: Array<DayCell | null> = []

  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, dateStr: formatDateStr(year, month, day) })
  }

  const remainder = cells.length % 7
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      cells.push(null)
    }
  }

  return cells
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AttendanceCalendar({
  data,
  statisticsRepo,
  totalEmployees,
  startDate,
}: AttendanceCalendarProps) {
  const { t } = useTranslation()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [attendees, setAttendees] = useState<string[]>([])
  const [loadingAttendees, setLoadingAttendees] = useState(false)
  const [attendeeError, setAttendeeError] = useState<string | null>(null)

  const year = startDate.getFullYear()
  const month = startDate.getMonth() + 1

  const countByDate = new Map<string, number>(data.map(d => [d.date, d.count]))
  const cells = buildCells(year, month)

  useEffect(() => {
    if (selectedDate === null) return

    let cancelled = false

    setLoadingAttendees(true)
    setAttendees([])
    setAttendeeError(null)

    statisticsRepo
      .getDailyAttendeeList(selectedDate)
      .then(names => {
        if (cancelled) return
        setAttendees(names)
        setLoadingAttendees(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setAttendeeError(
          err instanceof Error ? err.message : t('analytics.loadError'),
        )
        setLoadingAttendees(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedDate, statisticsRepo])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">
          {t('analytics.attendanceCalendarTitle')}
        </CardTitle>
        <CardDescription>
          {t('analytics.attendanceCalendarDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="overflow-x-auto rounded-lg border">
          <div className="grid grid-cols-7">
            {DAY_HEADER_KEYS.map(key => (
              <div
                key={key}
                className="border-b p-2 text-center text-base font-normal text-muted-foreground"
              >
                {t(key)}
              </div>
            ))}

            {cells.map((cell, idx) => {
              if (cell === null) {
                return (
                  <div
                    key={`blank-${idx}`}
                    className="border-b border-r p-2 last:border-r-0"
                  />
                )
              }

              const count = countByDate.get(cell.dateStr) ?? 0
              const level = getAttendanceLevel(count, totalEmployees)
              const isSelected = selectedDate === cell.dateStr

              return (
                <button
                  key={cell.dateStr}
                  data-testid={`day-${cell.dateStr}`}
                  data-attendance={level}
                  onClick={() => setSelectedDate(cell.dateStr)}
                  aria-label={t('analytics.dayCount', { day: cell.day, count })}
                  aria-pressed={isSelected}
                  className={[
                    'cursor-pointer border-b border-r p-2 text-left transition-opacity last:border-r-0 hover:opacity-80',
                    LEVEL_BG[level],
                    isSelected ? 'ring-2 ring-inset ring-primary' : '',
                  ].join(' ')}
                >
                  <div className="text-base font-normal">{cell.day}</div>
                  <div className="text-base text-muted-foreground">
                    {t('analytics.personCount', { count })}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {selectedDate !== null && (
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 text-base font-normal">
              {t('analytics.attendeesOnDate', { date: selectedDate })}
            </h3>
            {loadingAttendees ? (
              <p className="text-base text-muted-foreground" role="status">
                {t('analytics.loading')}
              </p>
            ) : attendeeError !== null ? (
              <p className="text-base text-destructive">{attendeeError}</p>
            ) : attendees.length === 0 ? (
              <p className="text-base text-muted-foreground">
                {t('analytics.noAttendees')}
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {attendees.map(name => (
                  <li key={name} className="text-base">
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
