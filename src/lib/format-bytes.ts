/**
 * Format a byte count into a human-readable string (B, KB, MB, GB).
 */

const UNITS = ['B', 'KB', 'MB', 'GB'] as const
const THRESHOLD = 1024

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'

  let unitIndex = 0
  let value = bytes

  while (value >= THRESHOLD && unitIndex < UNITS.length - 1) {
    value /= THRESHOLD
    unitIndex++
  }

  if (unitIndex === 0) {
    return `${value} ${UNITS[unitIndex]}`
  }

  return `${value.toFixed(1)} ${UNITS[unitIndex]}`
}
