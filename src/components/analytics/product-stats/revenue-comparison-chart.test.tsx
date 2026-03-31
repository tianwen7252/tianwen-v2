/**
 * Tests for RevenueComparisonChart component.
 * Uses a recharts mock to avoid JSDOM SVG rendering issues.
 * After i18n: Area data keys are English (currentMonth, previousMonth),
 * labels come from t() returning zh-TW translations.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { DailyRevenue } from '@/lib/repositories/statistics-repository'

// Mock recharts so SVG elements don't fail in JSDOM
vi.mock('recharts', () => ({
  AreaChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: ({ name }: { name: string }) => <div data-testid={`area-${name}`} />,
  LineChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: ({ name }: { name: string }) => <div data-testid={`line-${name}`} />,
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

import { RevenueComparisonChart } from './revenue-comparison-chart'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function buildMonthData(): DailyRevenue[] {
  return Array.from({ length: 31 }, (_, i) => ({
    date: `2026-03-${String(i + 1).padStart(2, '0')}`,
    revenue: (i + 1) * 1000,
  }))
}

function buildPrevMonthData(): DailyRevenue[] {
  return Array.from({ length: 28 }, (_, i) => ({
    date: `2026-02-${String(i + 1).padStart(2, '0')}`,
    revenue: (i + 1) * 900,
  }))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RevenueComparisonChart', () => {
  describe('card structure', () => {
    it('renders the card title', () => {
      render(
        <RevenueComparisonChart
          currentData={buildMonthData()}
          prevData={buildPrevMonthData()}
        />,
      )
      expect(screen.getByText('本月 vs 上月營收')).toBeTruthy()
    })
  })

  describe('chart rendering', () => {
    it('renders a ChartContainer', () => {
      render(
        <RevenueComparisonChart
          currentData={buildMonthData()}
          prevData={buildPrevMonthData()}
        />,
      )
      expect(screen.getByTestId('chart-container')).toBeTruthy()
    })

    it('renders an AreaChart', () => {
      render(
        <RevenueComparisonChart
          currentData={buildMonthData()}
          prevData={buildPrevMonthData()}
        />,
      )
      expect(screen.getByTestId('area-chart')).toBeTruthy()
    })

    it('renders the currentMonth Area', () => {
      render(
        <RevenueComparisonChart
          currentData={buildMonthData()}
          prevData={buildPrevMonthData()}
        />,
      )
      // After i18n: name prop uses translated label from t('analytics.currentMonth') = "本月"
      expect(screen.getByTestId('area-本月')).toBeTruthy()
    })

    it('renders the previousMonth Area', () => {
      render(
        <RevenueComparisonChart
          currentData={buildMonthData()}
          prevData={buildPrevMonthData()}
        />,
      )
      // After i18n: name prop uses translated label from t('analytics.previousMonth') = "上月"
      expect(screen.getByTestId('area-上月')).toBeTruthy()
    })

    it('renders a ChartLegend', () => {
      render(
        <RevenueComparisonChart
          currentData={buildMonthData()}
          prevData={buildPrevMonthData()}
        />,
      )
      expect(screen.getByTestId('chart-legend')).toBeTruthy()
    })
  })

  describe('empty data', () => {
    it('does not crash when both arrays are empty', () => {
      const { container } = render(
        <RevenueComparisonChart currentData={[]} prevData={[]} />,
      )
      expect(container).toBeTruthy()
    })

    it('does not crash when currentData is empty but prevData has values', () => {
      const { container } = render(
        <RevenueComparisonChart
          currentData={[]}
          prevData={buildPrevMonthData()}
        />,
      )
      expect(container).toBeTruthy()
    })

    it('renders card title even with empty data', () => {
      render(<RevenueComparisonChart currentData={[]} prevData={[]} />)
      expect(screen.getByText('本月 vs 上月營收')).toBeTruthy()
    })
  })

  describe('single data point', () => {
    it('renders without crashing when given one data point each', () => {
      const { container } = render(
        <RevenueComparisonChart
          currentData={[{ date: '2026-03-01', revenue: 5000 }]}
          prevData={[{ date: '2026-02-01', revenue: 4000 }]}
        />,
      )
      expect(container).toBeTruthy()
    })
  })

  describe('view mode buttons', () => {
    it('renders view mode toggle buttons', () => {
      render(
        <RevenueComparisonChart
          currentData={buildMonthData()}
          prevData={buildPrevMonthData()}
        />,
      )
      expect(screen.getByRole('button', { name: /折線圖/ })).toBeTruthy()
      expect(screen.getByRole('button', { name: /圓餅圖/ })).toBeTruthy()
      expect(screen.getByRole('button', { name: /表格/ })).toBeTruthy()
    })
  })
})
