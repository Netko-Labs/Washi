import type { TableSpec } from '@washi/ink'

/**
 * A spec sent for a table that exists, laid over the one it has: each column it names replaces
 * that column in place, a new one is added at the end, and one it leaves out stays — an outside
 * agent adding a column never drops the rest by omission.
 */
export function mergedSpec(existing: TableSpec | undefined, sent: TableSpec): TableSpec {
  if (!existing) return sent
  const named = new Map(sent.columns.map((column) => [column.name, column]))
  const kept = existing.columns.map((column) => named.get(column.name) ?? column)
  const added = sent.columns.filter(
    (column) => !existing.columns.some((each) => each.name === column.name),
  )
  return { name: sent.name, columns: [...kept, ...added] }
}
