/**
 * Fractional order keys: a sibling moves by rewriting its own key, never its neighbours'.
 * Base-62 in ASCII order, so SQLite's binary collation sorts them; a key never ends in '0',
 * which keeps a key strictly between any two others always available.
 */
const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

function digitAt(key: string, index: number): number {
  return DIGITS.indexOf(key[index] ?? '0')
}

function midpoint(low: string, high: string | null): string {
  if (high !== null) {
    let shared = 0
    while ((low[shared] ?? '0') === high[shared]) shared += 1
    if (shared > 0) return high.slice(0, shared) + midpoint(low.slice(shared), high.slice(shared))
  }
  const lowDigit = low ? digitAt(low, 0) : 0
  const highDigit = high === null ? DIGITS.length : digitAt(high, 0)
  if (highDigit - lowDigit > 1) return DIGITS[Math.round((lowDigit + highDigit) / 2)] as string
  if (high !== null && high.length > 1) return high.slice(0, 1)
  return (DIGITS[lowDigit] as string) + midpoint(low.slice(1), null)
}

export function positionBetween(before: string | null, after: string | null): string {
  if (before !== null && after !== null && before >= after) {
    throw new Error(`position ${before} is not before ${after}`)
  }
  return midpoint(before ?? '', after)
}
