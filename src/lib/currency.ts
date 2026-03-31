/**
 * Format a number as currency with NT$ thousands separators.
 * Returns empty string for nullish/zero values when allowEmpty is true.
 */
export function formatCurrency(
  amount: number | null | undefined,
  { allowEmpty = false }: { allowEmpty?: boolean } = {},
): string {
  if (allowEmpty && (amount == null || amount === 0)) return ''
  return `$${(amount ?? 0).toLocaleString()}`
}
