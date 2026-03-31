/**
 * StaffHoursChart — horizontal bar chart showing total working hours per employee.
 * Follows the same layout pattern as Top10ProductsChart.
 */

import { useTranslation } from 'react-i18next'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  Cell,
} from 'recharts'
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
import { CHART_PALETTES, getColor } from '@/lib/analytics/chart-colors'
import type { EmployeeHours } from '@/lib/repositories/statistics-repository'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StaffHoursChartProps {
  data: EmployeeHours[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_CHART_HEIGHT = 300
const ROW_HEIGHT = 40

// Palette 5: Mineral Stone
const PALETTE = CHART_PALETTES.mineralStone

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface ChartRow {
  name: string
  totalHours: number
}

function buildChartData(data: EmployeeHours[]): ChartRow[] {
  return data
    .map(row => ({
      name: row.employeeName,
      totalHours: Math.round(
        row.regular + row.paidLeave + row.sickLeave + row.personalLeave,
      ),
    }))
    .sort((a, b) => b.totalHours - a.totalHours)
}

// ─── Component ───────────────────────────────────────────────────────────────

export function StaffHoursChart({ data }: StaffHoursChartProps) {
  const { t } = useTranslation()
  const fontSize = useAppStore().fontSize

  const chartConfig = {
    totalHours: {
      label: t('analytics.totalHours'),
      color: 'var(--chart-3)',
    },
  } satisfies ChartConfig

  const chartData = buildChartData(data)
  const minHeight = Math.max(MIN_CHART_HEIGHT, data.length * ROW_HEIGHT)
  const maxValue = Math.max(...chartData.map(d => d.totalHours), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">
          {t('analytics.staffHoursTitle')}
        </CardTitle>
        <CardDescription>{t('analytics.staffHoursDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <ChartEmpty />
        ) : (
          <ChartContainer
            config={chartConfig}
            className="w-full"
            style={{ minHeight }}
          >
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
              accessibilityLayer
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                tickLine={false}
                tick={{ fontSize }}
                axisLine={false}
              />
              <XAxis
                type="number"
                domain={[0, maxValue * 1.13]}
                tick={{ fontSize }}
                hide
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Bar
                dataKey="totalHours"
                name={t('analytics.totalHours')}
                radius={[0, 4, 4, 0]}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={getColor(PALETTE, i)} />
                ))}
                <LabelList
                  dataKey="totalHours"
                  position="right"
                  offset={8}
                  className="fill-foreground"
                  fontSize="var(--font-size)"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
