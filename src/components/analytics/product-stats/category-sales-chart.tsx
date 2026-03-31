/**
 * CategorySalesChart — per-product sales breakdown within a commodity category.
 * Supports 3 view modes: bar (stacked), pie, and table.
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
import type { CategorySalesRow } from '@/lib/repositories/statistics-repository'

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'bar' | 'pie' | 'table'

interface CategorySalesChartProps {
  title: string
  data: CategorySalesRow[]
}

// ─── Data transformers (pure functions, no mutation) ─────────────────────────

/** Extract unique commodity names in stable order. */
function extractCommodityNames(data: readonly CategorySalesRow[]): string[] {
  const seen = new Set<string>()
  const names: string[] = []
  for (const row of data) {
    if (!seen.has(row.commodityName)) {
      seen.add(row.commodityName)
      names.push(row.commodityName)
    }
  }
  return names
}

/** Pivot raw rows into bar-chart-friendly format: one object per date. */
function pivotForBar(
  data: readonly CategorySalesRow[],
  commodityNames: readonly string[],
): Record<string, string | number>[] {
  const dateMap = new Map<string, Record<string, string | number>>()
  for (const row of data) {
    const parts = row.date.split('-')
    const day =
      parts.length === 3 ? `${Number(parts[1])}/${Number(parts[2])}` : row.date
    const existing = dateMap.get(row.date)
    if (existing) {
      dateMap.set(row.date, { ...existing, [row.commodityName]: row.quantity })
    } else {
      const zeroEntries = Object.fromEntries(commodityNames.map(n => [n, 0]))
      dateMap.set(row.date, {
        date: day,
        ...zeroEntries,
        [row.commodityName]: row.quantity,
      })
    }
  }
  // Add _total field for bar label display
  const result = Array.from(dateMap.values())
  for (const entry of result) {
    let total = 0
    for (const name of commodityNames) {
      total += Number(entry[name] ?? 0)
    }
    entry['_total'] = total
  }
  return result
}

/** Aggregate totals per commodity for pie chart and table. */
interface AggregatedCommodity {
  name: string
  quantity: number
  revenue: number
}

function aggregateTotals(
  data: readonly CategorySalesRow[],
): AggregatedCommodity[] {
  const map = new Map<string, AggregatedCommodity>()
  for (const row of data) {
    const existing = map.get(row.commodityName)
    if (existing) {
      map.set(row.commodityName, {
        ...existing,
        quantity: existing.quantity + row.quantity,
        revenue: existing.revenue + row.revenue,
      })
    } else {
      map.set(row.commodityName, {
        name: row.commodityName,
        quantity: row.quantity,
        revenue: row.revenue,
      })
    }
  }
  // Sort by revenue descending
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
}

/** Format number as currency string. */
function formatCurrency(value: number): string {
  return `$${value.toLocaleString()}`
}

// ─── Palette ────────────────────────────────────────────────────────────────

const PALETTE = CHART_PALETTES.berryGarden

// ─── Component ──────────────────────────────────────────────────────────────

export function CategorySalesChart({ title, data }: CategorySalesChartProps) {
  const { t } = useTranslation()
  const fontSize = useAppStore().fontSize
  const [viewMode, setViewMode] = useState<ViewMode>('pie')

  const commodityNames = useMemo(() => extractCommodityNames(data), [data])
  const barData = useMemo(
    () => pivotForBar(data, commodityNames),
    [data, commodityNames],
  )
  const aggregated = useMemo(() => aggregateTotals(data), [data])

  // Build chart config for bar mode (one entry per commodity)
  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {}
    commodityNames.forEach((name, i) => {
      config[name] = {
        label: name,
        color: getColor(PALETTE, i),
      }
    })
    return config satisfies ChartConfig
  }, [commodityNames])

  const isEmpty = data.length === 0

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
        <CardTitle className="font-normal">{title}</CardTitle>
        <CardDescription>{t('analytics.categorySalesDesc')}</CardDescription>
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
            barData={barData}
            commodityNames={commodityNames}
            chartConfig={chartConfig}
            fontSize={fontSize}
          />
        ) : viewMode === 'pie' ? (
          <PieView aggregated={aggregated} fontSize={fontSize} />
        ) : (
          <TableView aggregated={aggregated} />
        )}
      </CardContent>
    </Card>
  )
}

// ─── Bar sub-component ──────────────────────────────────────────────────────

interface BarViewProps {
  barData: Record<string, string | number>[]
  commodityNames: readonly string[]
  chartConfig: ChartConfig
  fontSize: number
}

function BarView({
  barData,
  commodityNames,
  chartConfig,
  fontSize,
}: BarViewProps) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <BarChart data={barData} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize }}
        />
        <YAxis tick={{ fontSize }} allowDecimals={false} hide />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent className="text-base" />} />
        {commodityNames.map((name, i) => (
          <Bar
            key={name}
            dataKey={name}
            name={name}
            stackId="sales"
            fill={getColor(PALETTE, i)}
            radius={
              i === commodityNames.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]
            }
          >
            {/* Show each segment's value inside the bar */}
            <LabelList
              dataKey={name}
              position="center"
              fill="#fff"
              fontSize={fontSize}
              formatter={(v: unknown) => (Number(v) > 0 ? String(v) : '')}
            />
          </Bar>
        ))}
      </BarChart>
    </ChartContainer>
  )
}

// ─── Pie sub-component ──────────────────────────────────────────────────────

interface PieViewProps {
  aggregated: AggregatedCommodity[]
  fontSize: number
}

function PieView({ aggregated, fontSize }: PieViewProps) {
  const coloredData = aggregated.map((item, i) => ({
    ...item,
    fill: getColor(PALETTE, i),
  }))

  const config = aggregated.reduce<ChartConfig>(
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
          dataKey="quantity"
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
  aggregated: AggregatedCommodity[]
}

function TableView({ aggregated }: TableViewProps) {
  const { t } = useTranslation()
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b">
          <th className="pb-3 text-base text-muted-foreground">
            {t('analytics.commodityNameCol')}
          </th>
          <th className="pb-3 text-right text-base text-muted-foreground">
            {t('analytics.totalQuantityCol')}
          </th>
          <th className="pb-3 text-right text-base text-muted-foreground">
            {t('analytics.totalRevenueCol')}
          </th>
        </tr>
      </thead>
      <tbody>
        {aggregated.map(item => (
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
