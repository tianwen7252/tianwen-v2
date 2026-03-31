// ─── Constants ──────────────────────────────────────────────────────────────

/** Common bill denominations used in Taiwan (NTD). */
export const COMMON_BILLS: readonly number[] = Object.freeze([1000, 500, 100])

// ─── Types ──────────────────────────────────────────────────────────────────

/** Tuple: [bill unit, money given, change returned] */
type ChangeEntry = readonly [number, number, number]

// ─── Algorithm ──────────────────────────────────────────────────────────────

/**
 * Predict change denominations for a given total.
 *
 * Returns an array of [billUnit, moneyGiven, change] tuples, or null
 * when the total is outside the supported range (single-digit or 5+ digits).
 *
 * Ported from v1 implementation.
 */
export function getChange(total: number): readonly ChangeEntry[] | null {
  const totalStr = total.toString()
  const { length } = totalStr
  const firstNumber = +(totalStr[0] ?? '0')

  if (length <= 4 && length > 1) {
    const result: ChangeEntry[] = []

    COMMON_BILLS.forEach((bill, index) => {
      if (bill > total) {
        result.push([bill, bill, bill - total])
      } else if (total > bill) {
        const money = bill * (firstNumber + 1)
        const prevBill = COMMON_BILLS[index - 1]
        if (
          money > total &&
          (prevBill === undefined || money < prevBill || index === 0)
        ) {
          result.push([bill, money, money - total])
        }
      }
    })

    return result
  }

  return null
}
