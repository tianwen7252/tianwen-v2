/**
 * OrderNotesChart — horizontal bar chart showing memo tag usage frequency.
 * Supports 3 view modes: bar (default), pie, and table.
 */

import { useState } from 'react'
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
import type { OrderNoteCount } from '@/lib/repositories/statistics-repository'

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'bar' | 'pie' | 'table'

interface OrderNotesChartProps {
  /** Array of note tags with their usage count. */
  data: OrderNoteCount[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_CHART_HEIGHT = 300
const ROW_HEIGHT = 40

// Palette 2: Ocean Breeze (consistent with Top10ProductsChart)
const PALETTE = CHART_PALETTES.sunsetHarvest

// ─── Component ───────────────────────────────────────────────────────────────

export function OrderNotesChart({ data }: OrderNotesChartProps) {
  const { t } = useTranslation()
  const [viewMode, setViewMode] = useState<ViewMode>('bar')

  const chartConfig = {
    count: {
      label: t('analytics.noteCount'),
      color: 'var(--chart-2)',
    },
  } satisfies ChartConfig

  const minHeight = Math.max(MIN_CHART_HEIGHT, data.length * ROW_HEIGHT)
  const fontSize = useAppStore().fontSize
  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.count)) : 0

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
          {t('analytics.orderNotesTitle')}
        </CardTitle>
        <CardDescription>{t('analytics.orderNotesDesc')}</CardDescription>
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
        {data.length === 0 ? (
          <ChartEmpty />
        ) : viewMode === 'bar' ? (
          <BarView
            data={data}
            chartConfig={chartConfig}
            minHeight={minHeight}
            fontSize={fontSize}
            maxValue={maxValue}
            t={t}
          />
        ) : viewMode === 'pie' ? (
          <PieView data={data} fontSize={fontSize} />
        ) : (
          <TableView data={data} />
        )}
      </CardContent>
    </Card>
  )
}

// ─── Bar sub-component ──────────────────────────────────────────────────────

interface BarViewProps {
  data: OrderNoteCount[]
  chartConfig: ChartConfig
  minHeight: number
  fontSize: number
  maxValue: number
  t: (key: string) => string
}

function BarView({
  data,
  chartConfig,
  minHeight,
  fontSize,
  maxValue,
  t,
}: BarViewProps) {
  const coloredData = data.map((item, i) => ({
    ...item,
    fill: getColor(PALETTE, i),
  }))

  return (
    <ChartContainer
      config={chartConfig}
      className="w-full"
      style={{ minHeight }}
    >
      <BarChart
        layout="vertical"
        data={coloredData}
        margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
        accessibilityLayer
      >
        <CartesianGrid horizontal={false} />
        <YAxis
          type="category"
          dataKey="note"
          width={100}
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
          dataKey="count"
          name={t('analytics.noteCount')}
          radius={[0, 4, 4, 0]}
        >
          <LabelList
            dataKey="count"
            position="insideRight"
            offset={8}
            className="fill-white"
            fontSize="var(--font-size)"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

// ─── Pie sub-component ──────────────────────────────────────────────────────

interface PieViewProps {
  data: OrderNoteCount[]
  fontSize: number
}

function PieView({ data, fontSize }: PieViewProps) {
  const coloredData = data.map((item, i) => ({
    ...item,
    fill: getColor(PALETTE, i),
  }))

  const config = data.reduce<ChartConfig>(
    (acc, item, i) => ({
      ...acc,
      [item.note]: { label: item.note, color: getColor(PALETTE, i) },
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
          nameKey="note"
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
  data: OrderNoteCount[]
}

function TableView({ data }: TableViewProps) {
  const { t } = useTranslation()
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b">
          <th className="pb-3 text-base text-muted-foreground">
            {t('analytics.noteCol')}
          </th>
          <th className="pb-3 text-right text-base text-muted-foreground">
            {t('analytics.countCol')}
          </th>
        </tr>
      </thead>
      <tbody>
        {data.map(item => (
          <tr key={item.note} className="border-b last:border-b-0">
            <td className="py-3 text-base">{item.note}</td>
            <td className="py-3 text-right text-base">{item.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
