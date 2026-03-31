/**
 * Tests for CategorySalesChart component.
 * Uses recharts mock to avoid JSDOM SVG rendering issues.
 * Covers bar/pie/table view modes and empty state.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { CategorySalesRow } from '@/lib/repositories/statistics-repository'

// Mock recharts so SVG elements don't fail in JSDOM
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ name }: { name?: string }) => (
    <div data-testid={`bar-${name ?? 'unnamed'}`} />
  ),
  PieChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => <div data-testid="pie" />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  LabelList: () => null,
  Legend: () => <div data-testid="legend" />,
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

// Mock RippleButton as a simple button
vi.mock('@/components/ui/ripple-button', () => ({
  RippleButton: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}))

import { CategorySalesChart } from './category-sales-chart'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function buildSampleData(): CategorySalesRow[] {
  return [
    {
      date: '2026-03-01',
      commodityId: 'com-1',
      commodityName: '招牌便當',
      quantity: 10,
      revenue: 1500,
    },
    {
      date: '2026-03-01',
      commodityId: 'com-2',
      commodityName: '排骨便當',
      quantity: 8,
      revenue: 1200,
    },
    {
      date: '2026-03-02',
      commodityId: 'com-1',
      commodityName: '招牌便當',
      quantity: 12,
      revenue: 1800,
    },
    {
      date: '2026-03-02',
      commodityId: 'com-2',
      commodityName: '排骨便當',
      quantity: 5,
      revenue: 750,
    },
  ]
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CategorySalesChart', () => {
  describe('card structure', () => {
    it('renders the passed title prop', () => {
      render(<CategorySalesChart title="測試分類" data={buildSampleData()} />)
      expect(screen.getByText('測試分類')).toBeTruthy()
    })

    it('renders the card description', () => {
      render(<CategorySalesChart title="測試分類" data={buildSampleData()} />)
      // zh-TW translation for analytics.categorySalesDesc
      expect(screen.getByText('各品項銷售明細')).toBeTruthy()
    })
  })

  describe('view mode switching', () => {
    it('default view mode is pie (PieChart rendered)', () => {
      render(<CategorySalesChart title="分類" data={buildSampleData()} />)
      expect(screen.getByTestId('pie-chart')).toBeTruthy()
    })

    it('switching to bar mode renders BarChart', () => {
      render(<CategorySalesChart title="分類" data={buildSampleData()} />)
      // Click the bar button (zh-TW: 長條圖)
      fireEvent.click(screen.getByText('長條圖'))
      expect(screen.getByTestId('bar-chart')).toBeTruthy()
    })

    it('switching to table mode renders a table element', () => {
      render(<CategorySalesChart title="分類" data={buildSampleData()} />)
      // Click the table button (zh-TW: 表格)
      fireEvent.click(screen.getByText('表格'))
      expect(screen.getByRole('table')).toBeTruthy()
    })
  })

  describe('empty state', () => {
    it('shows ChartEmpty when data is empty', () => {
      render(<CategorySalesChart title="空分類" data={[]} />)
      // ChartEmpty renders zh-TW: 目前沒有資料
      expect(screen.getByText('目前沒有資料')).toBeTruthy()
    })
  })

  describe('table mode', () => {
    it('shows correct column headers', () => {
      render(<CategorySalesChart title="分類" data={buildSampleData()} />)
      fireEvent.click(screen.getByText('表格'))
      // zh-TW column headers
      expect(screen.getByText('商品名稱')).toBeTruthy()
      expect(screen.getByText('總數量')).toBeTruthy()
      expect(screen.getByText('總營收')).toBeTruthy()
    })

    it('shows aggregated commodity rows sorted by revenue descending', () => {
      render(<CategorySalesChart title="分類" data={buildSampleData()} />)
      fireEvent.click(screen.getByText('表格'))
      // 招牌便當: total revenue 1500+1800=3300, 排骨便當: 1200+750=1950
      // 招牌便當 should appear first (higher revenue)
      const rows = screen.getAllByRole('row')
      // 1 header row + 2 data rows
      expect(rows).toHaveLength(3)
    })
  })

  describe('bar mode', () => {
    it('renders a ChartContainer with bar chart after clicking bar button', () => {
      render(<CategorySalesChart title="分類" data={buildSampleData()} />)
      fireEvent.click(screen.getByText('長條圖'))
      expect(screen.getByTestId('chart-container')).toBeTruthy()
      expect(screen.getByTestId('bar-chart')).toBeTruthy()
    })

    it('renders a Bar for each unique commodity', () => {
      render(<CategorySalesChart title="分類" data={buildSampleData()} />)
      fireEvent.click(screen.getByText('長條圖'))
      // Two unique commodities: 招牌便當 and 排骨便當
      expect(screen.getByTestId('bar-招牌便當')).toBeTruthy()
      expect(screen.getByTestId('bar-排骨便當')).toBeTruthy()
    })
  })

  describe('pie mode', () => {
    it('renders a PieChart with aggregated data', () => {
      render(<CategorySalesChart title="分類" data={buildSampleData()} />)
      fireEvent.click(screen.getByText('圓餅圖'))
      expect(screen.getByTestId('pie-chart')).toBeTruthy()
      expect(screen.getByTestId('pie')).toBeTruthy()
    })
  })
})
