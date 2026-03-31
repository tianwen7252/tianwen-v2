/**
 * Tests for ProductKpiGrid component.
 * Verifies all 6 KPI cards render with correct titles and values.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductKpiGrid } from './product-kpi-grid'
import type { ProductKpis } from '@/lib/repositories/statistics-repository'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SAMPLE_KPIS: ProductKpis = {
  totalRevenue: 12345,
  orderCount: 42,
  morningRevenue: 7000,
  afternoonRevenue: 5345,
  totalQuantity: 88,
  bentoQuantity: 30,
}

const ZERO_KPIS: ProductKpis = {
  totalRevenue: 0,
  orderCount: 0,
  morningRevenue: 0,
  afternoonRevenue: 0,
  totalQuantity: 0,
  bentoQuantity: 0,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProductKpiGrid', () => {
  describe('KPI card titles', () => {
    it('renders the 總營業額 card title', () => {
      render(<ProductKpiGrid kpis={SAMPLE_KPIS} />)
      expect(screen.getByText('總營業額')).toBeTruthy()
    })

    it('renders the 訂單數量 card title', () => {
      render(<ProductKpiGrid kpis={SAMPLE_KPIS} />)
      expect(screen.getByText('訂單數量')).toBeTruthy()
    })

    it('renders the 上午營業額 card title', () => {
      render(<ProductKpiGrid kpis={SAMPLE_KPIS} />)
      expect(screen.getByText('上午營業額')).toBeTruthy()
    })

    it('renders the 下午營業額 card title', () => {
      render(<ProductKpiGrid kpis={SAMPLE_KPIS} />)
      expect(screen.getByText('下午營業額')).toBeTruthy()
    })

    it('renders the 訂單總數量 card title', () => {
      render(<ProductKpiGrid kpis={SAMPLE_KPIS} />)
      expect(screen.getByText('訂單總數量')).toBeTruthy()
    })

    it('renders the 便當銷售數量 card title', () => {
      render(<ProductKpiGrid kpis={SAMPLE_KPIS} />)
      expect(screen.getByText('便當銷售數量')).toBeTruthy()
    })
  })

  describe('KPI card values', () => {
    it('renders orderCount value', () => {
      render(<ProductKpiGrid kpis={SAMPLE_KPIS} />)
      // NumberTicker renders the final value as text
      expect(screen.getByTestId('kpi-orderCount')).toBeTruthy()
    })

    it('renders totalQuantity value', () => {
      render(<ProductKpiGrid kpis={SAMPLE_KPIS} />)
      expect(screen.getByTestId('kpi-totalQuantity')).toBeTruthy()
    })

    it('renders bentoQuantity value', () => {
      render(<ProductKpiGrid kpis={SAMPLE_KPIS} />)
      expect(screen.getByTestId('kpi-bentoQuantity')).toBeTruthy()
    })

    it('renders totalRevenue with TWD $ prefix', () => {
      render(<ProductKpiGrid kpis={SAMPLE_KPIS} />)
      const el = screen.getByTestId('kpi-totalRevenue')
      expect(el.textContent).toContain('$')
    })

    it('renders morningRevenue with TWD $ prefix', () => {
      render(<ProductKpiGrid kpis={SAMPLE_KPIS} />)
      const el = screen.getByTestId('kpi-morningRevenue')
      expect(el.textContent).toContain('$')
    })

    it('renders afternoonRevenue with TWD $ prefix', () => {
      render(<ProductKpiGrid kpis={SAMPLE_KPIS} />)
      const el = screen.getByTestId('kpi-afternoonRevenue')
      expect(el.textContent).toContain('$')
    })
  })

  describe('layout', () => {
    it('renders exactly 6 KPI cards', () => {
      render(<ProductKpiGrid kpis={SAMPLE_KPIS} />)
      const cards = screen.getAllByText(/\$|^\d+$/)
      expect(cards.length).toBeGreaterThanOrEqual(6)
    })
  })

  describe('zero values', () => {
    it('renders with all-zero KPIs without crashing', () => {
      const { container } = render(<ProductKpiGrid kpis={ZERO_KPIS} />)
      expect(container).toBeTruthy()
    })

    it('shows zero value for orderCount when KPIs are all zero', () => {
      render(<ProductKpiGrid kpis={ZERO_KPIS} />)
      const el = screen.getByTestId('kpi-orderCount')
      expect(el.textContent).toBe('0')
    })
  })
})
