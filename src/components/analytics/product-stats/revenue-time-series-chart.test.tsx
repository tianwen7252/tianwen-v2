/**
 * Tests for RevenueTimeSeriesChart component.
 * Uses a recharts mock to avoid JSDOM SVG rendering issues.
 * Follows the same mock pattern as revenue-comparison-chart.test.tsx.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { AmPmRevenueRow } from '@/lib/repositories/statistics-repository'

// Mock recharts so SVG elements don't fail in JSDOM
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ name }: { name: string }) => <div data-testid={`bar-${name}`} />,
  PieChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ children }: { children: ReactNode }) => (
    <div data-testid="pie">{children}</div>
  ),
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
  Legend: () => <div data-testid="legend" />,
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

import { RevenueTimeSeriesChart } from './revenue-time-series-chart'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function buildAmPmData(): AmPmRevenueRow[] {
  return Array.from({ length: 10 }, (_, i) => ({
    date: `2026-03-${String(i + 1).padStart(2, '0')}`,
    amRevenue: (i + 1) * 500,
    pmRevenue: (i + 1) * 800,
  }))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RevenueTimeSeriesChart', () => {
  describe('card structure', () => {
    it('renders the card title', () => {
      render(<RevenueTimeSeriesChart data={buildAmPmData()} />)
      expect(screen.getByText('營收分析')).toBeTruthy()
    })

    it('renders the card description', () => {
      render(<RevenueTimeSeriesChart data={buildAmPmData()} />)
      expect(screen.getByText('上午/下午營收趨勢')).toBeTruthy()
    })
  })

  describe('chart rendering', () => {
    it('renders a ChartContainer with data', () => {
      render(<RevenueTimeSeriesChart data={buildAmPmData()} />)
      expect(screen.getByTestId('chart-container')).toBeTruthy()
    })

    it('renders a BarChart', () => {
      render(<RevenueTimeSeriesChart data={buildAmPmData()} />)
      expect(screen.getByTestId('bar-chart')).toBeTruthy()
    })

    it('renders the AM Bar', () => {
      render(<RevenueTimeSeriesChart data={buildAmPmData()} />)
      // name prop uses translated label from t('analytics.amRevenueShort') = "上午"
      expect(screen.getByTestId('bar-上午')).toBeTruthy()
    })

    it('renders the PM Bar', () => {
      render(<RevenueTimeSeriesChart data={buildAmPmData()} />)
      // name prop uses translated label from t('analytics.pmRevenueShort') = "下午"
      expect(screen.getByTestId('bar-下午')).toBeTruthy()
    })

    it('renders a ChartLegend', () => {
      render(<RevenueTimeSeriesChart data={buildAmPmData()} />)
      expect(screen.getByTestId('chart-legend')).toBeTruthy()
    })
  })

  describe('empty state', () => {
    it('shows ChartEmpty when data is empty', () => {
      render(<RevenueTimeSeriesChart data={[]} />)
      expect(screen.getByText('目前沒有資料')).toBeTruthy()
    })

    it('shows ChartEmpty when all values are zero', () => {
      const zeroData: AmPmRevenueRow[] = [
        { date: '2026-03-01', amRevenue: 0, pmRevenue: 0 },
        { date: '2026-03-02', amRevenue: 0, pmRevenue: 0 },
      ]
      render(<RevenueTimeSeriesChart data={zeroData} />)
      expect(screen.getByText('目前沒有資料')).toBeTruthy()
    })

    it('renders card title even with empty data', () => {
      render(<RevenueTimeSeriesChart data={[]} />)
      expect(screen.getByText('營收分析')).toBeTruthy()
    })
  })

  describe('single data point', () => {
    it('renders without crashing when given one data point', () => {
      const { container } = render(
        <RevenueTimeSeriesChart
          data={[{ date: '2026-03-01', amRevenue: 3000, pmRevenue: 5000 }]}
        />,
      )
      expect(container).toBeTruthy()
    })
  })

  describe('view mode buttons', () => {
    it('renders view mode toggle buttons', () => {
      render(<RevenueTimeSeriesChart data={buildAmPmData()} />)
      expect(screen.getByRole('button', { name: /長條圖/ })).toBeTruthy()
      expect(screen.getByRole('button', { name: /圓餅圖/ })).toBeTruthy()
      expect(screen.getByRole('button', { name: /表格/ })).toBeTruthy()
    })
  })
})
