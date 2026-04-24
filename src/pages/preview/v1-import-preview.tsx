/**
 * Dev preview page for the V1 Import Modal.
 * Simulates import progress with fake data for visual testing.
 */

import { useState, useRef, useCallback } from 'react'
import { RippleButton } from '@/components/ui/ripple-button'
import { V1ImportModal } from '@/components/settings/v1-import-modal'
import type { V1ImportProgress, V1ImportResult } from '@/lib/v1-data-importer'

// ── Fake data for simulation ───────────────────────────────────────────────

interface SimulationPhase {
  readonly phase: V1ImportProgress['phase']
  readonly tableName: string
  readonly total: number
}

const SIMULATION_PHASES: readonly SimulationPhase[] = [
  { phase: 'downloading', tableName: 'downloading', total: 1 },
  { phase: 'transforming', tableName: 'transforming', total: 1 },
  { phase: 'orders', tableName: 'orders', total: 52514 },
  { phase: 'order_items', tableName: 'order_items', total: 98200 },
]

const SAMPLE_ERRORS = [
  'orders: 訂單 #1234 寫入失敗: UNIQUE constraint failed',
  'order_items: v1-oi-5678-2 寫入失敗: FOREIGN KEY constraint failed',
  'attendances: v1-att-9012 寫入失敗: CHECK constraint failed: date format',
]

// ── Component ──────────────────────────────────────────────────────────────

export function V1ImportPreview() {
  const [open, setOpen] = useState(false)
  const [progress, setProgress] = useState<V1ImportProgress | null>(null)
  const [result, setResult] = useState<V1ImportResult | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startSimulation = useCallback(
    (withErrors: boolean) => {
      cleanup()
      setProgress(null)
      setResult(null)
      setOpen(true)

      let phaseIdx = 0
      let current = 0

      timerRef.current = setInterval(() => {
        const phase = SIMULATION_PHASES[phaseIdx]
        if (!phase) {
          cleanup()
          // Build final counts from all phases
          const counts: Record<string, number> = {}
          for (const p of SIMULATION_PHASES) {
            counts[p.tableName] = p.total
          }
          const errors = withErrors ? [...SAMPLE_ERRORS] : []
          setResult({ counts, errors })
          return
        }

        // Small tables finish in one tick, large tables advance in bigger chunks
        const step =
          phase.total <= 100 ? phase.total : Math.ceil(phase.total / 3)
        current = Math.min(current + step, phase.total)

        setProgress({
          phase: phase.phase,
          current,
          total: phase.total,
          tableName: phase.tableName,
        })

        if (current >= phase.total) {
          phaseIdx += 1
          current = 0
        }
      }, 200)
    },
    [cleanup],
  )

  const handleClose = useCallback(() => {
    cleanup()
    setOpen(false)
    setProgress(null)
    setResult(null)
  }, [cleanup])

  return (
    <div className="space-y-4">
      <h2 className="text-xl">V1 Import Modal Preview</h2>
      <p className="text-muted-foreground">
        Simulate the V1 database import modal with fake progress data.
      </p>

      <div className="flex gap-3">
        <RippleButton
          className="rounded-md border-none bg-(--color-green) px-4 py-2 text-white hover:opacity-80"
          onClick={() => startSimulation(false)}
        >
          正常匯入 Demo
        </RippleButton>
        <RippleButton
          className="rounded-md border-none bg-(--color-red) px-4 py-2 text-white hover:opacity-80"
          onClick={() => startSimulation(true)}
        >
          錯誤匯入 Demo
        </RippleButton>
      </div>

      <V1ImportModal
        open={open}
        progress={progress}
        result={result}
        onClose={handleClose}
      />
    </div>
  )
}
