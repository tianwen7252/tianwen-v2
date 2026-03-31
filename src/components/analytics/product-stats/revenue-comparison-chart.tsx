/**
 * RevenueComparisonChart — overlapping area chart comparing current month vs
 * previous month daily revenue. Supports line (default), pie, and table views.
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AreaChart,
  Area,
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
  LineChart as LineChartIcon,
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
import type { DailyRevenue } from '@/lib/repositories/statistics-repository'

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'line' | 'pie' | 'table'

interface RevenueComparisonChartProps {
  currentData: DailyRevenue[]
  prevData: DailyRevenue[]
}

interface MergedRow {
  day: number
  currentMonth: number
  previousMonth: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mergeByDay(
  current: DailyRevenue[],
  prev: DailyRevenue[],
): MergedRow[] {
  const currentByDay = new Map<number, number>()
  for (const d of current) {
    const day = Number(d.date.split('-')[2])
    currentByDay.set(day, d.revenue)
  }

  const prevByDay = new Map<number, number>()
  for (const d of prev) {
    const day = Number(d.date.split('-')[2])
    prevByDay.set(day, d.revenue)
  }

  const maxDay = Math.max(
    ...[...currentByDay.keys(), ...prevByDay.keys(), 0],
    current.length,
    prev.length,
  )

  if (maxDay <= 0) return []

  return Array.from({ length: maxDay }, (_, i) => {
    const day = i + 1
    return {
      day,
      currentMonth: currentByDay.get(day) ?? 0,
      previousMonth: prevByDay.get(day) ?? 0,
    }
  })
}

/** Format number as currency string. */
function formatCurrency(value: number): string {
  return `$${value.toLocaleString()}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RevenueComparisonChart({
  currentData,
  prevData,
}: RevenueComparisonChartProps) {
  const { t } = useTranslation()
  const fontSize = useAppStore().fontSize
  const [viewMode, setViewMode] = useState<ViewMode>('line')
  const chartData = mergeByDay(currentData, prevData)

  // Palette 3: Sunset Harvest
  const palette = CHART_PALETTES.mossForest

  const chartConfig = {
    currentMonth: {
      label: t('analytics.currentMonth'),
      color: palette[0],
    },
    previousMonth: {
      label: t('analytics.previousMonth'),
      color: palette[1],
    },
  } satisfies ChartConfig

  // Aggregate totals for pie chart
  const pieTotals = useMemo(() => {
    const totalCurrent = chartData.reduce((sum, d) => sum + d.currentMonth, 0)
    const totalPrev = chartData.reduce((sum, d) => sum + d.previousMonth, 0)
    return [
      { name: t('analytics.currentMonth'), value: totalCurrent },
      { name: t('analytics.previousMonth'), value: totalPrev },
    ]
  }, [chartData, t])

  const isEmpty =
    chartData.length === 0 ||
    chartData.every(d => d.currentMonth === 0 && d.previousMonth === 0)

  const viewButtons: {
    mode: ViewMode
    label: string
    icon: typeof LineChartIcon
  }[] = [
    { mode: 'line', label: t('analytics.viewLine'), icon: LineChartIcon },
    { mode: 'pie', label: t('analytics.viewPie'), icon: PieChartIcon },
    { mode: 'table', label: t('analytics.viewTable'), icon: TableIcon },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">
          {t('analytics.revenueComparisonTitle')}
        </CardTitle>
        <CardDescription>
          {t('analytics.revenueComparisonDesc')}
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
        ) : viewMode === 'line' ? (
          <AreaView
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

// ─── Area sub-component (line/area default view) ────────────────────────────

interface AreaViewProps {
  chartData: MergedRow[]
  chartConfig: ChartConfig
  fontSize: number
  t: (key: string) => string
}

function AreaView({ chartData, chartConfig, fontSize, t }: AreaViewProps) {
  return (
    <ChartContainer
      config={chartConfig}
      className="min-h-[250px] w-full [&_svg]:overflow-visible"
    >
      <AreaChart data={chartData} accessibilityLayer>
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
        <defs>
          <linearGradient id="fillCurrent" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-currentMonth)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-currentMonth)"
              stopOpacity={0.1}
            />
          </linearGradient>
          <linearGradient id="fillPrevious" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-previousMonth)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-previousMonth)"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="currentMonth"
          name={t('analytics.currentMonth')}
          stroke="var(--color-currentMonth)"
          fill="url(#fillCurrent)"
          strokeWidth={2}
        >
          <LabelList
            dataKey="currentMonth"
            position="top"
            offset={8}
            className="fill-foreground"
            fontSize={fontSize}
            formatter={(v: unknown) => `$${Number(v).toLocaleString()}`}
          />
        </Area>
        <Area
          type="monotone"
          dataKey="previousMonth"
          name={t('analytics.previousMonth')}
          stroke="var(--color-previousMonth)"
          fill="url(#fillPrevious)"
          strokeWidth={2}
        >
          <LabelList
            dataKey="previousMonth"
            position="top"
            offset={8}
            className="fill-foreground"
            fontSize={fontSize}
            formatter={(v: unknown) => `$${Number(v).toLocaleString()}`}
          />
        </Area>
      </AreaChart>
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
  chartData: MergedRow[]
}

function TableView({ chartData }: TableViewProps) {
  const { t } = useTranslation()
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b">
          <th className="pb-3 text-base text-muted-foreground">
            {t('analytics.dayCol')}
          </th>
          <th className="pb-3 text-right text-base text-muted-foreground">
            {t('analytics.currentMonthCol')}
          </th>
          <th className="pb-3 text-right text-base text-muted-foreground">
            {t('analytics.previousMonthCol')}
          </th>
        </tr>
      </thead>
      <tbody>
        {chartData.map(item => (
          <tr key={item.day} className="border-b last:border-b-0">
            <td className="py-3 text-base">{item.day}</td>
            <td className="py-3 text-right text-base">
              {formatCurrency(item.currentMonth)}
            </td>
            <td className="py-3 text-right text-base">
              {formatCurrency(item.previousMonth)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
