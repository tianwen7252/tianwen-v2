/**
 * Tests for ProfitStubChart component.
 * Verifies the placeholder card renders title, description, icon, and coming-soon text.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock lucide-react to render a simple element for the Construction icon
vi.mock('lucide-react', () => ({
  Construction: (props: Record<string, unknown>) => (
    <svg data-testid="construction-icon" {...props} />
  ),
}))

import { ProfitStubChart } from './profit-stub-chart'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProfitStubChart', () => {
  it('renders the card title', () => {
    render(<ProfitStubChart />)
    expect(screen.getByText('淨利分析')).toBeTruthy()
  })

  it('renders the card description in the header', () => {
    render(<ProfitStubChart />)
    // Description appears both in header and body; check at least one
    const elements = screen.getAllByText('此功能開發中，敬請期待')
    expect(elements.length).toBeGreaterThanOrEqual(1)
  })

  it('renders the Construction icon', () => {
    render(<ProfitStubChart />)
    expect(screen.getByTestId('construction-icon')).toBeTruthy()
  })

  it('renders coming-soon text in the card body', () => {
    render(<ProfitStubChart />)
    // The body also shows the description text
    const elements = screen.getAllByText('此功能開發中，敬請期待')
    // Both header description and body text use the same i18n key
    expect(elements.length).toBe(2)
  })
})
