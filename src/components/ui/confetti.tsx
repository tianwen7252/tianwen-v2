/**
 * Imperative confetti utility functions built on top of canvas-confetti.
 * Safe to call in test environments where canvas is unavailable.
 */

import confetti from 'canvas-confetti'

// ─── Constants ───────────────────────────────────────────────────────────────

const CANNON_COLORS = ['#a786ff', '#fd8bbc', '#eca184', '#f8deb1']
const STAR_COLORS = ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FDFFB8']

const CANNON_DURATION_MS = 3000

// ─── fireSideCannons ─────────────────────────────────────────────────────────

/**
 * Fires confetti from both the left and right sides of the screen
 * simultaneously for 3 seconds using a requestAnimationFrame loop.
 */
export function fireSideCannons(): void {
  const end = Date.now() + CANNON_DURATION_MS

  function frame(): void {
    if (Date.now() > end) return

    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      startVelocity: 60,
      origin: { x: 0, y: 0.5 },
      colors: CANNON_COLORS,
    })

    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      startVelocity: 60,
      origin: { x: 1, y: 0.5 },
      colors: CANNON_COLORS,
    })

    requestAnimationFrame(frame)
  }

  requestAnimationFrame(frame)
}

// ─── fireStars ───────────────────────────────────────────────────────────────

/** Shared base options for every star burst. */
const STAR_BASE = {
  spread: 360,
  ticks: 50,
  gravity: 0,
  decay: 0.94,
  startVelocity: 30,
  colors: STAR_COLORS,
} as const

/**
 * Fires three timed bursts of star-shaped confetti with a gold colour palette.
 * Bursts occur at 0 ms, 100 ms, and 200 ms.
 */
export function fireStars(): void {
  const burst = (): void => {
    confetti({ ...STAR_BASE, particleCount: 40, scalar: 1.2, shapes: ['star'] })
    confetti({
      ...STAR_BASE,
      particleCount: 10,
      scalar: 0.75,
      shapes: ['circle'],
    })
  }

  burst()
  setTimeout(burst, 100)
  setTimeout(burst, 200)
}
