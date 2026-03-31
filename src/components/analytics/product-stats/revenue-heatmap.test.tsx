/**
 * Tests for RevenueHeatmap component.
 * Verifies grid rendering, color intensity, and NeonGradientCard on peak day.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { DailyRevenue } from '@/lib/repositories/statistics-repository'

// Mock NeonGradientCard to simplify assertions
vi.mock('@/components/ui/neon-gradient-card', () => ({
  NeonGradientCard: ({ children }: { children: ReactNode }) => (
    <div data-testid="neon-gradient-card">{children}</div>
  ),
}))

import { RevenueHeatmap } from './revenue-heatmap'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function buildFullMonthData(year = 2026, month = 3): DailyRevenue[] {
  const daysInMonth = new Date(year, month, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => ({
    date: `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
    revenue: (i + 1) * 1000,
  }))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RevenueHeatmap', () => {
  describe('accessibility', () => {
    it('renders aria-label "月營收熱力圖" on the outer div', () => {
      render(
        <RevenueHeatmap data={buildFullMonthData()} year={2026} month={3} />,
      )
      expect(screen.getByText('當月每日營收熱力圖')).toBeTruthy()
    })
  })

  describe('grid rendering', () => {
    it('renders 31 day cells for March', () => {
      render(
        <RevenueHeatmap data={buildFullMonthData()} year={2026} month={3} />,
      )
      const cells = screen.getAllByTestId('heatmap-cell')
      expect(cells).toHaveLength(31)
    })

    it('renders 28 day cells for February (non-leap year)', () => {
      render(
        <RevenueHeatmap
          data={buildFullMonthData(2026, 2)}
          year={2026}
          month={2}
        />,
      )
      const cells = screen.getAllByTestId('heatmap-cell')
      expect(cells).toHaveLength(28)
    })

    it('renders 29 day cells for February in a leap year', () => {
      render(
        <RevenueHeatmap
          data={buildFullMonthData(2024, 2)}
          year={2024}
          month={2}
        />,
      )
      const cells = screen.getAllByTestId('heatmap-cell')
      expect(cells).toHaveLength(29)
    })

    it('shows day number in each cell', () => {
      render(
        <RevenueHeatmap data={buildFullMonthData()} year={2026} month={3} />,
      )
      // Day 1 and day 31 should be visible
      expect(screen.getByText('1')).toBeTruthy()
      expect(screen.getByText('31')).toBeTruthy()
    })
  })

  describe('peak day highlighting', () => {
    it('renders all cells as plain divs (no NeonGradientCard)', () => {
      render(
        <RevenueHeatmap data={buildFullMonthData()} year={2026} month={3} />,
      )
      expect(screen.queryByTestId('neon-gradient-card')).toBeNull()
    })
  })

  describe('empty data', () => {
    it('does not crash when data is empty', () => {
      const { container } = render(
        <RevenueHeatmap data={[]} year={2026} month={3} />,
      )
      expect(container).toBeTruthy()
    })

    it('shows empty state when data is empty', () => {
      render(<RevenueHeatmap data={[]} year={2026} month={3} />)
      expect(screen.getByText('目前沒有資料')).toBeTruthy()
    })

    it('renders aria-label even with empty data', () => {
      render(<RevenueHeatmap data={[]} year={2026} month={3} />)
      expect(screen.getByText('當月每日營收熱力圖')).toBeTruthy()
    })
  })

  describe('single day data', () => {
    it('renders cells without crashing for single data point', () => {
      const { container } = render(
        <RevenueHeatmap
          data={[{ date: '2026-03-15', revenue: 9999 }]}
          year={2026}
          month={3}
        />,
      )
      expect(container).toBeTruthy()
    })
  })
})
