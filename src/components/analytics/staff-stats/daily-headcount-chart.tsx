/**
 * DailyHeadcountChart — area chart showing daily attendance rate as percentage.
 * X axis: date, Y axis: attendance rate (headcount / totalEmployees * 100).
 */

import { useTranslation } from 'react-i18next'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { ChartEmpty } from '@/components/analytics/chart-empty'
import { useAppStore } from '@/stores/app-store'
import { CHART_PALETTES } from '@/lib/analytics/chart-colors'
import type { DailyHeadcount } from '@/lib/repositories/statistics-repository'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyHeadcountChartProps {
  data: DailyHeadcount[]
  totalEmployees: number
}

interface ChartRow {
  date: string
  rate: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildChartData(
  data: DailyHeadcount[],
  totalEmployees: number,
): ChartRow[] {
  return data.map(d => ({
    date: d.date.slice(5),
    rate: totalEmployees > 0 ? Math.round((d.count / totalEmployees) * 100) : 0,
  }))
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DailyHeadcountChart({
  data,
  totalEmployees,
}: DailyHeadcountChartProps) {
  const { t } = useTranslation()
  const fontSize = useAppStore().fontSize

  // Palette 2: Ocean Breeze
  const palette = CHART_PALETTES.sunsetHarvest

  const chartConfig = {
    rate: {
      label: t('analytics.attendanceRate'),
      color: palette[0],
    },
  } satisfies ChartConfig

  const chartData = buildChartData(data, totalEmployees)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">
          {t('analytics.attendanceRateTitle')}
        </CardTitle>
        <CardDescription>{t('analytics.attendanceRateDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 || chartData.every(d => d.rate === 0) ? (
          <ChartEmpty />
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[280px] w-full">
            <AreaChart data={chartData} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize }}
              />
              <YAxis
                tick={{ fontSize }}
                allowDecimals={false}
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
                hide
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <defs>
                <linearGradient id="fillRate" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-rate)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-rate)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="rate"
                name={t('analytics.attendanceRate')}
                stroke="var(--color-rate)"
                fill="url(#fillRate)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
