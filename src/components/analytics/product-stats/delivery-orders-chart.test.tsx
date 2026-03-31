/**
 * Tests for DeliveryOrdersChart component.
 * Verifies pie chart rendering, card structure, and empty state.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { DeliveryProductRow } from '@/lib/repositories/statistics-repository'

// Mock recharts so SVG elements don't fail in JSDOM
vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ children, data }: { children: ReactNode; data: unknown[] }) => (
    <div data-testid="pie" data-count={data?.length ?? 0}>
      {children}
    </div>
  ),
  BarChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ children }: { children: ReactNode }) => (
    <div data-testid="bar">{children}</div>
  ),
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  LabelList: () => null,
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}))

// Mock the shadcn chart components
vi.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
  ChartLegend: ({ content }: { content: ReactNode }) => (
    <div data-testid="chart-legend">{content}</div>
  ),
  ChartLegendContent: () => <div data-testid="chart-legend-content" />,
}))

vi.mock('@/stores/app-store', () => ({
  useAppStore: () => ({ fontSize: 14 }),
}))

import { DeliveryOrdersChart } from './delivery-orders-chart'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SAMPLE_DATA: DeliveryProductRow[] = [
  {
    commodityId: 'com-1',
    commodityName: '招牌便當',
    quantity: 20,
    revenue: 3000,
  },
  {
    commodityId: 'com-2',
    commodityName: '排骨便當',
    quantity: 15,
    revenue: 2250,
  },
  {
    commodityId: 'com-3',
    commodityName: '雞腿便當',
    quantity: 10,
    revenue: 1800,
  },
]

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DeliveryOrdersChart', () => {
  describe('card structure', () => {
    it('renders the card title', () => {
      render(<DeliveryOrdersChart data={SAMPLE_DATA} />)
      // zh-TW: 外送訂單分析
      expect(screen.getByText('外送訂單分析')).toBeTruthy()
    })

    it('renders the card description', () => {
      render(<DeliveryOrdersChart data={SAMPLE_DATA} />)
      // zh-TW: 外送訂單商品佔比分布
      expect(screen.getByText('外送訂單商品佔比分布')).toBeTruthy()
    })
  })

  describe('chart rendering', () => {
    it('renders a ChartContainer when data is present', () => {
      render(<DeliveryOrdersChart data={SAMPLE_DATA} />)
      expect(screen.getByTestId('chart-container')).toBeTruthy()
    })

    it('renders a PieChart', () => {
      render(<DeliveryOrdersChart data={SAMPLE_DATA} />)
      expect(screen.getByTestId('pie-chart')).toBeTruthy()
    })

    it('renders a Pie element', () => {
      render(<DeliveryOrdersChart data={SAMPLE_DATA} />)
      expect(screen.getByTestId('pie')).toBeTruthy()
    })
  })

  describe('empty state', () => {
    it('renders ChartEmpty when data is empty', () => {
      render(<DeliveryOrdersChart data={[]} />)
      // ChartEmpty renders zh-TW: 目前沒有資料
      expect(screen.getByText('目前沒有資料')).toBeTruthy()
    })

    it('does not render chart container when data is empty', () => {
      render(<DeliveryOrdersChart data={[]} />)
      expect(screen.queryByTestId('chart-container')).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('renders without crashing with a single item', () => {
      render(<DeliveryOrdersChart data={[SAMPLE_DATA[0]!]} />)
      expect(screen.getByTestId('pie-chart')).toBeTruthy()
    })

    it('renders without crashing with many items', () => {
      const manyItems: DeliveryProductRow[] = Array.from(
        { length: 25 },
        (_, i) => ({
          commodityId: `com-${i}`,
          commodityName: `Product ${i}`,
          quantity: 10 + i,
          revenue: (10 + i) * 150,
        }),
      )
      render(<DeliveryOrdersChart data={manyItems} />)
      expect(screen.getByTestId('pie-chart')).toBeTruthy()
    })
  })

  describe('view mode buttons', () => {
    it('renders view mode toggle buttons', () => {
      render(<DeliveryOrdersChart data={SAMPLE_DATA} />)
      expect(screen.getByRole('button', { name: /圓餅圖/ })).toBeTruthy()
      expect(screen.getByRole('button', { name: /長條圖/ })).toBeTruthy()
      expect(screen.getByRole('button', { name: /表格/ })).toBeTruthy()
    })
  })
})
