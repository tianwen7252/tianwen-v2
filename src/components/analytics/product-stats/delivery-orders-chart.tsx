/**
 * DeliveryOrdersChart — pie chart showing product distribution for delivery orders.
 * Supports 3 view modes: pie (default), bar, and table.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
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
import type { DeliveryProductRow } from '@/lib/repositories/statistics-repository'

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'pie' | 'bar' | 'table'

interface DeliveryOrdersChartProps {
  /** Array of delivery product rows with quantity and revenue. */
  data: DeliveryProductRow[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_CHART_HEIGHT = 300
const ROW_HEIGHT = 40

// ─── Palette ──────────────────────────────────────────────────────────────────

const PALETTE = CHART_PALETTES.mineralStone

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format number as currency string. */
function formatCurrency(value: number): string {
  return `$${value.toLocaleString()}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DeliveryOrdersChart({ data }: DeliveryOrdersChartProps) {
  const { t } = useTranslation()
  const [viewMode, setViewMode] = useState<ViewMode>('pie')
  const fontSize = useAppStore().fontSize

  // Build chartConfig immutably using reduce (not forEach mutation)
  const chartConfig = data.reduce<ChartConfig>(
    (acc, item, i) => ({
      ...acc,
      [item.commodityName]: {
        label: item.commodityName,
        color: getColor(PALETTE, i),
      },
    }),
    {},
  )

  const viewButtons: {
    mode: ViewMode
    label: string
    icon: typeof BarChart3
  }[] = [
    { mode: 'pie', label: t('analytics.viewPie'), icon: PieChartIcon },
    { mode: 'bar', label: t('analytics.viewBar'), icon: BarChart3 },
    { mode: 'table', label: t('analytics.viewTable'), icon: TableIcon },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">
          {t('analytics.deliveryOrdersTitle')}
        </CardTitle>
        <CardDescription>{t('analytics.deliveryOrdersDesc')}</CardDescription>
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
        ) : viewMode === 'pie' ? (
          <PieView data={data} chartConfig={chartConfig} fontSize={fontSize} />
        ) : viewMode === 'bar' ? (
          <BarView data={data} fontSize={fontSize} />
        ) : (
          <TableView data={data} />
        )}
      </CardContent>
    </Card>
  )
}

// ─── Pie sub-component ──────────────────────────────────────────────────────

interface PieViewProps {
  data: DeliveryProductRow[]
  chartConfig: ChartConfig
  fontSize: number
}

function PieView({ data, chartConfig, fontSize }: PieViewProps) {
  const coloredData = data.map((item, i) => ({
    ...item,
    fill: getColor(PALETTE, i),
  }))

  return (
    <ChartContainer
      config={chartConfig}
      className="min-h-[400px] w-full [&_svg]:overflow-visible"
    >
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent className="text-base" />} />
        <Pie
          data={coloredData}
          dataKey="quantity"
          nameKey="commodityName"
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

// ─── Bar sub-component ──────────────────────────────────────────────────────

interface BarViewProps {
  data: DeliveryProductRow[]
  fontSize: number
}

function BarView({ data, fontSize }: BarViewProps) {
  const coloredData = data.map((item, i) => ({
    ...item,
    fill: getColor(PALETTE, i),
  }))
  const minHeight = Math.max(MIN_CHART_HEIGHT, data.length * ROW_HEIGHT)
  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.quantity)) : 0

  const barConfig = {
    quantity: {
      label: 'quantity',
      color: PALETTE[0],
    },
  } satisfies ChartConfig

  return (
    <ChartContainer config={barConfig} className="w-full" style={{ minHeight }}>
      <BarChart
        layout="vertical"
        data={coloredData}
        margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
        accessibilityLayer
      >
        <CartesianGrid horizontal={false} />
        <YAxis
          type="category"
          dataKey="commodityName"
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
        <Bar dataKey="quantity" radius={[0, 4, 4, 0]}>
          <LabelList
            dataKey="quantity"
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

// ─── Table sub-component ────────────────────────────────────────────────────

interface TableViewProps {
  data: DeliveryProductRow[]
}

function TableView({ data }: TableViewProps) {
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
        {data.map(item => (
          <tr key={item.commodityName} className="border-b last:border-b-0">
            <td className="py-3 text-base">{item.commodityName}</td>
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
