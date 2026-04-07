import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Info } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createInitialState,
  processKey,
  getNumericValue,
  isError as isCalcError,
  type CalculatorKey,
  type CalculatorState,
} from '@/lib/calculator-engine'
import { getCustomOrderNameRepo } from '@/lib/repositories/provider'
import { useOrderStore } from '@/stores/order-store'
import { RippleButton } from '@/components/ui/ripple-button'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { CalculatorKeypad } from './calculator-keypad'

// ─── Constants ──────────────────────────────────────────────────────────────

/** Map physical keyboard keys to calculator keys */
const KEYBOARD_MAP: Readonly<Record<string, CalculatorKey>> = {
  '0': '0',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '.': '.',
  '+': '+',
  '-': '-',
  '*': '*',
  '/': '/',
  Enter: '=',
  '=': '=',
  '%': '%',
  Backspace: 'backspace',
  Delete: 'c',
  Escape: 'c',
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface CalculatorOverlayProps {
  readonly onClose: () => void
  /** Use smaller buttons for modal context */
  readonly compact?: boolean
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Calculator overlay with glassmorphism backdrop and centered floating content.
 * Vertical layout: display → keypad → combobox → submit.
 * Supports physical keyboard input.
 */
export function CalculatorOverlay({
  onClose,
  compact = false,
}: CalculatorOverlayProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const addCustomItem = useOrderStore(s => s.addCustomItem)

  const [calcState, setCalcState] =
    useState<CalculatorState>(createInitialState)
  const [customName, setCustomName] = useState('')
  // Track whether combobox input is focused to suppress keyboard calculator input
  const [nameInputFocused, setNameInputFocused] = useState(false)

  // Fetch saved custom order names
  const { data: savedNames = [] } = useQuery({
    queryKey: ['custom-order-names'],
    queryFn: () => getCustomOrderNameRepo().findAll(),
  })

  const nameOptions: ComboboxOption[] = savedNames.map(n => ({
    value: n.id,
    label: n.name,
  }))

  const handleKey = useCallback((key: CalculatorKey) => {
    setCalcState(prev => processKey(prev, key))
  }, [])

  // Keyboard support — listen for physical key presses
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when combobox input is focused
      if (nameInputFocused) return

      const calcKey = KEYBOARD_MAP[e.key]
      if (calcKey) {
        e.preventDefault()
        handleKey(calcKey)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleKey, nameInputFocused])

  const handleDeleteNameOption = useCallback(
    async (id: string) => {
      try {
        await getCustomOrderNameRepo().remove(id)
        queryClient.invalidateQueries({ queryKey: ['custom-order-names'] })
      } catch {
        // Silently ignore — option will reappear on next fetch
      }
    },
    [queryClient],
  )

  const handleSubmit = useCallback(async () => {
    // Auto-evaluate if user forgot to press = (has pending expression)
    const needsEval =
      calcState.expression && !calcState.expression.includes('=')
    const finalState = needsEval ? processKey(calcState, '=') : calcState
    if (needsEval) setCalcState(finalState)

    const value = getNumericValue(finalState)
    if (value === null || value === 0) return

    const orderName =
      customName.trim() ||
      (value < 0 ? t('order.discountDefault') : t('order.customOrderDefault'))

    addCustomItem(orderName, value)

    // Persist custom name if it's user-defined
    const trimmedName = customName.trim()
    if (
      trimmedName &&
      trimmedName !== t('order.customOrderDefault') &&
      trimmedName !== t('order.discountDefault')
    ) {
      try {
        await getCustomOrderNameRepo().create(trimmedName)
        queryClient.invalidateQueries({ queryKey: ['custom-order-names'] })
      } catch {
        // Name persistence failure is non-blocking — item already added to cart
      }
    }

    onClose()
  }, [calcState, customName, addCustomItem, onClose, queryClient, t])

  const numericValue = getNumericValue(calcState)
  const errorState = isCalcError(calcState)
  const isZeroResult = numericValue === 0
  const canSubmit = !errorState && !isZeroResult && numericValue !== null

  return (
    <div
      data-testid="calculator-overlay"
      className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[30px]"
      onClick={onClose}
    >
      {/* Info hints — overlay top-left corner, only shown when value is non-zero */}
      {numericValue !== null && numericValue !== 0 && (
        <div className="absolute left-3 top-3 z-30 flex flex-col gap-1 text-md text-muted-foreground">
          {numericValue > 0 && (
            <div className="flex items-center gap-1">
              <Info size={14} />
              <span>{t('order.calculatorPositiveHint')}</span>
            </div>
          )}
          {numericValue < 0 && (
            <div className="flex items-center gap-1">
              <Info size={14} />
              <span>{t('order.calculatorNegativeHint')}</span>
            </div>
          )}
        </div>
      )}

      {/* Close button — overlay top-right corner */}
      <RippleButton
        onClick={onClose}
        rippleColor="rgba(0,0,0,0.1)"
        className="absolute right-3 top-3 z-30 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
      >
        <X className="size-5" />
      </RippleButton>

      {/* Content card — width driven by keypad (inline-flex + w-fit on inner) */}
      <div
        className="inline-flex flex-col rounded-2xl bg-[#ffffff60] p-4 shadow-[0_8px_40px_rgba(0,0,0,0.12)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Display area: constrained to same width as keypad */}
        <div className="mb-3 flex min-h-24 w-0 min-w-full shrink-0 flex-col items-end justify-end overflow-hidden">
          {(calcState.expression || calcState.operator) && (
            <span className="max-w-full truncate text-xl text-muted-foreground">
              {calcState.expression.includes('=')
                ? calcState.expression
                : calcState.expression + calcState.display}
            </span>
          )}
          <span
            className={`font-mono text-4xl truncate max-w-full ${
              errorState ? 'text-destructive' : 'text-foreground'
            }`}
          >
            {calcState.display}
          </span>
        </div>

        {/* Keypad */}
        <CalculatorKeypad
          activeOperator={calcState.operator}
          onKey={handleKey}
          compact={compact}
        />

        {/* Bottom: Combobox (left) + Submit (right) — constrained to keypad width */}
        <div className="mt-3 flex w-0 min-w-full shrink-0 items-center gap-2">
          <Combobox
            value={customName}
            onChange={setCustomName}
            options={nameOptions}
            onDelete={handleDeleteNameOption}
            placeholder={t('order.calculatorNamePlaceholder')}
            onFocusChange={setNameInputFocused}
          />
          <RippleButton
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="h-10 shrink-0 rounded-xl bg-(--color-gold) px-8 text-md text-white hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
          >
            {t('order.calculatorSubmit')}
          </RippleButton>
        </div>
      </div>
    </div>
  )
}
