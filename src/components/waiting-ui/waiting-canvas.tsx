import { useRef, useEffect } from 'react'
import { logError } from '@/lib/error-logger'

// ─── Types ───────────────────────────────────────────────────────────────────

interface WaitingCanvasProps {
  readonly className?: string
}

// ─── Shader Sources ─────────────────────────────────────────────────────────

const VERT_SRC = `attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`

const FRAG_SRC = `precision highp float;
uniform float u_time;
uniform vec2 u_res;
uniform float u_waveSpeed;
uniform float u_lineCount;
uniform vec2 u_mouse;
uniform vec2 u_offset;

#define S smoothstep
#define PI 3.14159265
#define TAU 6.28318530

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float spiralDist(vec2 uv, float a, float b, float numArms, float t) {
    float r = length(uv);
    if (r < 0.001) return 1e6;
    float angle = atan(uv.y, uv.x);
    float baseTheta = log(r / a) / b;
    baseTheta -= t * 0.3 + u_mouse.x;
    float armSpacing = TAU / numArms;
    float nearest = mod(angle - baseTheta, armSpacing);
    if (nearest > armSpacing * 0.5) nearest -= armSpacing;
    float d = abs(nearest) * r;
    float undulation = sin(baseTheta * 4.0 + t * 0.5) * 0.015;
    d += undulation;
    d = abs(d);
    return d;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_res.xy + u_offset) / u_res.y;
    float t = u_time * u_waveSpeed;

    vec2 p = uv;

    float r = length(p);
    int lineCount = int(u_lineCount);

    vec3 col = vec3(0.0);

    for (int i = 0; i < 10; i++) {
        if (i >= lineCount) break;
        float fi = float(i);
        float frac = fi / max(u_lineCount - 1.0, 1.0);

        float a = 0.02 + frac * 0.03;
        float b = 0.15 + frac * 0.08;
        float numArms = 3.0 + fi;

        float nOff = noise(vec2(fi * 3.7, t * 0.1)) * 0.008;

        float dist = spiralDist(p + vec2(nOff), a, b, numArms, t + fi * 0.5);

        float lw = 0.05 * S(0.1, 0.6, r);
        float l = S(lw, 0.0, dist - 0.004);

        float radialFade = S(0.9, 0.15, r) * S(0.0, 0.04, r);

        vec3 lineCol = vec3(
            0.25 + frac * 0.65,
            0.2 + frac * 0.4,
            0.25 + (1.0 - frac) * 0.15
        );

        col += l * lineCol * radialFade;
    }

    float centerGlow = 0.015 / (r + 0.02);
    col += vec3(0.9, 0.65, 0.35) * centerGlow * 0.15;

    float vig = 1.0 - dot(uv, uv) * 0.4;
    col *= max(vig, 0.0);

    gl_FragColor = vec4(col, 1.0);
}`

// ─── WebGL Helpers ──────────────────────────────────────────────────────────

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  src: string,
): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? 'unknown'
    const label = type === gl.VERTEX_SHADER ? 'vertex' : 'fragment'
    logError(`WebGL ${label} shader compile error: ${info}`, 'WaitingCanvas')
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vert = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC)
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC)
  if (!vert || !frag) return null

  const prog = gl.createProgram()
  if (!prog) return null
  gl.attachShader(prog, vert)
  gl.attachShader(prog, frag)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(prog) ?? 'unknown'
    logError(`WebGL program link error: ${info}`, 'WaitingCanvas')
    gl.deleteProgram(prog)
    return null
  }
  return prog
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Vortex animation — WebGL logarithmic spiral arms with silk glow.
 * Same wrapper pattern as InitCanvas / ErrorCanvas.
 */
export function WaitingCanvas({ className }: WaitingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      preserveDrawingBuffer: false,
    })
    if (!gl) return

    const prog = createProgram(gl)
    if (!prog) return

    gl.useProgram(prog)

    // Full-screen triangle
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    )
    const aPos = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    // Uniform locations
    const uTime = gl.getUniformLocation(prog, 'u_time')
    const uRes = gl.getUniformLocation(prog, 'u_res')
    const uWaveSpeed = gl.getUniformLocation(prog, 'u_waveSpeed')
    const uLineCount = gl.getUniformLocation(prog, 'u_lineCount')
    const uMouse = gl.getUniformLocation(prog, 'u_mouse')
    const uOffset = gl.getUniformLocation(prog, 'u_offset')

    // Default uniform values
    const waveSpeed = 1.0
    const lineCount = 6.0

    // Drag rotation state (mutable for interaction)
    let mouseRotOffset = 0

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    // ── Resize ────────────────────────────────────────────────────────
    let needsResize = true
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)

    function resize() {
      const p = canvas!.parentElement
      if (!p) return
      const pw = p.clientWidth
      const ph = p.clientHeight
      if (pw === 0 || ph === 0) return
      needsResize = false
      const w = Math.round(pw * dpr)
      const h = Math.round(ph * dpr)
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w
        canvas!.height = h
        canvas!.style.width = pw + 'px'
        canvas!.style.height = ph + 'px'
      }
      // Always set viewport + u_res — the GL program may have changed
      // (React StrictMode re-creates the program on the same canvas)
      gl!.viewport(0, 0, w, h)
      gl!.uniform2f(uRes, w, h)
      // Shift vortex center down by half the header height so it looks
      // visually centered in the area below the sticky header (~44px)
      // Shift vortex center down by half the header height so it looks
      // visually centered in the area below the sticky header
      const headerEl = document.querySelector('header')
      const headerH = headerEl ? headerEl.clientHeight * dpr * 0.5 : 0
      gl!.uniform2f(uOffset, 0, -headerH)
    }

    // Use ResizeObserver so layout changes always trigger resize
    const resizeObserver = new ResizeObserver(() => {
      needsResize = true
    })
    const parent = canvas.parentElement
    if (parent) resizeObserver.observe(parent)

    function onResize() {
      needsResize = true
    }

    // ── Mouse / touch drag ────────────────────────────────────────────
    let dragging = false
    let lastX = 0

    function onMouseDown(e: MouseEvent) {
      dragging = true
      lastX = e.clientX
    }

    function onMouseMove(e: MouseEvent) {
      if (!dragging) return
      mouseRotOffset += (e.clientX - lastX) * 0.008
      lastX = e.clientX
    }

    function onMouseUp() {
      dragging = false
    }

    function onTouchStart(e: TouchEvent) {
      e.preventDefault()
      const t = e.touches[0]
      if (!t) return
      dragging = true
      lastX = t.clientX
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault()
      if (!dragging) return
      const t = e.touches[0]
      if (!t) return
      mouseRotOffset += (t.clientX - lastX) * 0.008
      lastX = t.clientX
    }

    function onTouchEnd() {
      dragging = false
    }

    // ── Visibility ────────────────────────────────────────────────────
    let running = true

    function onVisibilityChange() {
      if (document.hidden) {
        running = false
      } else {
        running = true
        rafId = requestAnimationFrame(render)
      }
    }

    // ── Animation loop ────────────────────────────────────────────────
    let rafId = 0

    function render(now: number) {
      if (!running) return
      if (needsResize) resize()

      const t = prefersReduced ? 0.0 : now * 0.001
      gl!.uniform1f(uTime, t)
      gl!.uniform1f(uWaveSpeed, waveSpeed)
      gl!.uniform1f(uLineCount, lineCount)
      gl!.uniform2f(uMouse, mouseRotOffset, 0.0)

      gl!.drawArrays(gl!.TRIANGLES, 0, 3)
      rafId = requestAnimationFrame(render)
    }

    // ── Init ──────────────────────────────────────────────────────────
    resize()
    rafId = requestAnimationFrame(render)

    window.addEventListener('resize', onResize)
    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelAnimationFrame(rafId)
      running = false
      resizeObserver.disconnect()
      window.removeEventListener('resize', onResize)
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('visibilitychange', onVisibilityChange)

      // Clean up WebGL resources
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
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
