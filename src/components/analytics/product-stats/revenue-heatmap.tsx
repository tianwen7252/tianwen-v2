/**
 * RevenueHeatmap — monthly revenue heatmap grid.
 * Each day is rendered as a cell whose background opacity reflects its
 * revenue relative to the month's peak day. The peak day is highlighted
 * with a NeonGradientCard.
 */

import { useTranslation } from 'react-i18next'
import { ChartEmpty } from '@/components/analytics/chart-empty'
import { formatCurrency } from '@/lib/currency'
import { CHART_PALETTES } from '@/lib/analytics/chart-colors'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import type { DailyRevenue } from '@/lib/repositories/statistics-repository'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RevenueHeatmapProps {
  /** Daily revenue entries for the target month. */
  data: DailyRevenue[]
  year: number
  /** Month number 1–12. */
  month: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_OPACITY = 0.05
const MAX_OPACITY = 0.85

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function buildRevenueMap(data: DailyRevenue[]): Map<number, number> {
  const map = new Map<number, number>()
  for (const d of data) {
    const day = Number(d.date.split('-')[2])
    map.set(day, d.revenue)
  }
  return map
}

function computeOpacity(revenue: number, maxRevenue: number): number {
  if (maxRevenue <= 0) return MIN_OPACITY
  return MIN_OPACITY + (revenue / maxRevenue) * (MAX_OPACITY - MIN_OPACITY)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RevenueHeatmap({ data, year, month }: RevenueHeatmapProps) {
  const { t } = useTranslation()
  const totalDays = daysInMonth(year, month)
  const revenueMap = buildRevenueMap(data)

  const maxRevenue = Math.max(...Array.from(revenueMap.values()), 0)

  const peakDay =
    maxRevenue > 0
      ? Array.from(revenueMap.entries()).reduce<number | null>(
          (best, [day, rev]) =>
            rev === maxRevenue && best === null ? day : best,
          null,
        )
      : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">
          {t('analytics.heatmapTitle')}
        </CardTitle>
        <CardDescription>{t('analytics.heatmapDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 || data.every(d => d.revenue === 0) ? (
          <ChartEmpty />
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: totalDays }, (_, i) => {
              const day = i + 1
              const revenue = revenueMap.get(day) ?? 0
              const opacity = computeOpacity(revenue, maxRevenue)
              const isPeak = day === peakDay

              const cellContent = (
                <div
                  data-testid="heatmap-cell"
                  className="flex aspect-square flex-col items-center justify-center rounded-md text-base"
                  style={{
                    // Palette 1: Moss Forest
                    backgroundColor: `color-mix(in srgb, ${CHART_PALETTES.mineralStone[0]} ${Math.round((isPeak ? 1 : opacity) * 100)}%, transparent)`,
                    color:
                      opacity > 0.5
                        ? 'var(--primary-foreground)'
                        : 'var(--foreground)',
                  }}
                >
                  <span>{day}</span>
                  {revenue > 0 && (
                    <span className="text-xs opacity-80">
                      {formatCurrency(revenue)}
                    </span>
                  )}
                </div>
              )

              return <div key={day}>{cellContent}</div>
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
