/**
 * Tests for Top10ProductsChart component.
 * Verifies chart rendering, sort toggle buttons, and card structure.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { ProductRanking } from '@/lib/repositories/statistics-repository'

// Mock recharts so SVG elements don't fail in JSDOM
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

import { Top10ProductsChart } from './top10-products-chart'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function buildItems(count: number): ProductRanking[] {
  return Array.from({ length: count }, (_, i) => ({
    comId: `com-${i + 1}`,
    name: `商品 ${i + 1}`,
    quantity: (count - i) * 10,
    revenue: (count - i) * 500,
  }))
}

const TEN_ITEMS = buildItems(10)
const FIVE_ITEMS = buildItems(5)

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Top10ProductsChart', () => {
  describe('card structure', () => {
    it('renders the card title', () => {
      render(
        <Top10ProductsChart
          items={TEN_ITEMS}
          sortBy="quantity"
          onSortChange={vi.fn()}
        />,
      )
      expect(screen.getByText('熱銷商品 Top 10')).toBeTruthy()
    })
  })

  describe('chart rendering', () => {
    it('renders a ChartContainer', () => {
      render(
        <Top10ProductsChart
          items={TEN_ITEMS}
          sortBy="quantity"
          onSortChange={vi.fn()}
        />,
      )
      expect(screen.getByTestId('chart-container')).toBeTruthy()
    })

    it('renders a BarChart', () => {
      render(
        <Top10ProductsChart
          items={TEN_ITEMS}
          sortBy="quantity"
          onSortChange={vi.fn()}
        />,
      )
      expect(screen.getByTestId('bar-chart')).toBeTruthy()
    })

    it('renders the value bar', () => {
      render(
        <Top10ProductsChart
          items={TEN_ITEMS}
          sortBy="quantity"
          onSortChange={vi.fn()}
        />,
      )
      expect(screen.getByTestId('bar-value')).toBeTruthy()
    })
  })

  describe('sort toggle buttons', () => {
    it('renders both sort toggle buttons (依數量 and 依營收)', () => {
      render(
        <Top10ProductsChart
          items={TEN_ITEMS}
          sortBy="quantity"
          onSortChange={vi.fn()}
        />,
      )
      expect(screen.getByRole('button', { name: '依數量' })).toBeTruthy()
      expect(screen.getByRole('button', { name: '依營收' })).toBeTruthy()
    })

    it('calls onSortChange with "revenue" when 依營收 button is clicked', () => {
      const onSortChange = vi.fn()
      render(
        <Top10ProductsChart
          items={TEN_ITEMS}
          sortBy="quantity"
          onSortChange={onSortChange}
        />,
      )
      fireEvent.click(screen.getByRole('button', { name: '依營收' }))
      expect(onSortChange).toHaveBeenCalledWith('revenue')
    })

    it('calls onSortChange with "quantity" when 依數量 button is clicked', () => {
      const onSortChange = vi.fn()
      render(
        <Top10ProductsChart
          items={TEN_ITEMS}
          sortBy="revenue"
          onSortChange={onSortChange}
        />,
      )
      fireEvent.click(screen.getByRole('button', { name: '依數量' }))
      expect(onSortChange).toHaveBeenCalledWith('quantity')
    })
  })

  describe('edge cases', () => {
    it('renders without crashing when items array is empty', () => {
      const { container } = render(
        <Top10ProductsChart
          items={[]}
          sortBy="quantity"
          onSortChange={vi.fn()}
        />,
      )
      expect(container).toBeTruthy()
    })

    it('renders without crashing when given a single item', () => {
      render(
        <Top10ProductsChart
          items={buildItems(1)}
          sortBy="quantity"
          onSortChange={vi.fn()}
        />,
      )
      expect(screen.getByTestId('bar-chart')).toBeTruthy()
    })

    it('renders with 5 items', () => {
      render(
        <Top10ProductsChart
          items={FIVE_ITEMS}
          sortBy="quantity"
          onSortChange={vi.fn()}
        />,
      )
      expect(screen.getByTestId('bar-chart')).toBeTruthy()
    })
  })

  describe('view mode buttons', () => {
    it('renders view mode toggle buttons', () => {
      render(
        <Top10ProductsChart
          items={TEN_ITEMS}
          sortBy="quantity"
          onSortChange={vi.fn()}
        />,
      )
      expect(screen.getByRole('button', { name: /長條圖/ })).toBeTruthy()
      expect(screen.getByRole('button', { name: /圓餅圖/ })).toBeTruthy()
      expect(screen.getByRole('button', { name: /表格/ })).toBeTruthy()
    })
  })
})
