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
const WATER_SURFACE_RATIO = 0.78
const MAX_RIPPLES = 40
const WAVE_RESOLUTION = 4

const CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789' +
  '\u00D7\u00F7\u2206\u03A3\u03A0\u221A\u221E\u2248\u2260\u2264\u2265\u222B\u2202\u03B1\u03B2\u03B3\u03B8\u03C6\u03C8\u03C9\u2588\u2593\u25CF\u25CB'

const FONT_FAMILY = '"SF Mono", "Fira Code", "Cascadia Code", monospace'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)]!
}

function createColumn(index: number, fontSize: number, waterSurface: number, scatter: boolean): Column {
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
                chars: col.chars.map(c => ({ ...c, char: randomChar() })),
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
        const newChars = col.chars.map(c => {
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
          columns[i] = { ...col, y: newY, chars: newChars, hitWater: newHitWater }
        }
      }
    }

    function updateRipples(dt: number) {
      ripples = ripples
        .map(r => ({
          ...r,
          radius: r.radius + r.speed * dt,
          life: r.life - r.decay * dt,
        }))
        .filter(r => r.life > 0 && r.radius <= r.maxRadius)
    }

    function updateWaves() {
      const damping = 0.97
      const tension = 0.03
      const spread = 0.25

      // Apply tension + damping
      wavePoints = wavePoints.map(p => {
        const newVy = (p.vy + -tension * p.y) * damping
        return { y: p.y + newVy, vy: newVy }
      })

      // Spread passes
      for (let pass = 0; pass < 3; pass++) {
        wavePoints = wavePoints.map((p, i) => {
          let newVy = p.vy
          if (i > 0) newVy += spread * (wavePoints[i - 1]!.y - p.y)
          if (i < wavePoints.length - 1) newVy += spread * (wavePoints[i + 1]!.y - p.y)
          return { ...p, vy: newVy }
        })
      }
    }

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
          if (j === 0) { r = 255; g = 245; b = 220 }
          else if (j < 3) { r = 240; g = 200; b = 140 }
          else { r = 200; g = 149; b = 108 }

          ctx!.fillStyle = `rgba(${r},${g},${b},${brightness})`

          if (j === 0) {
            ctx!.shadowColor = 'rgba(255, 220, 160, 0.6)'
            ctx!.shadowBlur = 8
          }

          ctx!.fillText(col.chars[charIndex]!.char, col.x + fontSize * 0.5, charY)

          if (j === 0) {
            ctx!.shadowColor = 'transparent'
            ctx!.shadowBlur = 0
          }
        }
      }
    }

    function drawReflections() {
      ctx!.save()
      ctx!.beginPath()
      ctx!.rect(0, waterSurface, width, height - waterSurface)
      ctx!.clip()

      ctx!.font = fontSize + 'px ' + FONT_FAMILY
      ctx!.textAlign = 'center'
      ctx!.textBaseline = 'top'

      for (const col of columns) {
        if (!col.active) continue
        for (let j = 0; j < Math.min(col.length, 8); j++) {
          const charY = col.y - j * fontSize
          if (charY > waterSurface || charY < waterSurface - fontSize * 8) continue

          const charIndex = j % col.chars.length
          const reflectY = waterSurface + (waterSurface - charY)
          const depthBelow = reflectY - waterSurface
          const reflectAlpha = Math.max(0, 0.12 * (1 - depthBelow / (height * 0.2)))

          const waveIdx = Math.floor(col.x / WAVE_RESOLUTION)
          const waveOffset =
            waveIdx >= 0 && waveIdx < wavePoints.length ? wavePoints[waveIdx]!.y * 2 : 0

          if (reflectAlpha < 0.01) continue

          ctx!.fillStyle = `rgba(200, 149, 108, ${reflectAlpha})`
          ctx!.fillText(
            col.chars[charIndex]!.char,
            col.x + fontSize * 0.5 + Math.sin(depthBelow * 0.05) * 3,
            reflectY + waveOffset,
          )
        }
      }
      ctx!.restore()
    }

    function drawRipples() {
      for (const r of ripples) {
        const alpha = r.life * 0.3
        for (let ring = 0; ring < 3; ring++) {
          const ringRadius = r.radius - ring * 8
          if (ringRadius <= 0) continue
          const ringAlpha = alpha * (1 - ring * 0.3)

          ctx!.beginPath()
          ctx!.ellipse(r.x, r.y + ring * 2, ringRadius, ringRadius * 0.3, 0, 0, Math.PI * 2)
          ctx!.strokeStyle = `rgba(200, 170, 130, ${ringAlpha})`
          ctx!.lineWidth = 1 - ring * 0.2
          ctx!.stroke()
        }
      }
    }

    function drawWaterSurface(time: number) {
      const waterGrad = ctx!.createLinearGradient(0, waterSurface, 0, height)
      waterGrad.addColorStop(0, 'rgba(15, 13, 11, 0.6)')
      waterGrad.addColorStop(0.3, 'rgba(12, 11, 10, 0.85)')
      waterGrad.addColorStop(1, 'rgba(10, 10, 10, 0.95)')
      ctx!.fillStyle = waterGrad
      ctx!.fillRect(0, waterSurface - 2, width, height - waterSurface + 2)

      // Wave surface line
      ctx!.beginPath()
      for (let x = 0; x <= width; x += WAVE_RESOLUTION) {
        const idx = Math.floor(x / WAVE_RESOLUTION)
        const waveY = idx < wavePoints.length ? wavePoints[idx]!.y : 0
        const ambient =
          Math.sin(x * 0.01 + time * 0.8) * 1.5 +
          Math.sin(x * 0.023 + time * 0.5) * 1.0 +
          Math.sin(x * 0.007 + time * 0.3) * 2.0
        const py = waterSurface + waveY + ambient
        if (x === 0) ctx!.moveTo(x, py)
        else ctx!.lineTo(x, py)
      }
      ctx!.strokeStyle = 'rgba(200, 170, 130, 0.25)'
      ctx!.lineWidth = 1.5
      ctx!.stroke()

      // Surface glow
      const surfGlow = ctx!.createLinearGradient(0, waterSurface - 10, 0, waterSurface + 20)
      surfGlow.addColorStop(0, 'rgba(200, 149, 108, 0)')
      surfGlow.addColorStop(0.4, 'rgba(200, 149, 108, 0.06)')
      surfGlow.addColorStop(0.6, 'rgba(200, 149, 108, 0.04)')
      surfGlow.addColorStop(1, 'rgba(200, 149, 108, 0)')
      ctx!.fillStyle = surfGlow
      ctx!.fillRect(0, waterSurface - 10, width, 30)

      // Zen ripples
      drawZenRipples(time)
    }

    function drawZenRipples(time: number) {
      const zenPoints = [
        { x: width * 0.3, y: waterSurface + (height - waterSurface) * 0.4 },
        { x: width * 0.7, y: waterSurface + (height - waterSurface) * 0.5 },
        { x: width * 0.5, y: waterSurface + (height - waterSurface) * 0.7 },
      ]

      for (let z = 0; z < zenPoints.length; z++) {
        const zp = zenPoints[z]!
        for (let ring = 0; ring < 4; ring++) {
          const phase = time * 0.4 + ring * 1.5 + z * 2.0
          const radius = 20 + (phase % 6) * 15
          const alpha = 0.06 * Math.max(0, 1 - (phase % 6) / 6)
          if (alpha < 0.005) continue

          ctx!.beginPath()
          ctx!.ellipse(zp.x, zp.y, radius, radius * 0.3, 0, 0, Math.PI * 2)
          ctx!.strokeStyle = `rgba(200, 170, 130, ${alpha})`
          ctx!.lineWidth = 0.8
          ctx!.stroke()
        }
      }
    }

    function drawVignette() {
      const cx = width / 2
      const cy = height / 2
      const maxDim = Math.max(width, height)
      const vignette = ctx!.createRadialGradient(cx, cy, maxDim * 0.25, cx, cy, maxDim * 0.8)
      vignette.addColorStop(0, 'rgba(10, 10, 10, 0)')
      vignette.addColorStop(1, 'rgba(10, 10, 10, 0.45)')
      ctx!.fillStyle = vignette
      ctx!.fillRect(0, 0, width, height)
    }

    function drawWaterParticles(time: number) {
      ctx!.save()
      ctx!.beginPath()
      ctx!.rect(0, waterSurface, width, height - waterSurface)
      ctx!.clip()

      for (let i = 0; i < 30; i++) {
        const px = (Math.sin(i * 73.1 + time * 0.07) * 0.5 + 0.5) * width
        const py =
          waterSurface +
          (Math.cos(i * 127.3 + time * 0.05) * 0.5 + 0.5) * (height - waterSurface)
        const alpha = 0.04 + 0.03 * Math.sin(time * 0.5 + i * 1.7)

        ctx!.fillStyle = `rgba(200, 149, 108, ${alpha})`
        ctx!.beginPath()
        ctx!.arc(px, py, 1, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.restore()
    }

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
      const dt = prefersReduced ? 0 : Math.min((timestamp - lastTime) / 1000, 0.05)
      lastTime = timestamp

      const time = timestamp / 1000

      ctx!.clearRect(0, 0, width, height)
      ctx!.fillStyle = '#0a0a0a'
      ctx!.fillRect(0, 0, width, height)

      updateColumns(dt)
      updateRipples(dt)
      updateWaves()

      drawColumns()
      drawWaterSurface(time)
      drawReflections()
      drawRipples()
      drawWaterParticles(time)
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
    <div className={className} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  )
}
