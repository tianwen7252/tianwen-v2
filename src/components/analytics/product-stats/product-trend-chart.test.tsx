/**
 * Tests for ProductTrendChart component.
 * Uses a recharts mock to avoid JSDOM SVG rendering issues.
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
  Line: () => <div data-testid="line" />,
  BarChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
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
}))

// Mock the shadcn select components (Radix-based, no native <select>)
vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: ReactNode }) => (
    <div data-testid="select-root">{children}</div>
  ),
  SelectTrigger: ({ children }: { children: ReactNode }) => (
    <button data-testid="select-trigger">{children}</button>
  ),
  SelectValue: () => <span data-testid="select-value" />,
  SelectContent: ({ children }: { children: ReactNode }) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: { children: ReactNode; value: string }) => (
    <div data-testid={`select-item-${value}`}>{children}</div>
  ),
  SelectGroup: ({ children }: { children: ReactNode }) => (
    <div data-testid="select-group">{children}</div>
  ),
  SelectLabel: ({ children }: { children: ReactNode }) => (
    <div data-testid="select-label">{children}</div>
  ),
}))

vi.mock('@/stores/app-store', () => ({
  useAppStore: () => ({ fontSize: 14 }),
}))

import { ProductTrendChart } from './product-trend-chart'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const COMMODITIES = [
  { id: 'com-001', name: '招牌便當', typeId: 'bento' },
  { id: 'com-002', name: '排骨便當', typeId: 'bento' },
  { id: 'com-003', name: '雞腿便當', typeId: 'bento' },
]

const COMMODITY_TYPES = [
  {
    id: 'ct-001',
    typeId: 'bento',
    type: 'main-dish',
    label: '餐盒',
    color: 'green',
    createdAt: 0,
    updatedAt: 0,
  },
]

function buildTrendData(): DailyRevenue[] {
  return Array.from({ length: 30 }, (_, i) => ({
    date: `2026-03-${String(i + 1).padStart(2, '0')}`,
    revenue: Math.floor(Math.random() * 50) + 10,
  }))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProductTrendChart', () => {
  describe('card structure', () => {
    it('renders the card title', () => {
      render(
        <ProductTrendChart
          data={buildTrendData()}
          commodities={COMMODITIES}
          commodityTypes={COMMODITY_TYPES}
          selectedId="com-001"
          onSelectChange={vi.fn()}
        />,
      )
      expect(screen.getByText('商品銷售趨勢')).toBeTruthy()
    })
  })

  describe('chart rendering', () => {
    it('renders a ChartContainer', () => {
      render(
        <ProductTrendChart
          data={buildTrendData()}
          commodities={COMMODITIES}
          commodityTypes={COMMODITY_TYPES}
          selectedId="com-001"
          onSelectChange={vi.fn()}
        />,
      )
      expect(screen.getByTestId('chart-container')).toBeTruthy()
    })

    it('renders a LineChart', () => {
      render(
        <ProductTrendChart
          data={buildTrendData()}
          commodities={COMMODITIES}
          commodityTypes={COMMODITY_TYPES}
          selectedId="com-001"
          onSelectChange={vi.fn()}
        />,
      )
      expect(screen.getByTestId('line-chart')).toBeTruthy()
    })

    it('renders a Line element', () => {
      render(
        <ProductTrendChart
          data={buildTrendData()}
          commodities={COMMODITIES}
          commodityTypes={COMMODITY_TYPES}
          selectedId="com-001"
          onSelectChange={vi.fn()}
        />,
      )
      expect(screen.getByTestId('line')).toBeTruthy()
    })
  })

  describe('commodity select', () => {
    it('renders a select trigger', () => {
      render(
        <ProductTrendChart
          data={buildTrendData()}
          commodities={COMMODITIES}
          commodityTypes={COMMODITY_TYPES}
          selectedId="com-001"
          onSelectChange={vi.fn()}
        />,
      )
      expect(screen.getByTestId('select-trigger')).toBeTruthy()
    })

    it('renders select items for each commodity', () => {
      render(
        <ProductTrendChart
          data={buildTrendData()}
          commodities={COMMODITIES}
          commodityTypes={COMMODITY_TYPES}
          selectedId="com-001"
          onSelectChange={vi.fn()}
        />,
      )
      for (const c of COMMODITIES) {
        expect(screen.getByTestId(`select-item-${c.id}`)).toBeTruthy()
      }
    })
  })

  describe('empty data', () => {
    it('does not crash when data is empty', () => {
      const { container } = render(
        <ProductTrendChart
          data={[]}
          commodities={COMMODITIES}
          commodityTypes={COMMODITY_TYPES}
          selectedId="com-001"
          onSelectChange={vi.fn()}
        />,
      )
      expect(container).toBeTruthy()
    })

    it('does not crash when commodities list is empty', () => {
      const { container } = render(
        <ProductTrendChart
          data={[]}
          commodities={[]}
          commodityTypes={[]}
          selectedId=""
          onSelectChange={vi.fn()}
        />,
      )
      expect(container).toBeTruthy()
    })

    it('renders card title even with empty data', () => {
      render(
        <ProductTrendChart
          data={[]}
          commodities={[]}
          commodityTypes={[]}
          selectedId=""
          onSelectChange={vi.fn()}
        />,
      )
      expect(screen.getByText('商品銷售趨勢')).toBeTruthy()
    })
  })

  describe('single commodity', () => {
    it('renders without crashing with a single commodity', () => {
      render(
        <ProductTrendChart
          data={buildTrendData()}
          commodities={[{ id: 'com-001', name: '招牌便當', typeId: 'bento' }]}
          commodityTypes={COMMODITY_TYPES}
          selectedId="com-001"
          onSelectChange={vi.fn()}
        />,
      )
      expect(screen.getByText('招牌便當')).toBeTruthy()
    })
  })

  describe('view mode buttons', () => {
    it('renders view mode toggle buttons (line, bar, table)', () => {
      render(
        <ProductTrendChart
          data={buildTrendData()}
          commodities={COMMODITIES}
          commodityTypes={COMMODITY_TYPES}
          selectedId="com-001"
          onSelectChange={vi.fn()}
        />,
      )
      expect(screen.getByRole('button', { name: /折線圖/ })).toBeTruthy()
      expect(screen.getByRole('button', { name: /長條圖/ })).toBeTruthy()
      expect(screen.getByRole('button', { name: /表格/ })).toBeTruthy()
    })
  })
})
