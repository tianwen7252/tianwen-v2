/**
 * Top10ProductsChart — horizontal bar chart ranking top 10 products.
 * Supports sorting by quantity or revenue via toggle buttons.
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
import { cn } from '@/lib/cn'
import { RippleButton } from '@/components/ui/ripple-button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from '@/components/ui/card'
import { ChartEmpty } from '@/components/analytics/chart-empty'
import { useAppStore } from '@/stores/app-store'
import { CHART_PALETTES, getColor } from '@/lib/analytics/chart-colors'
import type { ProductRanking } from '@/lib/repositories/statistics-repository'

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'bar' | 'pie' | 'table'

interface Top10ProductsChartProps {
  /** Up to 10 product items sorted by the active sort criterion. */
  items: ProductRanking[]
  /** Current sort mode. */
  sortBy: 'quantity' | 'revenue'
  /** Called when the user switches sort mode. */
  onSortChange: (sort: 'quantity' | 'revenue') => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_CHART_HEIGHT = 300
const ROW_HEIGHT = 40

// Palette 2: Ocean Breeze
const PALETTE = CHART_PALETTES.oceanBreeze

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface ChartRow {
  name: string
  value: number
}

function buildChartData(
  items: ProductRanking[],
  sortBy: 'quantity' | 'revenue',
): ChartRow[] {
  return items.map(item => ({
    name: item.name,
    value: sortBy === 'revenue' ? item.revenue : item.quantity,
  }))
}

/** Format number as currency string. */
function formatCurrency(value: number): string {
  return `$${value.toLocaleString()}`
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Top10ProductsChart({
  items,
  sortBy,
  onSortChange,
}: Top10ProductsChartProps) {
  const { t } = useTranslation()
  const [viewMode, setViewMode] = useState<ViewMode>('bar')

  const chartConfig = {
    value: {
      label:
        sortBy === 'revenue' ? t('analytics.revenue') : t('analytics.quantity'),
      color: 'var(--chart-2)',
    },
  } satisfies ChartConfig

  const chartData = buildChartData(items, sortBy)
  const minHeight = Math.max(MIN_CHART_HEIGHT, items.length * ROW_HEIGHT)
  const fontSize = useAppStore().fontSize
  const maxValue = Math.max(...chartData.map(d => d.value))

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
          {t('analytics.top10Title')}
        </CardTitle>
        <CardDescription>{t('analytics.top10Desc')}</CardDescription>
        <CardAction>
          <div className="flex flex-wrap gap-2">
            <RippleButton
              className={cn(
                'rounded-lg px-4 py-2 text-base transition-colors',
                sortBy === 'quantity'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
              onClick={() => onSortChange('quantity')}
            >
              {t('analytics.sortByQuantity')}
            </RippleButton>
            <RippleButton
              className={cn(
                'rounded-lg px-4 py-2 text-base transition-colors',
                sortBy === 'revenue'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
              onClick={() => onSortChange('revenue')}
            >
              {t('analytics.sortByRevenue')}
            </RippleButton>
            <div className="mx-1 border-l" />
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
        {chartData.length === 0 ? (
          <ChartEmpty />
        ) : viewMode === 'bar' ? (
          <BarView
            chartData={chartData}
            chartConfig={chartConfig}
            minHeight={minHeight}
            fontSize={fontSize}
            maxValue={maxValue}
            sortBy={sortBy}
            t={t}
          />
        ) : viewMode === 'pie' ? (
          <PieView chartData={chartData} fontSize={fontSize} />
        ) : (
          <TableView items={items} />
        )}
      </CardContent>
    </Card>
  )
}

// ─── Bar sub-component ──────────────────────────────────────────────────────

interface BarViewProps {
  chartData: ChartRow[]
  chartConfig: ChartConfig
  minHeight: number
  fontSize: number
  maxValue: number
  sortBy: 'quantity' | 'revenue'
  t: (key: string) => string
}

function BarView({
  chartData,
  chartConfig,
  minHeight,
  fontSize,
  maxValue,
  sortBy,
  t,
}: BarViewProps) {
  const coloredData = chartData.map((item, i) => ({
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
          dataKey="name"
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
          dataKey="value"
          name={
            sortBy === 'revenue'
              ? t('analytics.revenue')
              : t('analytics.quantity')
          }
          radius={[0, 4, 4, 0]}
        >
          <LabelList
            dataKey="value"
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
  chartData: ChartRow[]
  fontSize: number
}

function PieView({ chartData, fontSize }: PieViewProps) {
  const coloredData = chartData.map((item, i) => ({
    ...item,
    fill: getColor(PALETTE, i),
  }))

  const config = chartData.reduce<ChartConfig>(
    (acc, item, i) => ({
      ...acc,
      [item.name]: { label: item.name, color: getColor(PALETTE, i) },
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
  items: ProductRanking[]
}

function TableView({ items }: TableViewProps) {
  const { t } = useTranslation()
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b">
          <th className="pb-3 text-base text-muted-foreground">
            {t('analytics.productNameCol')}
          </th>
          <th className="pb-3 text-right text-base text-muted-foreground">
            {t('analytics.quantityCol')}
          </th>
          <th className="pb-3 text-right text-base text-muted-foreground">
            {t('analytics.revenueCol')}
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.name} className="border-b last:border-b-0">
            <td className="py-3 text-base">{item.name}</td>
            <td className="py-3 text-right text-base">{item.quantity}</td>
            <td className="py-3 text-right text-base">
              {formatCurrency(item.revenue)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
