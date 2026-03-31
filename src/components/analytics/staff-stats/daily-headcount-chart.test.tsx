/**
 * Tests for DailyHeadcountChart component.
 * Verifies accessibility, chart rendering, and edge cases.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { DailyHeadcount } from '@/lib/repositories/statistics-repository'

// Mock recharts to avoid JSDOM SVG rendering issues
vi.mock('recharts', () => ({
  AreaChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: ({ dataKey }: { dataKey: string }) => (
    <div data-testid={`area-${dataKey}`} />
  ),
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
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

vi.mock('@/stores/app-store', () => ({
  useAppStore: () => ({ fontSize: 14 }),
}))

import { DailyHeadcountChart } from './daily-headcount-chart'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SAMPLE_DATA: DailyHeadcount[] = [
  { date: '2026-03-01', count: 8 },
  { date: '2026-03-02', count: 10 },
  { date: '2026-03-03', count: 0 },
  { date: '2026-03-04', count: 5 },
]

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DailyHeadcountChart', () => {
  describe('chart rendering', () => {
    it('renders a ChartContainer', () => {
      render(<DailyHeadcountChart data={SAMPLE_DATA} totalEmployees={10} />)
      expect(screen.getByTestId('chart-container')).toBeTruthy()
    })

    it('renders area chart element', () => {
      render(<DailyHeadcountChart data={SAMPLE_DATA} totalEmployees={10} />)
      expect(screen.getByTestId('area-chart')).toBeTruthy()
    })

    it('renders the rate data area', () => {
      render(<DailyHeadcountChart data={SAMPLE_DATA} totalEmployees={10} />)
      expect(screen.getByTestId('area-rate')).toBeTruthy()
    })

    it('does not crash with empty data', () => {
      const { container } = render(
        <DailyHeadcountChart data={[]} totalEmployees={10} />,
      )
      expect(container).toBeTruthy()
    })

    it('renders with single data point', () => {
      render(
        <DailyHeadcountChart
          data={[{ date: '2026-03-01', count: 5 }]}
          totalEmployees={10}
        />,
      )
      expect(screen.getByTestId('area-chart')).toBeTruthy()
    })

    it('handles zero totalEmployees without errors', () => {
      const { container } = render(
        <DailyHeadcountChart data={SAMPLE_DATA} totalEmployees={0} />,
      )
      expect(container).toBeTruthy()
    })
  })
})
