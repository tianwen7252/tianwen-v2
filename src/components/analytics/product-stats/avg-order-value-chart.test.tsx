/**
 * Tests for AvgOrderValueChart component.
 * Uses a recharts mock to avoid JSDOM SVG rendering issues.
 * After i18n: Line data keys are English (avgOrderValue, movingAvg7d),
 * labels come from t() returning zh-TW translations.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { DailyRevenue } from '@/lib/repositories/statistics-repository'

// Mock recharts so SVG elements don't fail in JSDOM
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: ({ name }: { name: string }) => <div data-testid={`line-${name}`} />,
  BarChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ name }: { name: string }) => <div data-testid={`bar-${name}`} />,
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

import { AvgOrderValueChart } from './avg-order-value-chart'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function buildAvgData(days = 30): DailyRevenue[] {
  return Array.from({ length: days }, (_, i) => ({
    date: `2026-03-${String(i + 1).padStart(2, '0')}`,
    revenue: 100 + i * 5,
  }))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AvgOrderValueChart', () => {
  describe('card structure', () => {
    it('renders the card title', () => {
      render(<AvgOrderValueChart data={buildAvgData()} />)
      expect(screen.getByText('平均客單價趨勢')).toBeTruthy()
    })
  })

  describe('chart rendering', () => {
    it('renders a ChartContainer', () => {
      render(<AvgOrderValueChart data={buildAvgData()} />)
      expect(screen.getByTestId('chart-container')).toBeTruthy()
    })

    it('renders a LineChart', () => {
      render(<AvgOrderValueChart data={buildAvgData()} />)
      expect(screen.getByTestId('line-chart')).toBeTruthy()
    })

    it('renders the avgOrderValue Line (raw values)', () => {
      render(<AvgOrderValueChart data={buildAvgData()} />)
      // After i18n: name prop = t('analytics.avgOrderValue') = "客單價"
      expect(screen.getByTestId('line-客單價')).toBeTruthy()
    })

    it('renders the movingAvg7d Line (moving average)', () => {
      render(<AvgOrderValueChart data={buildAvgData()} />)
      // After i18n: name prop = t('analytics.movingAvg7d') = "7日均線"
      expect(screen.getByTestId('line-7日均線')).toBeTruthy()
    })
  })

  describe('empty data', () => {
    it('does not crash when data is empty', () => {
      const { container } = render(<AvgOrderValueChart data={[]} />)
      expect(container).toBeTruthy()
    })

    it('renders card title even with empty data', () => {
      render(<AvgOrderValueChart data={[]} />)
      expect(screen.getByText('平均客單價趨勢')).toBeTruthy()
    })
  })

  describe('moving average computation', () => {
    it('renders without crashing with fewer than 7 data points', () => {
      const { container } = render(
        <AvgOrderValueChart data={buildAvgData(3)} />,
      )
      expect(container).toBeTruthy()
    })

    it('renders without crashing with exactly 7 data points', () => {
      const { container } = render(
        <AvgOrderValueChart data={buildAvgData(7)} />,
      )
      expect(container).toBeTruthy()
    })

    it('renders without crashing with 1 data point', () => {
      const { container } = render(
        <AvgOrderValueChart data={[{ date: '2026-03-01', revenue: 150 }]} />,
      )
      expect(container).toBeTruthy()
    })
  })

  describe('view mode buttons', () => {
    it('renders view mode toggle buttons (line, bar, table)', () => {
      render(<AvgOrderValueChart data={buildAvgData()} />)
      expect(screen.getByRole('button', { name: /折線圖/ })).toBeTruthy()
      expect(screen.getByRole('button', { name: /長條圖/ })).toBeTruthy()
      expect(screen.getByRole('button', { name: /表格/ })).toBeTruthy()
    })
  })
})
