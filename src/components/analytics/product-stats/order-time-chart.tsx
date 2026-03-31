/**
 * OrderTimeChart — line/bar chart showing order count distribution
 * for business hours (10AM–8PM) with V1-style time slot labels.
 * Supports 3 view modes: line (default), pie, and table.
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LineChart,
  Line,
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
import type { HourBucket } from '@/lib/repositories/statistics-repository'

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'line' | 'pie' | 'table'

interface OrderTimeChartProps {
  data: HourBucket[]
}

interface TwoHourBucket {
  label: string
  count: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PALETTE = CHART_PALETTES.mossForest

// V1-style time slot definitions: 10AM–8PM, 1-hour each, with lunch break 2–4 PM
const TIME_SLOTS: Array<{ hours: number[]; label: string; isBreak?: boolean }> =
  [
    { hours: [10], label: '10-11 AM' },
    { hours: [11], label: '11-12 PM' },
    { hours: [12], label: '12-1 PM' },
    { hours: [13], label: '1-2 PM' },
    { hours: [14, 15], label: '午休 (2-4 PM)', isBreak: true },
    { hours: [16], label: '4-5 PM' },
    { hours: [17], label: '5-6 PM' },
    { hours: [18], label: '6-7 PM' },
    { hours: [19], label: '7-8 PM' },
  ]

// Aggregate 24-hour data into V1-style time slots
function aggregateToTimeSlots(data: HourBucket[]): TwoHourBucket[] {
  const countByHour = new Map<number, number>(data.map(b => [b.hour, b.count]))
  return TIME_SLOTS.map(({ hours, label }) => ({
    label,
    count: hours.reduce((sum, h) => sum + (countByHour.get(h) ?? 0), 0),
  }))
}

// ─── Component ───────────────────────────────────────────────────────────────

export function OrderTimeChart({ data }: OrderTimeChartProps) {
  const { t } = useTranslation()
  const fontSize = useAppStore().fontSize
  const [viewMode, setViewMode] = useState<ViewMode>('line')

  const chartConfig = {
    count: {
      label: t('analytics.orderCountLabel'),
      color: 'var(--chart-1)',
    },
  } satisfies ChartConfig

  const buckets = useMemo(() => aggregateToTimeSlots(data), [data])
  const isEmpty = data.length === 0 || buckets.every(b => b.count === 0)

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
          {t('analytics.orderTimeTitle')}
        </CardTitle>
        <CardDescription>{t('analytics.orderTimeDesc')}</CardDescription>
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
            buckets={buckets}
            chartConfig={chartConfig}
            fontSize={fontSize}
          />
        ) : viewMode === 'pie' ? (
          <PieView buckets={buckets} fontSize={fontSize} />
        ) : (
          <TableView buckets={buckets} />
        )}
      </CardContent>
    </Card>
  )
}

// ─── Line sub-component ─────────────────────────────────────────────────────

interface LineViewProps {
  buckets: TwoHourBucket[]
  chartConfig: ChartConfig
  fontSize: number
}

function LineView({ buckets, chartConfig, fontSize }: LineViewProps) {
  return (
    <ChartContainer
      config={chartConfig}
      className="min-h-[250px] w-full aspect-[2/1] [&_svg]:overflow-visible"
    >
      <LineChart
        data={buckets}
        accessibilityLayer
        margin={{ left: 20, right: 20 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: fontSize - 4 }}
          interval={0}
          angle={-30}
          textAnchor="middle"
          height={80}
          tickMargin={30}
        />
        <YAxis tick={{ fontSize }} allowDecimals={false} hide />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Line
          type="step"
          dataKey="count"
          stroke={getColor(PALETTE, 0)}
          strokeWidth={2}
          dot={{ r: 5, fill: getColor(PALETTE, 0) }}
        >
          <LabelList
            dataKey="count"
            position="top"
            offset={8}
            className="fill-foreground"
            fontSize={fontSize}
          />
        </Line>
      </LineChart>
    </ChartContainer>
  )
}

// ─── Pie sub-component ──────────────────────────────────────────────────────

interface PieViewProps {
  buckets: TwoHourBucket[]
  fontSize: number
}

function PieView({ buckets, fontSize }: PieViewProps) {
  const coloredData = buckets.map((item, i) => ({
    ...item,
    fill: getColor(PALETTE, i),
  }))

  const config = buckets.reduce<ChartConfig>(
    (acc, item, i) => ({
      ...acc,
      [item.label]: { label: item.label, color: getColor(PALETTE, i) },
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
          dataKey="count"
          nameKey="label"
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
              {`${name ?? ''}: ${value ?? 0}`}
            </text>
          )}
        />
      </PieChart>
    </ChartContainer>
  )
}

// ─── Table sub-component ────────────────────────────────────────────────────

interface TableViewProps {
  buckets: TwoHourBucket[]
}

function TableView({ buckets }: TableViewProps) {
  const { t } = useTranslation()
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b">
          <th className="pb-3 text-base text-muted-foreground">
            {t('analytics.timeSlotCol')}
          </th>
          <th className="pb-3 text-right text-base text-muted-foreground">
            {t('analytics.orderCountCol')}
          </th>
        </tr>
      </thead>
      <tbody>
        {buckets.map(item => (
          <tr key={item.label} className="border-b last:border-b-0">
            <td className="py-3 text-base">{item.label}</td>
            <td className="py-3 text-right text-base">{item.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
