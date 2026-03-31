/**
 * Tests for OrderTimeChart component.
 * Uses a recharts mock to avoid JSDOM SVG rendering issues.
 * Default view mode is line chart.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { HourBucket } from '@/lib/repositories/statistics-repository'

// Mock recharts so SVG elements don't fail in JSDOM
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: ({ children }: { children: ReactNode }) => (
    <div data-testid="line">{children}</div>
  ),
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
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LabelList: () => null,
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

import { OrderTimeChart } from './order-time-chart'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function buildFullHourlyData(peakHour = 12): HourBucket[] {
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: hour === peakHour ? 50 : 5,
  }))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('OrderTimeChart', () => {
  describe('card structure', () => {
    it('renders the card title', () => {
      render(<OrderTimeChart data={buildFullHourlyData()} />)
      expect(screen.getByText('訂單時段分布')).toBeTruthy()
    })
  })

  describe('chart rendering', () => {
    it('renders a ChartContainer wrapping a LineChart by default', () => {
      render(<OrderTimeChart data={buildFullHourlyData()} />)
      expect(screen.getByTestId('chart-container')).toBeTruthy()
      expect(screen.getByTestId('line-chart')).toBeTruthy()
    })

    it('renders a Line element', () => {
      render(<OrderTimeChart data={buildFullHourlyData()} />)
      expect(screen.getByTestId('line')).toBeTruthy()
    })
  })

  describe('empty data', () => {
    it('does not crash when given an empty array', () => {
      const { container } = render(<OrderTimeChart data={[]} />)
      expect(container).toBeTruthy()
    })

    it('renders the card title even with empty data', () => {
      render(<OrderTimeChart data={[]} />)
      expect(screen.getByText('訂單時段分布')).toBeTruthy()
    })
  })

  describe('peak hour detection', () => {
    it('renders without crashing when all counts are zero', () => {
      const allZero: HourBucket[] = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: 0,
      }))
      const { container } = render(<OrderTimeChart data={allZero} />)
      expect(container).toBeTruthy()
    })

    it('renders without crashing when a single hour has data', () => {
      const sparse: HourBucket[] = [{ hour: 10, count: 20 }]
      const { container } = render(<OrderTimeChart data={sparse} />)
      expect(container).toBeTruthy()
    })
  })

  describe('view mode buttons', () => {
    it('renders view mode toggle buttons', () => {
      render(<OrderTimeChart data={buildFullHourlyData()} />)
      expect(screen.getByRole('button', { name: /折線圖/ })).toBeTruthy()
      expect(screen.getByRole('button', { name: /圓餅圖/ })).toBeTruthy()
      expect(screen.getByRole('button', { name: /表格/ })).toBeTruthy()
    })
  })
})
