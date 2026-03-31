/**
 * Tests for AnimatedList component.
 * Verifies stagger animation setup and correct children rendering.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnimatedList } from './animated-list'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AnimatedList', () => {
  describe('children rendering', () => {
    it('renders all children', () => {
      render(
        <AnimatedList>
          {['Alpha', 'Beta', 'Gamma'].map(t => (
            <span key={t}>{t}</span>
          ))}
        </AnimatedList>,
      )
      expect(screen.getByText('Alpha')).toBeTruthy()
      expect(screen.getByText('Beta')).toBeTruthy()
      expect(screen.getByText('Gamma')).toBeTruthy()
    })

    it('renders a single child without crashing', () => {
      render(<AnimatedList>{[<span key="only">Only</span>]}</AnimatedList>)
      expect(screen.getByText('Only')).toBeTruthy()
    })

    it('renders an empty children array without crashing', () => {
      const { container } = render(<AnimatedList>{[]}</AnimatedList>)
      expect(container).toBeTruthy()
    })
  })

  describe('stagger animation delay', () => {
    it('applies animationDelay inline style to each item', () => {
      render(
        <AnimatedList delay={150}>
          {['A', 'B', 'C'].map(t => (
            <span key={t}>{t}</span>
          ))}
        </AnimatedList>,
      )

      // Each child is wrapped in a div with animationDelay
      const items = document.querySelectorAll('[style*="animation-delay"]')
      expect(items.length).toBe(3)
    })

    it('sets increasing animationDelay based on delay prop', () => {
      render(
        <AnimatedList delay={200}>
          {['X', 'Y'].map(t => (
            <span key={t}>{t}</span>
          ))}
        </AnimatedList>,
      )

      const items = document.querySelectorAll('[style*="animation-delay"]')
      const first = items[0] as HTMLElement
      const second = items[1] as HTMLElement

      // First item: 0 * 200 = 0ms, second: 1 * 200 = 200ms
      expect(first.style.animationDelay).toBe('0ms')
      expect(second.style.animationDelay).toBe('200ms')
    })

    it('uses default delay of 100ms when delay prop is omitted', () => {
      render(
        <AnimatedList>
          {['P', 'Q'].map(t => (
            <span key={t}>{t}</span>
          ))}
        </AnimatedList>,
      )

      const items = document.querySelectorAll('[style*="animation-delay"]')
      const second = items[1] as HTMLElement

      // Second item: 1 * 100 = 100ms
      expect(second.style.animationDelay).toBe('100ms')
    })
  })

  describe('className prop', () => {
    it('applies custom className to the wrapper', () => {
      const { container } = render(
        <AnimatedList className="my-custom-class">
          {[<span key="c">C</span>]}
        </AnimatedList>,
      )
      expect(container.firstElementChild?.className).toContain(
        'my-custom-class',
      )
    })
  })
})
