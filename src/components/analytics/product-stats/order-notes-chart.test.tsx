/**
 * Tests for OrderNotesChart component.
 * Verifies chart rendering, card structure, and empty state handling.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { OrderNoteCount } from '@/lib/repositories/statistics-repository'

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

import { OrderNotesChart } from './order-notes-chart'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function buildData(count: number): OrderNoteCount[] {
  const tags = [
    '攤位',
    '外送',
    '加飯',
    '不要辣',
    '加湯',
    '打包',
    '內用',
    '素食',
  ]
  return Array.from({ length: count }, (_, i) => ({
    note: tags[i % tags.length]!,
    count: (count - i) * 5,
  }))
}

const SAMPLE_DATA = buildData(5)

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('OrderNotesChart', () => {
  describe('card structure', () => {
    it('renders the card title', () => {
      render(<OrderNotesChart data={SAMPLE_DATA} />)
      expect(screen.getByText('訂單備註分析')).toBeTruthy()
    })
  })

  describe('chart rendering', () => {
    it('renders a ChartContainer when data is present', () => {
      render(<OrderNotesChart data={SAMPLE_DATA} />)
      expect(screen.getByTestId('chart-container')).toBeTruthy()
    })

    it('renders a BarChart', () => {
      render(<OrderNotesChart data={SAMPLE_DATA} />)
      expect(screen.getByTestId('bar-chart')).toBeTruthy()
    })

    it('renders the count bar', () => {
      render(<OrderNotesChart data={SAMPLE_DATA} />)
      expect(screen.getByTestId('bar-count')).toBeTruthy()
    })
  })

  describe('empty state', () => {
    it('renders ChartEmpty when data is empty', () => {
      render(<OrderNotesChart data={[]} />)
      // ChartEmpty renders "目前沒有資料" text
      expect(screen.getByText('目前沒有資料')).toBeTruthy()
    })

    it('does not render chart container when data is empty', () => {
      render(<OrderNotesChart data={[]} />)
      expect(screen.queryByTestId('chart-container')).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('renders without crashing with a single item', () => {
      render(<OrderNotesChart data={buildData(1)} />)
      expect(screen.getByTestId('bar-chart')).toBeTruthy()
    })

    it('renders without crashing with many items', () => {
      render(<OrderNotesChart data={buildData(8)} />)
      expect(screen.getByTestId('bar-chart')).toBeTruthy()
    })
  })

  describe('view mode buttons', () => {
    it('renders view mode toggle buttons', () => {
      render(<OrderNotesChart data={SAMPLE_DATA} />)
      expect(screen.getByRole('button', { name: /長條圖/ })).toBeTruthy()
      expect(screen.getByRole('button', { name: /圓餅圖/ })).toBeTruthy()
      expect(screen.getByRole('button', { name: /表格/ })).toBeTruthy()
    })
  })
})
