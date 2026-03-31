/**
 * Tests for StaffHoursChart component.
 * Uses a recharts mock to avoid JSDOM SVG rendering issues.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { EmployeeHours } from '@/lib/repositories/statistics-repository'

// Mock recharts so SVG elements don't fail in JSDOM
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ dataKey, name }: { dataKey: string; name: string }) => (
    <div data-testid={`bar-${dataKey}`} data-name={name} />
  ),
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LabelList: () => null,
  Cell: () => null,
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

import { StaffHoursChart } from './staff-hours-chart'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function buildEmployeeHours(count: number): EmployeeHours[] {
  return Array.from({ length: count }, (_, i) => ({
    employeeId: `emp-${i + 1}`,
    employeeName: `員工 ${i + 1}`,
    regular: 160 - i * 5,
    paidLeave: i * 2,
    sickLeave: i,
    personalLeave: 0,
    absent: 0,
  }))
}

const SAMPLE_DATA = buildEmployeeHours(3)

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('StaffHoursChart', () => {
  describe('chart rendering', () => {
    it('renders a ChartContainer', () => {
      render(<StaffHoursChart data={SAMPLE_DATA} />)
      expect(screen.getByTestId('chart-container')).toBeTruthy()
    })

    it('renders a BarChart', () => {
      render(<StaffHoursChart data={SAMPLE_DATA} />)
      expect(screen.getByTestId('bar-chart')).toBeTruthy()
    })

    it('renders a single Bar for totalHours', () => {
      render(<StaffHoursChart data={SAMPLE_DATA} />)
      expect(screen.getByTestId('bar-totalHours')).toBeTruthy()
    })

    it('renders card title', () => {
      render(<StaffHoursChart data={SAMPLE_DATA} />)
      expect(screen.getByText('員工工時排行')).toBeTruthy()
    })
  })

  describe('empty data', () => {
    it('renders without crashing when data is empty', () => {
      const { container } = render(<StaffHoursChart data={[]} />)
      expect(container).toBeTruthy()
    })

    it('shows empty state with empty data', () => {
      render(<StaffHoursChart data={[]} />)
      expect(screen.getByText('目前沒有資料')).toBeTruthy()
    })
  })

  describe('large data', () => {
    it('renders without crashing with 20 employees', () => {
      const { container } = render(
        <StaffHoursChart data={buildEmployeeHours(20)} />,
      )
      expect(container).toBeTruthy()
    })
  })
})
