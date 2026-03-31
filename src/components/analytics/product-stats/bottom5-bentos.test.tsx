/**
 * Tests for Bottom10Bentos component (horizontal bar chart).
 * Verifies card structure, chart rendering, and edge cases.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { ProductRanking } from '@/lib/repositories/statistics-repository'

// Mock recharts
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ dataKey }: { dataKey: string }) => (
    <div data-testid={`bar-${dataKey}`} />
  ),
  PieChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ children }: { children: ReactNode }) => (
    <div data-testid="pie">{children}</div>
  ),
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  LabelList: () => null,
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}))

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

import { Bottom10Bentos } from './bottom5-bentos'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function buildItems(count: number): ProductRanking[] {
  return Array.from({ length: count }, (_, i) => ({
    comId: `com-${i + 1}`,
    name: `便當 ${i + 1}`,
    quantity: (i + 1) * 2,
    revenue: (i + 1) * 100,
  }))
}

const TEN_ITEMS = buildItems(10)

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Bottom10Bentos', () => {
  describe('card structure', () => {
    it('renders the card title', () => {
      render(<Bottom10Bentos items={TEN_ITEMS} />)
      expect(screen.getByText('便當銷售末 10 名')).toBeTruthy()
    })
  })

  describe('chart rendering', () => {
    it('renders a ChartContainer', () => {
      render(<Bottom10Bentos items={TEN_ITEMS} />)
      expect(screen.getByTestId('chart-container')).toBeTruthy()
    })

    it('renders a BarChart', () => {
      render(<Bottom10Bentos items={TEN_ITEMS} />)
      expect(screen.getByTestId('bar-chart')).toBeTruthy()
    })

    it('renders the value bar', () => {
      render(<Bottom10Bentos items={TEN_ITEMS} />)
      expect(screen.getByTestId('bar-value')).toBeTruthy()
    })
  })

  describe('edge cases', () => {
    it('does not crash when items is empty', () => {
      const { container } = render(<Bottom10Bentos items={[]} />)
      expect(container).toBeTruthy()
    })

    it('renders with a single item', () => {
      render(<Bottom10Bentos items={buildItems(1)} />)
      expect(screen.getByTestId('bar-chart')).toBeTruthy()
    })

    it('renders with 3 items', () => {
      render(<Bottom10Bentos items={buildItems(3)} />)
      expect(screen.getByTestId('bar-chart')).toBeTruthy()
    })
  })

  describe('view mode buttons', () => {
    it('renders view mode toggle buttons', () => {
      render(<Bottom10Bentos items={TEN_ITEMS} />)
      expect(screen.getByRole('button', { name: /長條圖/ })).toBeTruthy()
      expect(screen.getByRole('button', { name: /圓餅圖/ })).toBeTruthy()
      expect(screen.getByRole('button', { name: /表格/ })).toBeTruthy()
    })
  })
})
