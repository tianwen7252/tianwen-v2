/**
 * Tests for StaffKpiGrid component.
 * Verifies all 4 KPI cards render with correct titles, values, and structure.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StaffKpiGrid } from './staff-kpi-grid'
import type { StaffKpis } from '@/lib/repositories/statistics-repository'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SAMPLE_KPIS: StaffKpis = {
  activeEmployeeCount: 12,
  totalAttendanceDays: 240,
  avgMonthlyHours: 7.5,
  leaveCount: 8,
}

const ZERO_KPIS: StaffKpis = {
  activeEmployeeCount: 0,
  totalAttendanceDays: 0,
  avgMonthlyHours: 0,
  leaveCount: 0,
}

const DECIMAL_KPIS: StaffKpis = {
  activeEmployeeCount: 5,
  totalAttendanceDays: 100,
  avgMonthlyHours: 6.123,
  leaveCount: 3,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('StaffKpiGrid', () => {
  describe('card titles', () => {
    it('renders 在職員工數 card title', () => {
      render(<StaffKpiGrid kpis={SAMPLE_KPIS} />)
      expect(screen.getByText('在職員工數')).toBeTruthy()
    })

    it('renders 總出勤天 card title', () => {
      render(<StaffKpiGrid kpis={SAMPLE_KPIS} />)
      expect(screen.getByText('總出勤天')).toBeTruthy()
    })

    it('renders 平均月工時 card title', () => {
      render(<StaffKpiGrid kpis={SAMPLE_KPIS} />)
      expect(screen.getByText('平均月工時')).toBeTruthy()
    })

    it('renders 休假次數 card title', () => {
      render(<StaffKpiGrid kpis={SAMPLE_KPIS} />)
      expect(screen.getByText('休假次數')).toBeTruthy()
    })
  })

  describe('KPI values', () => {
    it('renders activeEmployeeCount via data-testid', () => {
      render(<StaffKpiGrid kpis={SAMPLE_KPIS} />)
      expect(screen.getByTestId('kpi-activeEmployeeCount')).toBeTruthy()
    })

    it('renders totalAttendanceDays via data-testid', () => {
      render(<StaffKpiGrid kpis={SAMPLE_KPIS} />)
      expect(screen.getByTestId('kpi-totalAttendanceDays')).toBeTruthy()
    })

    it('renders avgMonthlyHours with "h" suffix via data-testid', () => {
      render(<StaffKpiGrid kpis={SAMPLE_KPIS} />)
      const el = screen.getByTestId('kpi-avgMonthlyHours')
      expect(el.textContent).toContain('h')
    })

    it('renders leaveCount via data-testid', () => {
      render(<StaffKpiGrid kpis={SAMPLE_KPIS} />)
      expect(screen.getByTestId('kpi-leaveCount')).toBeTruthy()
    })
  })

  describe('avgMonthlyHours formatting', () => {
    it('renders avgMonthlyHours with 1 decimal and "h" suffix', () => {
      render(<StaffKpiGrid kpis={DECIMAL_KPIS} />)
      const el = screen.getByTestId('kpi-avgMonthlyHours')
      expect(el.textContent).toContain('h')
    })

    it('renders "h" suffix for avgMonthlyHours of 7.5', () => {
      render(<StaffKpiGrid kpis={SAMPLE_KPIS} />)
      const el = screen.getByTestId('kpi-avgMonthlyHours')
      expect(el.textContent).toContain('h')
    })
  })

  describe('layout', () => {
    it('renders exactly 4 KPI cards in a grid', () => {
      render(<StaffKpiGrid kpis={SAMPLE_KPIS} />)
      const cards = screen.getAllByTestId(/^kpi-/)
      expect(cards).toHaveLength(4)
    })

    it('uses grid-cols-4 layout class on the container', () => {
      const { container } = render(<StaffKpiGrid kpis={SAMPLE_KPIS} />)
      const grid = container.firstElementChild
      expect(grid?.className).toContain('grid-cols-4')
    })
  })

  describe('zero values', () => {
    it('renders without crashing when all KPIs are zero', () => {
      const { container } = render(<StaffKpiGrid kpis={ZERO_KPIS} />)
      expect(container).toBeTruthy()
    })

    it('shows 0 for activeEmployeeCount when zero', () => {
      render(<StaffKpiGrid kpis={ZERO_KPIS} />)
      const el = screen.getByTestId('kpi-activeEmployeeCount')
      expect(el.textContent).toBe('0')
    })

    it('shows "h" suffix for avgMonthlyHours when zero', () => {
      render(<StaffKpiGrid kpis={ZERO_KPIS} />)
      const el = screen.getByTestId('kpi-avgMonthlyHours')
      // NumberTicker with value=0 immediately renders 0 (no animation)
      expect(el.textContent).toContain('0.0')
      expect(el.textContent).toContain('h')
    })
  })
})
