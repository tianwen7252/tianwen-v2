/**
 * AvgOrderValueChart — line chart showing daily average order value with a
 * 7-day moving average overlay. Supports line (default), bar, and table views.
 * Pie is not applicable for this data type.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from 'recharts'
import {
  LineChart as LineChartIcon,
  BarChart3,
  Table as TableIcon,
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from '@/components/ui/card'
import { ChartEmpty } from '@/components/analytics/chart-empty'
import { RippleButton } from '@/components/ui/ripple-button'
import { cn } from '@/lib/cn'
import { useAppStore } from '@/stores/app-store'
import { CHART_PALETTES } from '@/lib/analytics/chart-colors'
import type { DailyRevenue } from '@/lib/repositories/statistics-repository'

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'line' | 'bar' | 'table'

interface AvgOrderValueChartProps {
  data: DailyRevenue[]
}

interface ChartRow {
  day: string
  avgOrderValue: number
  movingAvg7d: number | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WINDOW_SIZE = 7

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeMovingAverage(
  values: number[],
  window: number,
): (number | null)[] {
  return values.map((_, i) => {
    if (i < window - 1) return null
    const slice = values.slice(i - window + 1, i + 1)
    const sum = slice.reduce((acc, v) => acc + v, 0)
    return Math.round((sum / window) * 100) / 100
  })
}

function formatDateAsMD(date: string): string {
  const parts = date.split('-')
  return parts.length === 3 ? `${Number(parts[1])}/${Number(parts[2])}` : date
}

function buildChartData(data: DailyRevenue[]): ChartRow[] {
  const values = data.map(d => d.revenue)
  const ma = computeMovingAverage(values, WINDOW_SIZE)
  return data.map((d, i) => ({
    day: formatDateAsMD(d.date),
    avgOrderValue: d.revenue,
    movingAvg7d: ma[i] ?? null,
  }))
}

/** Format number as currency string. */
function formatCurrency(value: number): string {
  return `$${value.toLocaleString()}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AvgOrderValueChart({ data }: AvgOrderValueChartProps) {
  const { t } = useTranslation()
  const fontSize = useAppStore().fontSize
  const [viewMode, setViewMode] = useState<ViewMode>('line')
  const chartData = buildChartData(data)

  // Palette 4: Berry Garden
  const palette = CHART_PALETTES.oceanBreeze

  const chartConfig = {
    avgOrderValue: {
      label: t('analytics.avgOrderValue'),
      color: palette[0],
    },
    movingAvg7d: {
      label: t('analytics.movingAvg7d'),
      color: palette[1],
    },
  } satisfies ChartConfig

  const isEmpty =
    chartData.length === 0 || chartData.every(d => d.avgOrderValue === 0)

  const viewButtons: {
    mode: ViewMode
    label: string
    icon: typeof BarChart3
  }[] = [
    { mode: 'line', label: t('analytics.viewLine'), icon: LineChartIcon },
    { mode: 'bar', label: t('analytics.viewBar'), icon: BarChart3 },
    { mode: 'table', label: t('analytics.viewTable'), icon: TableIcon },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">
          {t('analytics.avgOrderValueTitle')}
        </CardTitle>
        <CardDescription>{t('analytics.avgOrderValueDesc')}</CardDescription>
        <CardAction>
          <div className="flex gap-2">
            {viewButtons.map(({ mode, label, icon: Icon }) => (
              <RippleButton
                key={mode}
                className={cn(
                  'flex items-center gap-1 rounded-lg px-4 py-2 text-base transition-colors',
                  viewMode === mode
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
                onClick={() => setViewMode(mode)}
              >
                <Icon className="h-4 w-4" />
                {label}
              </RippleButton>
            ))}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <ChartEmpty />
        ) : viewMode === 'line' ? (
          <LineView
            chartData={chartData}
            chartConfig={chartConfig}
            fontSize={fontSize}
            t={t}
          />
        ) : viewMode === 'bar' ? (
          <BarView
            chartData={chartData}
            chartConfig={chartConfig}
            fontSize={fontSize}
            t={t}
          />
        ) : (
          <TableView chartData={chartData} />
        )}
      </CardContent>
    </Card>
  )
}

// ─── Line sub-component ─────────────────────────────────────────────────────

interface ChartViewProps {
  chartData: ChartRow[]
  chartConfig: ChartConfig
  fontSize: number
  t: (key: string) => string
}

function LineView({ chartData, chartConfig, fontSize, t }: ChartViewProps) {
  return (
    <ChartContainer
      config={chartConfig}
      className="min-h-[250px] w-full [&_svg]:overflow-visible"
    >
      <LineChart data={chartData} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize }}
        />
        <YAxis tick={{ fontSize }} allowDecimals={false} hide />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <ChartLegend content={<ChartLegendContent className="text-base" />} />
        <Line
          type="monotone"
          dataKey="avgOrderValue"
          name={t('analytics.avgOrderValue')}
          stroke="var(--color-avgOrderValue)"
          strokeWidth={2}
          dot={false}
        >
          <LabelList
            dataKey="avgOrderValue"
            position="top"
            offset={8}
            className="fill-foreground"
            fontSize={fontSize}
            formatter={(v: unknown) => `$${Number(v).toLocaleString()}`}
          />
        </Line>
        <Line
          type="monotone"
          dataKey="movingAvg7d"
          name={t('analytics.movingAvg7d')}
          stroke="var(--color-movingAvg7d)"
          strokeWidth={2}
          dot={false}
          strokeDasharray="4 2"
        />
      </LineChart>
    </ChartContainer>
  )
}

// ─── Bar sub-component ──────────────────────────────────────────────────────

function BarView({ chartData, chartConfig, fontSize, t }: ChartViewProps) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <BarChart data={chartData} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize }}
        />
        <YAxis tick={{ fontSize }} allowDecimals={false} hide />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent className="text-base" />} />
        <Bar
          dataKey="avgOrderValue"
          name={t('analytics.avgOrderValue')}
          fill="var(--color-avgOrderValue)"
          radius={[4, 4, 0, 0]}
        >
          <LabelList
            dataKey="avgOrderValue"
            position="top"
            fill="var(--foreground)"
            fontSize={fontSize}
            formatter={(v: unknown) => `$${v}`}
          />
        </Bar>
        <Bar
          dataKey="movingAvg7d"
          name={t('analytics.movingAvg7d')}
          fill="var(--color-movingAvg7d)"
          radius={[4, 4, 0, 0]}
        >
          <LabelList
            dataKey="movingAvg7d"
            position="top"
            fill="var(--foreground)"
            fontSize={fontSize}
            formatter={(v: unknown) => `$${v}`}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

// ─── Table sub-component ────────────────────────────────────────────────────

interface TableViewProps {
  chartData: ChartRow[]
}

function TableView({ chartData }: TableViewProps) {
  const { t } = useTranslation()
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b">
          <th className="pb-3 text-base text-muted-foreground">
            {t('analytics.dateCol')}
          </th>
          <th className="pb-3 text-right text-base text-muted-foreground">
            {t('analytics.avgOrderValueCol')}
          </th>
          <th className="pb-3 text-right text-base text-muted-foreground">
            {t('analytics.movingAvg7dCol')}
          </th>
        </tr>
      </thead>
      <tbody>
        {chartData.map(item => (
          <tr key={item.day} className="border-b last:border-b-0">
            <td className="py-3 text-base">{item.day}</td>
            <td className="py-3 text-right text-base">
              {formatCurrency(item.avgOrderValue)}
            </td>
            <td className="py-3 text-right text-base">
              {item.movingAvg7d !== null
                ? formatCurrency(item.movingAvg7d)
                : '-'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
