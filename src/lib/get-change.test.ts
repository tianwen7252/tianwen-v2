import { describe, it, expect } from 'vitest'
import { getChange, COMMON_BILLS } from './get-change'

// ─── Constants ──────────────────────────────────────────────────────────────

describe('COMMON_BILLS', () => {
  it('should be [1000, 500, 100]', () => {
    expect(COMMON_BILLS).toEqual([1000, 500, 100])
  })

  it('should be immutable (readonly)', () => {
    // TypeScript enforces readonly at compile time;
    // at runtime we verify the reference is stable
    expect(Object.isFrozen(COMMON_BILLS)).toBe(true)
  })
})

// ─── getChange ──────────────────────────────────────────────────────────────

describe('getChange', () => {
  // ─── Happy-path examples from spec ──────────────────────────────────────

  it('should return 3 results for total=140', () => {
    const result = getChange(140)
    expect(result).toEqual([
      [1000, 1000, 860],
      [500, 500, 360],
      [100, 200, 60],
    ])
  })

  it('should return 1 result for total=860', () => {
    const result = getChange(860)
    // Only $1000 > 860; $500 and $100 produce money that doesn't pass the filter
    expect(result).toEqual([[1000, 1000, 140]])
  })

  // ─── Null cases ─────────────────────────────────────────────────────────

  it('should return null for total=0', () => {
    expect(getChange(0)).toBeNull()
  })

  it('should return null for single-digit total (total=5)', () => {
    expect(getChange(5)).toBeNull()
  })

  it('should return null for 5-digit total (total=10000)', () => {
    expect(getChange(10000)).toBeNull()
  })

  it('should return null for 6-digit total (total=100000)', () => {
    expect(getChange(100000)).toBeNull()
  })

  // ─── Two-digit totals ──────────────────────────────────────────────────

  it('should return results for total=50', () => {
    const result = getChange(50)
    // 1000 > 50 → [1000, 1000, 950]
    // 500 > 50 → [500, 500, 450]
    // 100 > 50 → [100, 100, 50]
    expect(result).toEqual([
      [1000, 1000, 950],
      [500, 500, 450],
      [100, 100, 50],
    ])
  })

  it('should return results for total=10', () => {
    const result = getChange(10)
    // 1000 > 10 → [1000, 1000, 990]
    // 500 > 10 → [500, 500, 490]
    // 100 > 10 → [100, 100, 90]
    expect(result).toEqual([
      [1000, 1000, 990],
      [500, 500, 490],
      [100, 100, 90],
    ])
  })

  // ─── Edge: total equals a bill exactly ──────────────────────────────────

  it('should return correct results for total=100 (equals $100 bill)', () => {
    const result = getChange(100)
    // 1000 > 100 → [1000, 1000, 900]
    // 500 > 100 → [500, 500, 400]
    // 100 === 100 → neither branch (bill > total nor total > bill), skipped
    expect(result).toEqual([
      [1000, 1000, 900],
      [500, 500, 400],
    ])
  })

  it('should return correct results for total=500 (equals $500 bill)', () => {
    const result = getChange(500)
    // 1000 > 500 → [1000, 1000, 500]
    // 500 === 500 → neither branch, skipped
    // 100 < 500 → money = 100*(5+1) = 600; 600 > 500 and 600 < COMMON_BILLS[1]=500? No → skip
    expect(result).toEqual([[1000, 1000, 500]])
  })

  it('should return empty array for total=1000 (equals $1000 bill exactly)', () => {
    const result = getChange(1000)
    // 1000 === 1000 → neither branch, skipped
    // 500 < 1000 → money = 500*(1+1) = 1000; 1000 > 1000? No → skip
    // 100 < 1000 → money = 100*(1+1) = 200; 200 > 1000? No → skip
    expect(result).toEqual([])
  })

  // ─── Three-digit totals ────────────────────────────────────────────────

  it('should return results for total=250', () => {
    const result = getChange(250)
    // 1000 > 250 → [1000, 1000, 750]
    // 500 > 250 → [500, 500, 250]
    // 100 < 250 → money = 100*(2+1) = 300; 300 > 250 and 300 < 500 → [100, 300, 50]
    expect(result).toEqual([
      [1000, 1000, 750],
      [500, 500, 250],
      [100, 300, 50],
    ])
  })

  // ─── Four-digit totals ─────────────────────────────────────────────────

  it('should return results for total=1500', () => {
    const result = getChange(1500)
    // 1000 < 1500 → money = 1000*(1+1) = 2000; 2000 > 1500 and index=0 → [1000, 2000, 500]
    // 500 < 1500 → money = 500*(1+1) = 1000; 1000 > 1500? No → skip
    // 100 < 1500 → money = 100*(1+1) = 200; 200 > 1500? No → skip
    expect(result).toEqual([[1000, 2000, 500]])
  })

  it('should return results for total=2500', () => {
    const result = getChange(2500)
    // 1000 < 2500 → money = 1000*(2+1) = 3000; 3000 > 2500 and index=0 → [1000, 3000, 500]
    // 500 < 2500 → money = 500*(2+1) = 1500; 1500 > 2500? No → skip
    // 100 < 2500 → money = 100*(2+1) = 300; 300 > 2500? No → skip
    expect(result).toEqual([[1000, 3000, 500]])
  })

  it('should return results for total=9999 (max 4-digit)', () => {
    const result = getChange(9999)
    // 1000 < 9999 → money = 1000*(9+1) = 10000; 10000 > 9999 and index=0 → [1000, 10000, 1]
    // 500 < 9999 → money = 500*(9+1) = 5000; 5000 > 9999? No → skip
    // 100 < 9999 → money = 100*(9+1) = 1000; 1000 > 9999? No → skip
    expect(result).toEqual([[1000, 10000, 1]])
  })

  // ─── Empty result (not null but empty array) ───────────────────────────

  it('should return empty array when no bills produce change predictions', () => {
    // total=5000: length=4, firstNumber=5
    // 1000 < 5000 → money = 1000*(5+1) = 6000; 6000 > 5000 and index=0 → [1000, 6000, 1000]
    // 500 < 5000 → money = 500*(5+1) = 3000; 3000 > 5000? No → skip
    // 100 < 5000 → money = 100*(5+1) = 600; 600 > 5000? No → skip
    const result = getChange(5000)
    expect(result).toEqual([[1000, 6000, 1000]])
  })

  // ─── Return type is readonly ──────────────────────────────────────────

  it('should return a result array (not null) for valid multi-digit totals', () => {
    const result = getChange(140)
    expect(result).not.toBeNull()
    expect(Array.isArray(result)).toBe(true)
  })
})
