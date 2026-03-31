/**
 * Tests for AnalyticsTabBar component.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnalyticsTabBar } from './analytics-tab-bar'

describe('AnalyticsTabBar', () => {
  it('renders both tabs', () => {
    render(<AnalyticsTabBar activeTab="product" onTabChange={vi.fn()} />)
    expect(screen.getByRole('tab', { name: '商品統計' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: '員工統計' })).toBeTruthy()
  })

  it('marks product tab as selected when activeTab is "product"', () => {
    render(<AnalyticsTabBar activeTab="product" onTabChange={vi.fn()} />)
    const productTab = screen.getByRole('tab', { name: '商品統計' })
    expect(productTab.getAttribute('aria-selected')).toBe('true')
  })

  it('calls onTabChange with "staff" when 員工統計 tab is clicked', async () => {
    const onTabChange = vi.fn()
    const user = userEvent.setup()
    render(<AnalyticsTabBar activeTab="product" onTabChange={onTabChange} />)
    await user.click(screen.getByRole('tab', { name: '員工統計' }))
    expect(onTabChange).toHaveBeenCalledWith('staff')
    expect(onTabChange).toHaveBeenCalledTimes(1)
  })

  it('calls onTabChange with "product" when 商品統計 tab is clicked', async () => {
    const onTabChange = vi.fn()
    const user = userEvent.setup()
    render(<AnalyticsTabBar activeTab="staff" onTabChange={onTabChange} />)
    await user.click(screen.getByRole('tab', { name: '商品統計' }))
    expect(onTabChange).toHaveBeenCalledWith('product')
    expect(onTabChange).toHaveBeenCalledTimes(1)
  })

  it('marks staff tab as selected when activeTab is "staff"', () => {
    render(<AnalyticsTabBar activeTab="staff" onTabChange={vi.fn()} />)
    const staffTab = screen.getByRole('tab', { name: '員工統計' })
    expect(staffTab.getAttribute('aria-selected')).toBe('true')
  })

  it('does not mark product tab as selected when activeTab is "staff"', () => {
    render(<AnalyticsTabBar activeTab="staff" onTabChange={vi.fn()} />)
    const productTab = screen.getByRole('tab', { name: '商品統計' })
    expect(productTab.getAttribute('aria-selected')).toBe('false')
  })

  it('renders tablist container with correct role', () => {
    render(<AnalyticsTabBar activeTab="product" onTabChange={vi.fn()} />)
    expect(screen.getByRole('tablist')).toBeTruthy()
  })
})
