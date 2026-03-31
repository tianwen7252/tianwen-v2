import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChangePrediction } from './change-prediction'

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('ChangePrediction', () => {
  // ─── Rendering pill badges ────────────────────────────────────────────────

  it('should render pill badges for total=140 with correct text', () => {
    const { container } = render(<ChangePrediction total={140} />)
    // Expected: [1000, 1000, 860], [500, 500, 360], [100, 200, 60]
    expect(screen.getByText('$1000 找 $860')).toBeTruthy()
    expect(screen.getByText('$500 找 $360')).toBeTruthy()
    expect(screen.getByText('$200 找 $60')).toBeTruthy()
    // Should have exactly 3 badges
    const badges = container.querySelectorAll('[data-testid="change-badge"]')
    expect(badges).toHaveLength(3)
  })

  it('should render pill badges for total=860 with correct text', () => {
    const { container } = render(<ChangePrediction total={860} />)
    // Expected: [1000, 1000, 140] only
    expect(screen.getByText('$1000 找 $140')).toBeTruthy()
    const badges = container.querySelectorAll('[data-testid="change-badge"]')
    expect(badges).toHaveLength(1)
  })

  // ─── Color per denomination ──────────────────────────────────────────────

  it('should apply blue color for $1000 denomination badge', () => {
    render(<ChangePrediction total={140} />)
    const badge = screen.getByText('$1000 找 $860')
    expect(badge.className).toContain('text-[#3f6ab0]')
  })

  it('should apply brown color for $500 denomination badge', () => {
    render(<ChangePrediction total={140} />)
    const badge = screen.getByText('$500 找 $360')
    expect(badge.className).toContain('text-[#ae917d]')
  })

  it('should apply pink color for $100 denomination badge', () => {
    render(<ChangePrediction total={140} />)
    const badge = screen.getByText('$200 找 $60')
    expect(badge.className).toContain('text-[#f38590]')
  })

  // ─── Renders nothing for null/empty cases ────────────────────────────────

  it('should render nothing when total=0', () => {
    const { container } = render(<ChangePrediction total={0} />)
    expect(container.innerHTML).toBe('')
  })

  it('should render nothing when total is single digit (total=5)', () => {
    const { container } = render(<ChangePrediction total={5} />)
    expect(container.innerHTML).toBe('')
  })

  it('should render nothing when total is 5+ digits (total=10000)', () => {
    const { container } = render(<ChangePrediction total={10000} />)
    expect(container.innerHTML).toBe('')
  })

  // ─── Layout ──────────────────────────────────────────────────────────────

  it('should wrap badges in a flex container with gap', () => {
    const { container } = render(<ChangePrediction total={140} />)
    const badgeContainer = container.querySelector('.flex.flex-wrap')
    expect(badgeContainer).toBeTruthy()
    expect(badgeContainer!.className).toContain('gap')
  })

  // ─── Badge uses i18n "找" text ────────────────────────────────────────────

  it('should use the translated "找" text in badge labels', () => {
    render(<ChangePrediction total={50} />)
    // total=50: [1000,1000,950], [500,500,450], [100,100,50]
    // Using zh-TW default: "找" is the character
    expect(screen.getByText('$1000 找 $950')).toBeTruthy()
    expect(screen.getByText('$500 找 $450')).toBeTruthy()
    expect(screen.getByText('$100 找 $50')).toBeTruthy()
  })

  // ─── Edge: total=1000 renders nothing (exact bill match) ──────────────────

  it('should render nothing when total=1000 (exact bill match, empty result)', () => {
    const { container } = render(<ChangePrediction total={1000} />)
    // getChange(1000) returns [], so nothing is rendered
    expect(container.innerHTML).toBe('')
  })
})
