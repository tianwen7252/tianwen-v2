import { useRef, useEffect } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface InitCanvasProps {
  readonly className?: string
}

interface CharData {
  char: string
  cycleTimer: number
  cycleRate: number
}

interface Column {
  x: number
  y: number
  speed: number
  length: number
  chars: CharData[]
  active: boolean
  restartDelay: number
  opacity: number
  hitWater: boolean
}

interface Ripple {
  x: number
  y: number
  radius: number
  maxRadius: number
  speed: number
  life: number
  decay: number
}

interface WavePoint {
  y: number
  vy: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FALL_SPEED = 1.0
const COLUMN_DENSITY = 0.7
const FONT_SIZE_BASE = 16
// Water effects disabled — columns fall through the full viewport
const WATER_SURFACE_RATIO = 1.0
const MAX_RIPPLES = 0
const WAVE_RESOLUTION = 4

const CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789' +
  '\u00D7\u00F7\u2206\u03A3\u03A0\u221A\u221E\u2248\u2260\u2264\u2265\u222B\u2202\u03B1\u03B2\u03B3\u03B8\u03C6\u03C8\u03C9\u03A9\u2593'

const FONT_FAMILY = '"SF Mono", "Fira Code", "Cascadia Code", monospace'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)]!
}

function createColumn(
  index: number,
  fontSize: number,
  waterSurface: number,
  scatter: boolean,
): Column {
  const trailLen = 12 + Math.floor(Math.random() * 20)
  const maxChars = trailLen + 5
  const chars: CharData[] = []
  for (let j = 0; j < maxChars; j++) {
    chars.push({
      char: randomChar(),
      cycleTimer: Math.random() * 3,
      cycleRate: 0.5 + Math.random() * 2,
    })
  }

  let startY: number
  if (scatter) {
    if (Math.random() < COLUMN_DENSITY) {
      startY =
        Math.random() * (waterSurface + trailLen * fontSize) -
        trailLen * fontSize * 0.3
    } else {
      startY = -trailLen * fontSize - Math.random() * waterSurface * 0.5
    }
  } else {
    startY = -trailLen * fontSize * Math.random() * 0.3
  }

  return {
    x: index * fontSize,
    y: startY,
    speed: 1.2 + Math.random() * 2.5,
    length: trailLen,
    chars,
    active: scatter
      ? Math.random() < COLUMN_DENSITY + 0.2
      : Math.random() < COLUMN_DENSITY,
    restartDelay: 0,
    opacity: 0.6 + Math.random() * 0.4,
    hitWater: false,
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function InitCanvas({ className }: InitCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    const fontSize = Math.max(14, Math.round(FONT_SIZE_BASE))
    let width = 0
    let height = 0
    let waterSurface = 0
    let columns: Column[] = []
    let ripples: Ripple[] = []
    let wavePoints: WavePoint[] = []
    let rafId = 0
    let lastTime = 0

    // ── Resize ────────────────────────────────────────────────────────
    function resize() {
      const parent = canvas!.parentElement
      if (!parent) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = parent.clientWidth
      height = parent.clientHeight
      canvas!.width = Math.round(width * dpr)
      canvas!.height = Math.round(height * dpr)
      canvas!.style.width = width + 'px'
      canvas!.style.height = height + 'px'
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      initColumns()
    }

    function initColumns() {
      waterSurface = height * WATER_SURFACE_RATIO
      const colCount = Math.floor(width / fontSize)
      const newColumns: Column[] = []
      for (let i = 0; i < colCount; i++) {
        const existing = columns[i]
        if (existing) {
          newColumns.push({ ...existing, x: i * fontSize })
        } else {
          newColumns.push(createColumn(i, fontSize, waterSurface, true))
        }
      }
      columns = newColumns

      const waveCount = Math.ceil(width / WAVE_RESOLUTION) + 1
      const newWave: WavePoint[] = []
      for (let w = 0; w < waveCount; w++) {
        newWave.push({ y: 0, vy: 0 })
      }
      wavePoints = newWave
    }

    // ── Ripple system ─────────────────────────────────────────────────
    function spawnRipple(x: number, y: number) {
      if (ripples.length >= MAX_RIPPLES) ripples.shift()
      ripples.push({
        x,
        y,
        radius: 0,
        maxRadius: 30 + Math.random() * 50,
        speed: 20 + Math.random() * 30,
        life: 1.0,
        decay: 0.3 + Math.random() * 0.2,
      })
    }

    function disturbWave(x: number, force: number) {
      const idx = Math.floor(x / WAVE_RESOLUTION)
      const spread = 3
      for (let i = -spread; i <= spread; i++) {
        const wi = idx + i
        if (wi >= 0 && wi < wavePoints.length) {
          const influence = 1 - Math.abs(i) / (spread + 1)
          const wp = wavePoints[wi]!
          wavePoints[wi] = { ...wp, vy: wp.vy + force * influence }
        }
      }
    }

    // ── Update systems ────────────────────────────────────────────────
    function updateColumns(dt: number) {
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i]!

        if (!col.active) {
          const newDelay = col.restartDelay - dt
          if (newDelay <= 0) {
            if (Math.random() < COLUMN_DENSITY) {
              columns[i] = {
                ...col,
                active: true,
                y: -col.length * fontSize * Math.random() * 0.3,
                speed: 1.2 + Math.random() * 2.5,
                length: 12 + Math.floor(Math.random() * 20),
                opacity: 0.6 + Math.random() * 0.4,
                hitWater: false,
                restartDelay: 0,
                chars: col.chars.map((c) => ({ ...c, char: randomChar() })),
              }
            } else {
              columns[i] = { ...col, restartDelay: 0.3 + Math.random() * 1.5 }
            }
          } else {
            columns[i] = { ...col, restartDelay: newDelay }
          }
          continue
        }

        const prevY = col.y
        const newY = col.y + col.speed * FALL_SPEED * dt * 60

        // Cycle characters randomly
        const newChars = col.chars.map((c) => {
          const newTimer = c.cycleTimer - dt
          if (newTimer <= 0) {
            return { ...c, char: randomChar(), cycleTimer: c.cycleRate }
          }
          return { ...c, cycleTimer: newTimer }
        })

        let newHitWater = col.hitWater
        if (!col.hitWater && newY >= waterSurface && prevY < waterSurface) {
          newHitWater = true
          spawnRipple(col.x + fontSize * 0.5, waterSurface)
          disturbWave(col.x + fontSize * 0.5, -2 - Math.random() * 3)
        }

        const tailY = newY - col.length * fontSize
        if (tailY > waterSurface + 30) {
          columns[i] = {
            ...col,
            active: false,
            restartDelay: 0.2 + Math.random() * 2,
            y: newY,
            chars: newChars,
            hitWater: newHitWater,
          }
        } else {
          columns[i] = {
            ...col,
            y: newY,
            chars: newChars,
            hitWater: newHitWater,
          }
        }
      }
    }

    // updateRipples / updateWaves removed (water effects disabled)

    // ── Draw systems ──────────────────────────────────────────────────
    function drawColumns() {
      ctx!.font = fontSize + 'px ' + FONT_FAMILY
      ctx!.textAlign = 'center'
      ctx!.textBaseline = 'top'

      for (const col of columns) {
        if (!col.active) continue
        for (let j = 0; j < col.length; j++) {
          const charY = col.y - j * fontSize
          if (charY > waterSurface || charY < -fontSize) continue

          const charIndex = j % col.chars.length
          const trailFraction = j / col.length

          let brightness: number
          if (j === 0) brightness = 1.0
          else if (j === 1) brightness = 0.9
          else if (j < 4) brightness = 0.75 - (j - 2) * 0.08
          else brightness = Math.max(0, 0.6 * (1 - trailFraction))

          const distToWater = waterSurface - charY
          if (distToWater < fontSize * 3) {
            brightness *= Math.max(0, distToWater / (fontSize * 3))
          }
          brightness *= col.opacity
          if (brightness < 0.02) continue

          let r: number, g: number, b: number
          if (j === 0) {
            r = 255
            g = 245
            b = 220
          } else if (j < 3) {
            r = 240
            g = 200
            b = 140
          } else {
            r = 200
            g = 149
            b = 108
          }

          ctx!.fillStyle = `rgba(${r},${g},${b},${brightness})`

          if (j === 0) {
            ctx!.shadowColor = 'rgba(255, 220, 160, 0.6)'
            ctx!.shadowBlur = 8
          }

          ctx!.fillText(
            col.chars[charIndex]!.char,
            col.x + fontSize * 0.5,
            charY,
          )

          if (j === 0) {
            ctx!.shadowColor = 'transparent'
            ctx!.shadowBlur = 0
          }
        }
      }
    }

    // Water draw functions removed (drawReflections, drawRipples,
    // drawWaterSurface, drawZenRipples, drawWaterParticles)

    function drawVignette() {
      const cx = width / 2
      const cy = height / 2
      const maxDim = Math.max(width, height)
      const vignette = ctx!.createRadialGradient(
        cx,
        cy,
        maxDim * 0.25,
        cx,
        cy,
        maxDim * 0.8,
      )
      vignette.addColorStop(0, 'rgba(10, 10, 10, 0)')
      vignette.addColorStop(1, 'rgba(10, 10, 10, 0.45)')
      ctx!.fillStyle = vignette
      ctx!.fillRect(0, 0, width, height)
    }

    // drawWaterParticles — disabled (water effects removed)

    // ── Click / touch interaction ─────────────────────────────────────
    function handleInteraction(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top
      disturbWave(x, -4 - Math.random() * 3)
      spawnRipple(x, waterSurface)

      const colIdx = Math.floor(x / fontSize)
      for (let di = -1; di <= 1; di++) {
        const ci = colIdx + di
        const col = ci >= 0 && ci < columns.length ? columns[ci] : undefined
        if (col) {
          columns[ci] = {
            ...col,
            active: true,
            y,
            speed: 2.5 + Math.random() * 2,
            opacity: 0.8 + Math.random() * 0.2,
            hitWater: false,
          }
        }
      }
    }

    function onClick(e: MouseEvent) {
      handleInteraction(e.clientX, e.clientY)
    }

    function onTouchStart(e: TouchEvent) {
      e.preventDefault()
      const t = e.touches[0]
      if (!t) return
      handleInteraction(t.clientX, t.clientY)
    }

    // ── Animation loop ────────────────────────────────────────────────
    function render(timestamp: number) {
      if (!lastTime) lastTime = timestamp
      const dt = prefersReduced
        ? 0
        : Math.min((timestamp - lastTime) / 1000, 0.05)
      lastTime = timestamp

      ctx!.clearRect(0, 0, width, height)
      ctx!.fillStyle = '#0a0a0a'
      ctx!.fillRect(0, 0, width, height)

      updateColumns(dt)

      drawColumns()
      drawVignette()

      rafId = requestAnimationFrame(render)
    }

    // ── Init ──────────────────────────────────────────────────────────
    resize()
    rafId = requestAnimationFrame(render)

    window.addEventListener('resize', resize)
    canvas.addEventListener('click', onClick)
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('click', onClick)
      canvas.removeEventListener('touchstart', onTouchStart)
    }
  }, [])

  return (
    <div
      className={className}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  )
}
