/**
 * RevenueTimeSeriesChart — stacked bar chart showing AM vs PM revenue per day.
 * Supports 3 view modes: bar (default), pie (AM vs PM totals), and table.
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  PieChart,
  Pie,
  Sector,
} from 'recharts'
import type { PieSectorDataItem } from 'recharts/types/polar/Pie'
import {
  BarChart3,
  PieChart as PieChartIcon,
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
import { CHART_PALETTES, getColor } from '@/lib/analytics/chart-colors'
import type { AmPmRevenueRow } from '@/lib/repositories/statistics-repository'

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'bar' | 'pie' | 'table'

interface RevenueTimeSeriesChartProps {
  data: AmPmRevenueRow[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format YYYY-MM-DD as M/D for XAxis label. */
function formatDay(date: string): string {
  const parts = date.split('-')
  return parts.length === 3 ? `${Number(parts[1])}/${Number(parts[2])}` : date
}

/** Check whether all data points have zero revenue. */
function isAllZero(data: AmPmRevenueRow[]): boolean {
  return data.every(d => d.amRevenue === 0 && d.pmRevenue === 0)
}

/** Format number as currency string. */
function formatCurrency(value: number): string {
  return `$${value.toLocaleString()}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RevenueTimeSeriesChart({ data }: RevenueTimeSeriesChartProps) {
  const { t } = useTranslation()
  const fontSize = useAppStore().fontSize
  const [viewMode, setViewMode] = useState<ViewMode>('bar')

  // Palette 3: Sunset Harvest (same as revenue comparison for consistency)
  const palette = CHART_PALETTES.sunsetHarvest

  const chartConfig = {
    amRevenue: {
      label: t('analytics.amRevenueShort'),
      color: palette[0],
    },
    pmRevenue: {
      label: t('analytics.pmRevenueShort'),
      color: palette[1],
    },
  } satisfies ChartConfig

  // Format data with day label and computed total for top label
  const chartData = useMemo(
    () =>
      data.map(d => ({
        ...d,
        day: formatDay(d.date),
        total: d.amRevenue + d.pmRevenue,
      })),
    [data],
  )

  // Aggregate AM vs PM totals for pie chart
  const pieTotals = useMemo(() => {
    const totalAm = data.reduce((sum, d) => sum + d.amRevenue, 0)
    const totalPm = data.reduce((sum, d) => sum + d.pmRevenue, 0)
    return [
      { name: t('analytics.amRevenueShort'), value: totalAm },
      { name: t('analytics.pmRevenueShort'), value: totalPm },
    ]
  }, [data, t])

  const isEmpty = data.length === 0 || isAllZero(data)

  const viewButtons: {
    mode: ViewMode
    label: string
    icon: typeof BarChart3
  }[] = [
    { mode: 'bar', label: t('analytics.viewBar'), icon: BarChart3 },
    { mode: 'pie', label: t('analytics.viewPie'), icon: PieChartIcon },
    { mode: 'table', label: t('analytics.viewTable'), icon: TableIcon },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">
          {t('analytics.revenueTimeSeriesTitle')}
        </CardTitle>
        <CardDescription>
          {t('analytics.revenueTimeSeriesDesc')}
        </CardDescription>
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
        ) : viewMode === 'bar' ? (
          <BarView
            chartData={chartData}
            chartConfig={chartConfig}
            fontSize={fontSize}
            t={t}
          />
        ) : viewMode === 'pie' ? (
          <PieView
            pieTotals={pieTotals}
            palette={palette}
            fontSize={fontSize}
          />
        ) : (
          <TableView chartData={chartData} />
        )}
      </CardContent>
    </Card>
  )
}

// ─── Bar sub-component ──────────────────────────────────────────────────────

interface BarViewProps {
  chartData: Array<{
    day: string
    amRevenue: number
    pmRevenue: number
    total: number
  }>
  chartConfig: ChartConfig
  fontSize: number
  t: (key: string) => string
}

function BarView({ chartData, chartConfig, fontSize, t }: BarViewProps) {
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
          dataKey="amRevenue"
          name={t('analytics.amRevenueShort')}
          stackId="revenue"
          fill="var(--color-amRevenue)"
          radius={[0, 0, 0, 0]}
        >
          <LabelList
            dataKey="amRevenue"
            position="center"
            className="fill-white"
            fontSize={fontSize - 2}
            formatter={(v: unknown) => {
              const n = Number(v)
              return n > 0 ? `$${n.toLocaleString()}` : ''
            }}
          />
        </Bar>
        <Bar
          dataKey="pmRevenue"
          name={t('analytics.pmRevenueShort')}
          stackId="revenue"
          fill="var(--color-pmRevenue)"
          radius={[4, 4, 0, 0]}
        >
          <LabelList
            dataKey="pmRevenue"
            position="center"
            className="fill-white"
            fontSize={fontSize - 2}
            formatter={(v: unknown) => {
              const n = Number(v)
              return n > 0 ? `$${n.toLocaleString()}` : ''
            }}
          />
          <LabelList
            dataKey="total"
            position="top"
            offset={6}
            className="fill-foreground"
            fontSize={fontSize - 2}
            formatter={(v: unknown) => `$${Number(v).toLocaleString()}`}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

// ─── Pie sub-component ──────────────────────────────────────────────────────

interface PieViewProps {
  pieTotals: Array<{ name: string; value: number }>
  palette: readonly string[]
  fontSize: number
}

function PieView({ pieTotals, palette, fontSize }: PieViewProps) {
  const coloredData = pieTotals.map((item, i) => ({
    ...item,
    fill: getColor(palette, i),
  }))

  const config = pieTotals.reduce<ChartConfig>(
    (acc, item, i) => ({
      ...acc,
      [item.name]: { label: item.name, color: getColor(palette, i) },
    }),
    {},
  )

  return (
    <ChartContainer
      config={config}
      className="min-h-[400px] w-full [&_svg]:overflow-visible"
    >
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent className="text-base" />} />
        <Pie
          data={coloredData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={180}
          activeShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => (
            <Sector {...props} outerRadius={outerRadius + 10} />
          )}
          label={({
            name,
            value,
            x,
            y,
          }: {
            name?: string
            value?: number
            x?: number
            y?: number
          }) => (
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-foreground"
              fontSize={fontSize}
            >
              {`${name ?? ''}: ${formatCurrency(value ?? 0)}`}
            </text>
          )}
        />
      </PieChart>
    </ChartContainer>
  )
}

// ─── Table sub-component ────────────────────────────────────────────────────

interface TableViewProps {
  chartData: Array<{
    day: string
    amRevenue: number
    pmRevenue: number
    total: number
  }>
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
            {t('analytics.amRevenueCol')}
          </th>
          <th className="pb-3 text-right text-base text-muted-foreground">
            {t('analytics.pmRevenueCol')}
          </th>
          <th className="pb-3 text-right text-base text-muted-foreground">
            {t('analytics.totalRevenueShortCol')}
          </th>
        </tr>
      </thead>
      <tbody>
        {chartData.map(item => (
          <tr key={item.day} className="border-b last:border-b-0">
            <td className="py-3 text-base">{item.day}</td>
            <td className="py-3 text-right text-base">
              {formatCurrency(item.amRevenue)}
            </td>
            <td className="py-3 text-right text-base">
              {formatCurrency(item.pmRevenue)}
            </td>
            <td className="py-3 text-right text-base">
              {formatCurrency(item.total)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
