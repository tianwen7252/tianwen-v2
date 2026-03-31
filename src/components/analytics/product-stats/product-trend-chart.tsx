/**
 * ProductTrendChart — line chart showing daily sales quantity for a selected
 * commodity. Supports line (default), bar, and table views.
 * Pie is not applicable for this data type.
 */

import { useState, useMemo } from 'react'
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select'
import { ChartEmpty } from '@/components/analytics/chart-empty'
import { RippleButton } from '@/components/ui/ripple-button'
import { cn } from '@/lib/cn'
import { useAppStore } from '@/stores/app-store'
import { CHART_PALETTES } from '@/lib/analytics/chart-colors'
import type { DailyRevenue } from '@/lib/repositories/statistics-repository'
import type { CommodityType } from '@/types/database'

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'line' | 'bar' | 'table'

interface CommodityOption {
  id: string
  name: string
  typeId: string
}

interface ProductTrendChartProps {
  data: DailyRevenue[]
  commodities: CommodityOption[]
  commodityTypes: CommodityType[]
  selectedId: string
  onSelectChange: (id: string) => void
}

interface ChartRow {
  day: string
  salesQuantity: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateAsMD(date: string): string {
  const parts = date.split('-')
  return parts.length === 3 ? `${Number(parts[1])}/${Number(parts[2])}` : date
}

function buildChartData(data: DailyRevenue[]): ChartRow[] {
  return data.map(d => ({
    day: formatDateAsMD(d.date),
    salesQuantity: d.revenue,
  }))
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductTrendChart({
  data,
  commodities,
  commodityTypes,
  selectedId,
  onSelectChange,
}: ProductTrendChartProps) {
  const { t } = useTranslation()
  const fontSize = useAppStore().fontSize
  const [viewMode, setViewMode] = useState<ViewMode>('line')
  const chartData = buildChartData(data)

  // Group commodities by type for SelectGroup, preserving commodityTypes order
  const groupedCommodities = useMemo(() => {
    // Build a lookup: typeId -> commodities belonging to that type
    const byType = new Map<string, CommodityOption[]>()
    for (const c of commodities) {
      const existing = byType.get(c.typeId)
      if (existing) {
        existing.push(c)
      } else {
        byType.set(c.typeId, [c])
      }
    }

    // Iterate in commodityTypes order to preserve: 餐盒 → 單點 → 飲料 → 水餃
    return commodityTypes
      .filter(ct => byType.has(ct.typeId))
      .map(ct => ({
        label: ct.label,
        items: byType.get(ct.typeId)!,
      }))
  }, [commodities, commodityTypes])

  // Palette 1: Moss Forest
  const chartConfig = {
    salesQuantity: {
      label: t('analytics.salesQuantity'),
      color: CHART_PALETTES.berryGarden[0],
    },
  } satisfies ChartConfig

  const isEmpty =
    chartData.length === 0 || chartData.every(d => d.salesQuantity === 0)

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
          {t('analytics.productTrendTitle')}
        </CardTitle>
        <CardDescription>{t('analytics.productTrendDesc')}</CardDescription>
        <CardAction>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedId} onValueChange={onSelectChange}>
              <SelectTrigger
                className="w-[200px]"
                aria-label={t('analytics.selectProduct')}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groupedCommodities.map(group => (
                  <SelectGroup key={group.label}>
                    <SelectLabel>{group.label}</SelectLabel>
                    {group.items.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
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
        {isEmpty ? (
          <ChartEmpty />
        ) : viewMode === 'line' ? (
          <LineView
            chartData={chartData}
            chartConfig={chartConfig}
            fontSize={fontSize}
          />
        ) : viewMode === 'bar' ? (
          <BarView
            chartData={chartData}
            chartConfig={chartConfig}
            fontSize={fontSize}
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
}

function LineView({ chartData, chartConfig, fontSize }: ChartViewProps) {
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
        <Line
          type="monotone"
          dataKey="salesQuantity"
          stroke="var(--color-salesQuantity)"
          strokeWidth={2}
          dot={false}
        >
          <LabelList
            dataKey="salesQuantity"
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

// ─── Bar sub-component ──────────────────────────────────────────────────────

function BarView({ chartData, chartConfig, fontSize }: ChartViewProps) {
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
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Bar
          dataKey="salesQuantity"
          fill="var(--color-salesQuantity)"
          radius={[4, 4, 0, 0]}
        >
          <LabelList
            dataKey="salesQuantity"
            position="top"
            fill="var(--foreground)"
            fontSize={fontSize}
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
            {t('analytics.quantityCol')}
          </th>
        </tr>
      </thead>
      <tbody>
        {chartData.map(item => (
          <tr key={item.day} className="border-b last:border-b-0">
            <td className="py-3 text-base">{item.day}</td>
            <td className="py-3 text-right text-base">{item.salesQuantity}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
