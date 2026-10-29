/**
 * A Progress's share, 0–1, or null when nothing real says one: a failed `expr`, an empty cell,
 * a `$row.x` that never resolved. Null draws as —, never an invented 0%.
 */
export function ratioOf(
  value: number | string | undefined,
  expr: string | undefined,
  computed: unknown,
): number | null {
  const raw = expr ? computed : value
  if (typeof raw === 'string' && (raw.trim() === '' || raw.startsWith('$row.'))) return null
  const ratio = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : Number.NaN
  return Number.isFinite(ratio) ? Math.min(1, Math.max(0, ratio)) : null
}
