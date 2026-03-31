/**
 * StaffKpiGrid — 4-column grid of staff KPI cards.
 * Uses the same PlainCard article style as ProductKpiGrid.
 */

import { useTranslation } from 'react-i18next'
import type { StaffKpis } from '@/lib/repositories/statistics-repository'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StaffKpiGridProps {
  kpis: StaffKpis
}

// ─── KPI card subcomponent ────────────────────────────────────────────────────

interface KpiCardProps {
  title: string
  value: string
  testId: string
}

function KpiCard({ title, value, testId }: KpiCardProps) {
  return (
    <article className="rounded-xl border bg-card p-4">
      <p className="text-muted-foreground text-base">{title}</p>
      <div className="mt-1 text-2xl font-normal" data-testid={testId}>
        {value}
      </div>
    </article>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StaffKpiGrid({ kpis }: StaffKpiGridProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-4 gap-4">
      <KpiCard
        title={t('analytics.activeEmployees')}
        value={kpis.activeEmployeeCount.toLocaleString()}
        testId="kpi-activeEmployeeCount"
      />
      <KpiCard
        title={t('analytics.totalAttendanceDays')}
        value={kpis.totalAttendanceDays.toLocaleString()}
        testId="kpi-totalAttendanceDays"
      />
      <KpiCard
        title={t('analytics.avgMonthlyHours')}
        value={`${kpis.avgMonthlyHours.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h`}
        testId="kpi-avgMonthlyHours"
      />
      <KpiCard
        title={t('analytics.leaveCount')}
        value={kpis.leaveCount.toLocaleString()}
        testId="kpi-leaveCount"
      />
    </div>
  )
}
