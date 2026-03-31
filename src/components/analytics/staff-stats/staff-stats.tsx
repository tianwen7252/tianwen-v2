/**
 * StaffStats — composite section for the staff analytics tab.
 * Fetches staff KPIs, employee hours, and daily headcount in parallel, then renders:
 *   - StaffKpiGrid (when kpis available)
 *   - StaffHoursChart (when employee hours available)
 *   - DailyHeadcountChart (always, zero-filled)
 *   - AttendanceCalendar (when kpis available)
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  StatisticsRepository,
  StaffKpis,
  EmployeeHours,
  DailyHeadcount,
} from '@/lib/repositories/statistics-repository'
import { StaffKpiGrid } from './staff-kpi-grid'
import { StaffHoursChart } from './staff-hours-chart'
import { DailyHeadcountChart } from './daily-headcount-chart'
import { AttendanceCalendar } from './attendance-calendar'
import { StaffStatsSkeleton } from '@/components/analytics/chart-card-skeleton'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StaffStatsProps {
  startDate: Date
  endDate: Date
  statisticsRepo: StatisticsRepository
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Zero-fills sparse DailyHeadcount[] so the line chart shows a continuous series. */
function fillHeadcount(
  data: DailyHeadcount[],
  start: Date,
  end: Date,
): DailyHeadcount[] {
  const byDate = new Map<string, number>(data.map(d => [d.date, d.count]))
  const result: DailyHeadcount[] = []
  const cur = new Date(start)
  cur.setHours(0, 0, 0, 0)
  const last = new Date(end)
  last.setHours(0, 0, 0, 0)
  while (cur <= last) {
    const y = cur.getFullYear()
    const m = String(cur.getMonth() + 1).padStart(2, '0')
    const d = String(cur.getDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${d}`
    result.push({ date: dateStr, count: byDate.get(dateStr) ?? 0 })
    cur.setDate(cur.getDate() + 1)
  }
  return result
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Loads and displays all staff analytics for the selected date range.
 * Uses the cancelled-flag pattern to prevent state updates after unmount.
 */
export function StaffStats({
  startDate,
  endDate,
  statisticsRepo,
}: StaffStatsProps) {
  const { t } = useTranslation()
  const [kpis, setKpis] = useState<StaffKpis | null>(null)
  const [employeeHours, setEmployeeHours] = useState<EmployeeHours[]>([])
  const [dailyHeadcount, setDailyHeadcount] = useState<DailyHeadcount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    setKpis(null)
    setEmployeeHours([])
    setDailyHeadcount([])
    setLoading(true)
    setError(null)

    const range = {
      startDate: startDate.getTime(),
      endDate: endDate.getTime(),
    }

    Promise.all([
      statisticsRepo.getStaffKpis(range),
      statisticsRepo.getEmployeeHours(range),
      statisticsRepo.getDailyHeadcount(range),
    ])
      .then(([kpisResult, hoursResult, headcountResult]) => {
        if (cancelled) return
        setKpis(kpisResult)
        setEmployeeHours(hoursResult)
        setDailyHeadcount(headcountResult)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : t('analytics.loadError'),
          )
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [statisticsRepo, startDate, endDate, t])

  const filledHeadcount = fillHeadcount(dailyHeadcount, startDate, endDate)

  return (
    <section
      aria-label={t('analytics.staffStats')}
      className="flex flex-col gap-6"
    >
      {error !== null && <p className="text-destructive text-base">{error}</p>}

      {loading && error === null && <StaffStatsSkeleton />}

      {!loading && kpis !== null && <StaffKpiGrid kpis={kpis} />}

      {!loading && employeeHours.length > 0 && (
        <StaffHoursChart data={employeeHours} />
      )}

      {!loading && kpis !== null && (
        <DailyHeadcountChart
          data={filledHeadcount}
          totalEmployees={kpis.activeEmployeeCount}
        />
      )}

      {!loading && kpis !== null && (
        <AttendanceCalendar
          data={dailyHeadcount}
          statisticsRepo={statisticsRepo}
          totalEmployees={kpis.activeEmployeeCount}
          startDate={startDate}
        />
      )}
    </section>
  )
}
