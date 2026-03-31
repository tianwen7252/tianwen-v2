import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import dayjs from 'dayjs'
import type { Order } from '@/lib/schemas'
import { OrdersShiftSummary } from './orders-shift-summary'

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'orders.morningShift': '早班',
        'orders.afternoonShift': '晚班',
        'orders.grandTotal': '合計',
      }
      if (key === 'orders.orderCount') return `${opts?.count} 筆`
      return map[key] ?? key
    },
  }),
}))

// ─── Factories ───────────────────────────────────────────────────────────────

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'test-1',
    number: 1,
    memo: [],
    soups: 0,
    total: 100,
    editor: '',
    items: [],
    discounts: [],
    createdAt: dayjs('2026-03-24T10:00:00').valueOf(),
    updatedAt: dayjs('2026-03-24T10:00:00').valueOf(),
    ...overrides,
  }
}

/** Create orders with specific times and totals */
function makeMorningOrder(total: number, time: string): Order {
  return makeOrder({
    id: `morning-${time}`,
    total,
    createdAt: dayjs(`2026-03-24T${time}`).valueOf(),
    updatedAt: dayjs(`2026-03-24T${time}`).valueOf(),
  })
}

function makeAfternoonOrder(total: number, time: string): Order {
  return makeOrder({
    id: `afternoon-${time}`,
    total,
    createdAt: dayjs(`2026-03-24T${time}`).valueOf(),
    updatedAt: dayjs(`2026-03-24T${time}`).valueOf(),
  })
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('OrdersShiftSummary', () => {
  it('should have data-testid="shift-summary"', () => {
    render(<OrdersShiftSummary orders={[]} />)
    expect(screen.getByTestId('shift-summary')).toBeTruthy()
  })

  it('should handle empty orders array', () => {
    render(<OrdersShiftSummary orders={[]} />)
    // Should show 0 counts and $0 totals
    const summary = screen.getByTestId('shift-summary')
    expect(summary.textContent).toContain('0')
  })

  it('should calculate morning orders correctly (before 13:30)', () => {
    const orders: readonly Order[] = [
      makeMorningOrder(200, '08:00'),
      makeMorningOrder(150, '10:30'),
      makeMorningOrder(100, '13:00'),
    ]

    render(<OrdersShiftSummary orders={orders} />)
    const summary = screen.getByTestId('shift-summary')
    // Morning: 3 orders, $450 total
    expect(summary.textContent).toContain('3')
    expect(summary.textContent).toContain('$450')
  })

  it('should calculate afternoon orders correctly (13:30+)', () => {
    const orders: readonly Order[] = [
      makeAfternoonOrder(300, '13:30'),
      makeAfternoonOrder(250, '15:00'),
    ]

    render(<OrdersShiftSummary orders={orders} />)
    const summary = screen.getByTestId('shift-summary')
    // Afternoon: 2 orders, $550 total
    expect(summary.textContent).toContain('2')
    expect(summary.textContent).toContain('$550')
  })

  it('should show correct order counts for both shifts', () => {
    const orders: readonly Order[] = [
      makeMorningOrder(100, '09:00'),
      makeMorningOrder(200, '11:00'),
      makeAfternoonOrder(300, '14:00'),
      makeAfternoonOrder(400, '16:00'),
      makeAfternoonOrder(500, '18:00'),
    ]

    render(<OrdersShiftSummary orders={orders} />)
    const summary = screen.getByTestId('shift-summary')
    // Morning: 2 orders, Afternoon: 3 orders, Total: 5
    expect(summary.textContent).toContain('5')
  })

  it('should show correct revenue totals for both shifts', () => {
    const orders: readonly Order[] = [
      makeMorningOrder(100, '09:00'),
      makeMorningOrder(200, '11:00'),
      makeAfternoonOrder(300, '14:00'),
    ]

    render(<OrdersShiftSummary orders={orders} />)
    const summary = screen.getByTestId('shift-summary')
    // Total revenue: $600
    expect(summary.textContent).toContain('$600')
  })

  it('should show grand total combining both shifts', () => {
    const orders: readonly Order[] = [
      makeMorningOrder(1000, '08:00'),
      makeAfternoonOrder(2000, '14:00'),
    ]

    render(<OrdersShiftSummary orders={orders} />)
    const summary = screen.getByTestId('shift-summary')
    // Grand total: 2 orders, $3,000
    expect(summary.textContent).toContain('2')
    expect(summary.textContent).toContain('$3,000')
  })

  it('should display shift labels', () => {
    render(<OrdersShiftSummary orders={[]} />)
    const summary = screen.getByTestId('shift-summary')
    expect(summary.textContent).toContain('早班')
    expect(summary.textContent).toContain('晚班')
    expect(summary.textContent).toContain('合計')
  })

  it('should treat 13:29 as morning and 13:30 as afternoon (boundary)', () => {
    const orders: readonly Order[] = [
      makeMorningOrder(100, '13:29'),
      makeAfternoonOrder(200, '13:30'),
    ]

    render(<OrdersShiftSummary orders={orders} />)
    const morning = screen.getByTestId('morning-card')
    const afternoon = screen.getByTestId('afternoon-card')
    // Morning card: 1 order, $100
    expect(morning.textContent).toContain('1')
    expect(morning.textContent).toContain('$100')
    // Afternoon card: 1 order, $200
    expect(afternoon.textContent).toContain('1')
    expect(afternoon.textContent).toContain('$200')
  })
})
