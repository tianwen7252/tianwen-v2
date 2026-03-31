/**
 * Tests for confetti utility functions.
 * Verifies fireSideCannons and fireStars call canvas-confetti with correct params.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock canvas-confetti before importing the module under test
const mockConfetti = vi.fn().mockResolvedValue(undefined)
vi.mock('canvas-confetti', () => ({ default: mockConfetti }))

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('fireSideCannons', () => {
  beforeEach(() => {
    // Reset mock call history and fake timers before each test
    mockConfetti.mockClear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not throw when called', async () => {
    const { fireSideCannons } = await import('./confetti')
    expect(() => fireSideCannons()).not.toThrow()
    // Cancel the animation loop so fake timers do not leak
    vi.runAllTimers()
  })

  it('fires confetti from the left cannon with correct params', async () => {
    const { fireSideCannons } = await import('./confetti')
    fireSideCannons()

    // Advance one animation frame to trigger the first burst
    vi.runAllTimers()

    const calls = mockConfetti.mock.calls
    const leftCall = calls.find(
      ([opts]) =>
        opts !== undefined && (opts as Record<string, unknown>).angle === 60,
    )
    expect(leftCall).toBeDefined()

    const leftOpts = leftCall![0] as Record<string, unknown>
    expect(leftOpts.angle).toBe(60)
    expect(leftOpts.spread).toBe(55)
    expect(leftOpts.startVelocity).toBe(60)
    expect((leftOpts.origin as Record<string, number>).x).toBe(0)
    expect((leftOpts.origin as Record<string, number>).y).toBe(0.5)
    expect(leftOpts.colors).toEqual([
      '#a786ff',
      '#fd8bbc',
      '#eca184',
      '#f8deb1',
    ])
  })

  it('fires confetti from the right cannon with correct params', async () => {
    const { fireSideCannons } = await import('./confetti')
    fireSideCannons()

    vi.runAllTimers()

    const calls = mockConfetti.mock.calls
    const rightCall = calls.find(
      ([opts]) =>
        opts !== undefined && (opts as Record<string, unknown>).angle === 120,
    )
    expect(rightCall).toBeDefined()

    const rightOpts = rightCall![0] as Record<string, unknown>
    expect(rightOpts.angle).toBe(120)
    expect(rightOpts.spread).toBe(55)
    expect(rightOpts.startVelocity).toBe(60)
    expect((rightOpts.origin as Record<string, number>).x).toBe(1)
    expect((rightOpts.origin as Record<string, number>).y).toBe(0.5)
    expect(rightOpts.colors).toEqual([
      '#a786ff',
      '#fd8bbc',
      '#eca184',
      '#f8deb1',
    ])
  })

  it('fires both cannons simultaneously (left + right per frame)', async () => {
    const { fireSideCannons } = await import('./confetti')
    fireSideCannons()

    vi.runAllTimers()

    const leftCalls = mockConfetti.mock.calls.filter(
      ([opts]) =>
        opts !== undefined && (opts as Record<string, unknown>).angle === 60,
    )
    const rightCalls = mockConfetti.mock.calls.filter(
      ([opts]) =>
        opts !== undefined && (opts as Record<string, unknown>).angle === 120,
    )

    expect(leftCalls.length).toBeGreaterThan(0)
    expect(rightCalls.length).toBeGreaterThan(0)
    // Both cannons fire the same number of times
    expect(leftCalls.length).toBe(rightCalls.length)
  })

  it('fires 2 particles per frame per cannon', async () => {
    const { fireSideCannons } = await import('./confetti')
    fireSideCannons()

    vi.runAllTimers()

    const leftCalls = mockConfetti.mock.calls.filter(
      ([opts]) =>
        opts !== undefined && (opts as Record<string, unknown>).angle === 60,
    )

    for (const [opts] of leftCalls) {
      expect((opts as Record<string, unknown>).particleCount).toBe(2)
    }
  })
})

describe('fireStars', () => {
  beforeEach(() => {
    mockConfetti.mockClear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not throw when called', async () => {
    const { fireStars } = await import('./confetti')
    expect(() => fireStars()).not.toThrow()
    vi.runAllTimers()
  })

  it('fires star-shaped confetti with correct params', async () => {
    const { fireStars } = await import('./confetti')
    fireStars()

    // Advance through all three burst timeouts (0ms, 100ms, 200ms)
    vi.runAllTimers()

    const starCalls = mockConfetti.mock.calls.filter(([opts]) => {
      const o = opts as Record<string, unknown>
      const shapes = o.shapes as string[] | undefined
      return Array.isArray(shapes) && shapes.includes('star')
    })

    expect(starCalls.length).toBeGreaterThan(0)

    const starOpts = starCalls[0]![0] as Record<string, unknown>
    expect(starOpts.spread).toBe(360)
    expect(starOpts.ticks).toBe(50)
    expect(starOpts.gravity).toBe(0)
    expect(starOpts.decay).toBe(0.94)
    expect(starOpts.startVelocity).toBe(30)
    expect(starOpts.colors).toEqual([
      '#FFE400',
      '#FFBD00',
      '#E89400',
      '#FFCA6C',
      '#FDFFB8',
    ])
    expect(starOpts.particleCount).toBe(40)
    expect(starOpts.scalar).toBe(1.2)
  })

  it('fires circle-shaped confetti alongside stars', async () => {
    const { fireStars } = await import('./confetti')
    fireStars()

    vi.runAllTimers()

    const circleCalls = mockConfetti.mock.calls.filter(([opts]) => {
      const o = opts as Record<string, unknown>
      const shapes = o.shapes as string[] | undefined
      return Array.isArray(shapes) && shapes.includes('circle')
    })

    expect(circleCalls.length).toBeGreaterThan(0)

    const circleOpts = circleCalls[0]![0] as Record<string, unknown>
    expect(circleOpts.particleCount).toBe(10)
    expect(circleOpts.scalar).toBe(0.75)
  })

  it('fires exactly 3 star bursts and 3 circle bursts across timeouts', async () => {
    const { fireStars } = await import('./confetti')
    fireStars()

    vi.runAllTimers()

    const starBursts = mockConfetti.mock.calls.filter(([opts]) => {
      const shapes = (opts as Record<string, unknown>).shapes as
        | string[]
        | undefined
      return Array.isArray(shapes) && shapes.includes('star')
    })

    const circleBursts = mockConfetti.mock.calls.filter(([opts]) => {
      const shapes = (opts as Record<string, unknown>).shapes as
        | string[]
        | undefined
      return Array.isArray(shapes) && shapes.includes('circle')
    })

    expect(starBursts.length).toBe(3)
    expect(circleBursts.length).toBe(3)
  })

  it('uses gold color palette for all bursts', async () => {
    const { fireStars } = await import('./confetti')
    fireStars()

    vi.runAllTimers()

    const goldColors = ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FDFFB8']

    for (const [opts] of mockConfetti.mock.calls) {
      expect((opts as Record<string, unknown>).colors).toEqual(goldColors)
    }
  })
})
