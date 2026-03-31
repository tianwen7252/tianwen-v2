// Calculator Engine — iPhone-style calculator (pure functions, immutable state)
import { evaluate } from 'mathjs/number'

// ─── Types ───────────────────────────────────────────────────────────────────

export type CalculatorKey =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '.'
  | '+'
  | '-'
  | '*'
  | '/'
  | '='
  | '%'
  | 'c'
  | 'backspace'
  | '+/-'

export interface CalculatorState {
  readonly display: string
  readonly expression: string
  readonly previousValue: number | null
  readonly operator: string | null
  readonly waitingForOperand: boolean
  readonly error: boolean
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DIGIT_KEYS = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
const OPERATOR_KEYS = new Set(['+', '-', '*', '/'])

/** Map internal operator symbols to display-friendly symbols. */
const DISPLAY_OPERATOR: Readonly<Record<string, string>> = {
  '+': '+',
  '-': '-',
  '*': '\u00D7',
  '/': '\u00F7',
}

// ─── Initial State ───────────────────────────────────────────────────────────

/** Create a fresh calculator state with display "0". */
export function createInitialState(): CalculatorState {
  return {
    display: '0',
    expression: '',
    previousValue: null,
    operator: null,
    waitingForOperand: false,
    error: false,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse a display string to a number. Returns 0 for non-numeric strings (e.g., "Error"). */
function parseDisplay(display: string): number {
  const value = parseFloat(display)
  return Number.isNaN(value) ? 0 : value
}

/** Format a numeric result for display. */
function formatResult(value: number): string {
  if (!Number.isFinite(value)) {
    return 'Error'
  }
  // Remove trailing zeros from decimal results
  return String(parseFloat(value.toPrecision(12)))
}

/** Check whether a numeric result is out of displayable range (would produce scientific notation). */
function isOutOfRange(value: number): boolean {
  if (!Number.isFinite(value)) return true
  const abs = Math.abs(value)
  return abs !== 0 && (abs >= 1e15 || abs < 1e-6)
}

/** Check if state is "just finished equals" and ready for fresh input. */
function isAfterEquals(state: CalculatorState): boolean {
  return (
    state.expression.includes('=') &&
    !state.waitingForOperand &&
    state.operator === null
  )
}

/** Create an error state from the current state. */
function toErrorState(state: CalculatorState): CalculatorState {
  return {
    ...state,
    display: 'Error',
    error: true,
    expression: '',
    previousValue: null,
    operator: null,
    waitingForOperand: false,
  }
}

// ─── Key Handlers ────────────────────────────────────────────────────────────

/** Handle digit key press (0-9). */
function handleDigit(state: CalculatorState, key: string): CalculatorState {
  // After equals, start a fresh calculation
  if (isAfterEquals(state)) {
    return {
      ...createInitialState(),
      display: key,
    }
  }

  if (state.waitingForOperand) {
    return {
      ...state,
      display: key,
      waitingForOperand: false,
    }
  }

  // Suppress leading zeros
  const newDisplay = state.display === '0' ? key : state.display + key
  return {
    ...state,
    display: newDisplay,
  }
}

/** Handle decimal point key press. */
function handleDecimal(state: CalculatorState): CalculatorState {
  // After equals, start fresh with "0."
  if (isAfterEquals(state)) {
    return {
      ...createInitialState(),
      display: '0.',
    }
  }

  if (state.waitingForOperand) {
    return {
      ...state,
      display: '0.',
      waitingForOperand: false,
    }
  }

  // Ignore if decimal already exists
  if (state.display.includes('.')) {
    return state
  }

  return {
    ...state,
    display: state.display + '.',
  }
}

/** Handle operator key press (+, -, *, /). No evaluation — just accumulate expression. */
function handleOperator(state: CalculatorState, op: string): CalculatorState {
  const displayOp = DISPLAY_OPERATOR[op] ?? op

  // After equals result, start fresh expression from the result value
  if (isAfterEquals(state)) {
    return {
      ...state,
      previousValue: parseDisplay(state.display),
      operator: op,
      waitingForOperand: true,
      expression: state.display + displayOp,
    }
  }

  // If already waiting for operand, just replace the operator
  if (state.waitingForOperand) {
    // Replace last operator in expression
    const trimmedExpr = state.expression.replace(/[+\-×÷]$/, '')
    return {
      ...state,
      operator: op,
      expression: trimmedExpr + displayOp,
    }
  }

  // Append current display value and operator to expression
  const newExpression = state.expression + state.display + displayOp

  return {
    ...state,
    previousValue: parseDisplay(state.display),
    operator: op,
    waitingForOperand: true,
    expression: newExpression,
  }
}

/** Handle equals key press — evaluate the full accumulated expression via mathjs. */
function handleEquals(state: CalculatorState): CalculatorState {
  // Already evaluated — pressing = again is a no-op
  if (state.expression.includes('=')) return state

  // Build the full math expression: accumulated expression + current display
  const fullDisplayExpr = state.expression + state.display
  // Convert display symbols to math operators for mathjs
  const mathExpr = fullDisplayExpr.replace(/×/g, '*').replace(/÷/g, '/')

  if (!mathExpr || mathExpr.trim() === '') return state

  try {
    const result = evaluate(mathExpr) as number

    if (typeof result !== 'number' || !Number.isFinite(result)) {
      return toErrorState(state)
    }

    if (isOutOfRange(result)) {
      return toErrorState(state)
    }

    const resultStr = formatResult(result)

    return {
      ...state,
      display: resultStr,
      expression: fullDisplayExpr + '=' + resultStr,
      previousValue: null,
      operator: null,
      waitingForOperand: false,
    }
  } catch {
    return toErrorState(state)
  }
}

/** Handle percentage key press. */
function handlePercentage(state: CalculatorState): CalculatorState {
  const currentValue = parseDisplay(state.display)

  // With pending operator: calculate percentage of left operand
  if (state.previousValue !== null && state.operator !== null) {
    const op = state.operator

    // For + and -, percentage means "X% of previousValue"
    // For * and /, percentage means "divide by 100"
    const percentValue =
      op === '+' || op === '-'
        ? state.previousValue * (currentValue / 100)
        : currentValue / 100

    if (isOutOfRange(percentValue)) {
      return toErrorState(state)
    }

    return {
      ...state,
      display: formatResult(percentValue),
      waitingForOperand: false,
    }
  }

  // No operator: just divide by 100
  const result = currentValue / 100
  if (isOutOfRange(result)) {
    return toErrorState(state)
  }
  return {
    ...state,
    display: formatResult(result),
  }
}

/** Handle sign toggle (+/-) key press. */
function handleSignToggle(state: CalculatorState): CalculatorState {
  const currentValue = parseDisplay(state.display)

  // 0 stays 0
  if (currentValue === 0) {
    return {
      ...state,
      display: '0',
    }
  }

  const negated = -currentValue
  return {
    ...state,
    display: formatResult(negated),
  }
}

/** Handle backspace key press. */
function handleBackspace(state: CalculatorState): CalculatorState {
  // If waiting for operand, treat as removing from "0" → stays "0"
  if (state.waitingForOperand) {
    return {
      ...state,
      display: '0',
      waitingForOperand: false,
    }
  }

  // Remove last character
  const newDisplay = state.display.slice(0, -1)

  return {
    ...state,
    display: newDisplay === '' || newDisplay === '-' ? '0' : newDisplay,
  }
}

// ─── Main Dispatch ───────────────────────────────────────────────────────────

/** Process a single key press and return a new (immutable) calculator state. */
export function processKey(
  state: CalculatorState,
  key: CalculatorKey,
): CalculatorState {
  // Clear always works, even in error state
  if (key === 'c') {
    return createInitialState()
  }

  // In error state, only clear is accepted
  if (state.error) {
    return state
  }

  // Dispatch by key type
  if (DIGIT_KEYS.has(key)) {
    return handleDigit(state, key)
  }

  if (key === '.') {
    return handleDecimal(state)
  }

  if (OPERATOR_KEYS.has(key)) {
    return handleOperator(state, key)
  }

  if (key === '=') {
    return handleEquals(state)
  }

  if (key === '%') {
    return handlePercentage(state)
  }

  if (key === '+/-') {
    return handleSignToggle(state)
  }

  if (key === 'backspace') {
    return handleBackspace(state)
  }

  // Unknown key — return state unchanged
  return state
}

// ─── Utility Functions ───────────────────────────────────────────────────────

/** Get the numeric value from state, or null if in error state. */
export function getNumericValue(state: CalculatorState): number | null {
  if (state.error) {
    return null
  }

  return parseDisplay(state.display)
}

/** Check whether the calculator is in an error state. */
export function isError(state: CalculatorState): boolean {
  return state.error
}
