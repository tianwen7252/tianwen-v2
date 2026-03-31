import type { ReactNode } from 'react'
import {
  ArrowLeft,
  Divide,
  Equal,
  Minus,
  Percent,
  Plus,
  X as Multiply,
} from 'lucide-react'
import { RippleButton } from '@/components/ui/ripple-button'
import { cn } from '@/lib/cn'
import type { CalculatorKey } from '@/lib/calculator-engine'

// ─── Types ──────────────────────────────────────────────────────────────────

interface CalculatorKeypadProps {
  readonly activeOperator: string | null
  readonly onKey: (key: CalculatorKey) => void
  /** Use smaller buttons for modal context */
  readonly compact?: boolean
}

interface KeyDef {
  readonly key: CalculatorKey
  readonly label: ReactNode
  readonly type: 'digit' | 'operator' | 'action' | 'equals'
}

// ─── Key layout ─────────────────────────────────────────────────────────────

const ICON = 'size-6'

const NEGATE_LABEL = (
  <span className="flex items-center gap-0.5">
    <Plus className="size-3.5" />
    <span>/</span>
    <Minus className="size-3.5" />
  </span>
)

const ROWS: readonly (readonly KeyDef[])[] = [
  [
    { key: 'backspace', label: <ArrowLeft className={ICON} />, type: 'action' },
    { key: 'c', label: 'C', type: 'action' },
    { key: '%', label: <Percent className={ICON} />, type: 'action' },
    { key: '/', label: <Divide className={ICON} />, type: 'operator' },
  ],
  [
    { key: '7', label: '7', type: 'digit' },
    { key: '8', label: '8', type: 'digit' },
    { key: '9', label: '9', type: 'digit' },
    { key: '-', label: <Minus className={ICON} />, type: 'operator' },
  ],
  [
    { key: '4', label: '4', type: 'digit' },
    { key: '5', label: '5', type: 'digit' },
    { key: '6', label: '6', type: 'digit' },
    { key: '+', label: <Plus className={ICON} />, type: 'operator' },
  ],
  [
    { key: '1', label: '1', type: 'digit' },
    { key: '2', label: '2', type: 'digit' },
    { key: '3', label: '3', type: 'digit' },
    { key: '*', label: <Multiply className={ICON} />, type: 'operator' },
  ],
  [
    { key: '+/-', label: NEGATE_LABEL, type: 'action' },
    { key: '0', label: '0', type: 'digit' },
    { key: '.', label: '.', type: 'digit' },
    { key: '=', label: <Equal className={ICON} />, type: 'equals' },
  ],
]

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * 4-column x 5-row calculator keypad.
 * Row height adapts: ~50px in page mode, ~40px in compact/modal mode.
 */
export function CalculatorKeypad({
  activeOperator,
  onKey,
  compact = false,
}: CalculatorKeypadProps) {
  const btnSize = compact ? 'size-15' : 'size-17'
  return (
    <div className="grid w-fit grid-cols-4 gap-2">
      {ROWS.flatMap(row =>
        row.map(def => {
          const isActive = def.type === 'operator' && def.key === activeOperator
          return (
            <RippleButton
              key={def.key}
              onClick={() => onKey(def.key)}
              rippleColor="rgba(127, 149, 106, 0.25)"
              className={cn(
                `flex ${btnSize} items-center justify-center rounded-full border border-black/8 bg-white text-2xl text-foreground shadow-xs transition-all duration-200 active:scale-[0.9]`,
                isActive && 'border-primary/40 bg-primary/15 text-primary',
                def.type === 'equals' &&
                  'border-black/8 bg-white text-foreground',
              )}
            >
              {def.label}
            </RippleButton>
          )
        }),
      )}
    </div>
  )
}
