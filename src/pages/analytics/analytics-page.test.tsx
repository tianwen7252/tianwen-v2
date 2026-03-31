/**
 * Tests for AnalyticsPage component.
 * Verifies page renders, default tab state, and tab switching behaviour.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnalyticsPage } from './analytics-page'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AnalyticsPage', () => {
  it('renders without crashing', () => {
    const { container } = render(<AnalyticsPage />)
    expect(container).toBeTruthy()
  })

  it('shows 商品統計 tab as active by default', () => {
    render(<AnalyticsPage />)
    const productTab = screen.getByRole('tab', { name: '商品統計' })
    expect(productTab.getAttribute('aria-selected')).toBe('true')
  })

  it('shows the product stats section by default (aria-label="商品統計")', () => {
    render(<AnalyticsPage />)
    expect(screen.getByRole('region', { name: '商品統計' })).toBeTruthy()
  })

  it('does not show the staff stats section by default', () => {
    render(<AnalyticsPage />)
    expect(screen.queryByRole('region', { name: '員工統計' })).toBeNull()
  })

  it('shows 員工統計 section after clicking the 員工統計 tab', async () => {
    const user = userEvent.setup()
    render(<AnalyticsPage />)

    await user.click(screen.getByRole('tab', { name: '員工統計' }))

    expect(screen.getByRole('region', { name: '員工統計' })).toBeTruthy()
  })

  it('hides 商品統計 section after switching to 員工統計 tab', async () => {
    const user = userEvent.setup()
    render(<AnalyticsPage />)

    await user.click(screen.getByRole('tab', { name: '員工統計' }))

    expect(screen.queryByRole('region', { name: '商品統計' })).toBeNull()
  })

  it('marks 員工統計 tab as active after clicking it', async () => {
    const user = userEvent.setup()
    render(<AnalyticsPage />)

    await user.click(screen.getByRole('tab', { name: '員工統計' }))

    const staffTab = screen.getByRole('tab', { name: '員工統計' })
    expect(staffTab.getAttribute('aria-selected')).toBe('true')
  })

  it('renders the date picker with preset buttons', () => {
    render(<AnalyticsPage />)
    expect(screen.getByRole('button', { name: '今日' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '本月' })).toBeTruthy()
  })
})
