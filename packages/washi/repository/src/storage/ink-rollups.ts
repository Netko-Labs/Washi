import {
  ARRAY_COLUMN_TYPES,
  type Filter,
  type InkQuery,
  type QueryRow,
  type RollupFilter,
  type Scalar,
  type TableSpec,
} from '@washi/ink'
import type { RollupFetch } from './types'

export function rollupNames(spec: TableSpec): Set<string> {
  return new Set(spec.columns.filter((column) => column.type === 'rollup').map((c) => c.name))
}

/** A `{ param }` filter takes the query's value; an unset param drops the filter — "all time". */
export function resolveParams(
  where: RollupFilter[] | undefined,
  params: InkQuery['params'],
): Filter[] {
  return (where ?? []).flatMap((filter) => {
    const { value } = filter
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return [{ ...filter, value }]
    }
    const read = params?.[value.param]
    return read === undefined || read === null || read === '' ? [] : [{ ...filter, value: read }]
  })
}

function aggregate(values: Scalar[], fn: string): Scalar {
  if (fn === 'count') return values.length
  const numbers = values.filter((value): value is number => typeof value === 'number')
  if (fn === 'sum') return numbers.reduce((total, value) => total + value, 0)
  if (numbers.length === 0) return null
  if (fn === 'avg') return numbers.reduce((total, value) => total + value, 0) / numbers.length
  return fn === 'min' ? Math.min(...numbers) : Math.max(...numbers)
}

/**
 * Each rollup over the rows that point at each row, one read of the target per rollup column —
 * never one per row. A sum over nothing is 0; an average or extreme over nothing is null.
 */
export function computeRollups(
  spec: TableSpec,
  rows: QueryRow[],
  params: InkQuery['params'],
  fetch: RollupFetch,
): void {
  const rollups = spec.columns.filter((column) => column.type === 'rollup' && column.rollup)
  if (rollups.length === 0 || rows.length === 0) return
  const firstText = spec.columns.find((column) => column.type === 'text')?.name ?? 'id'

  for (const column of rollups) {
    const rollup = column.rollup
    if (!rollup) continue
    const fetched = fetch(rollup.table, resolveParams(rollup.where, params))
    if (!fetched) {
      for (const row of rows) row[column.name] = null
      continue
    }
    // A relation holds this row's id; anything else holds a value equal to this row's `on`. A list
    // (relation or multi_select) counts its row toward every row it names.
    const viaColumn = fetched.spec.columns.find((each) => each.name === rollup.via)
    const isList = viaColumn ? ARRAY_COLUMN_TYPES.has(viaColumn.type) : false
    const on = viaColumn?.type === 'relation' ? 'id' : (rollup.on ?? firstText)

    const buckets = new Map<string, Scalar[]>()
    for (const target of fetched.rows) {
      const cell = target[rollup.via]
      const keys = isList ? (Array.isArray(cell) ? cell.map(String) : []) : [String(cell ?? '')]
      const value = (rollup.column ? target[rollup.column] : null) as Scalar
      for (const key of keys) buckets.set(key, [...(buckets.get(key) ?? []), value])
    }
    for (const row of rows) {
      const key = String(row[on] ?? '')
      row[column.name] = aggregate(buckets.get(key) ?? [], rollup.fn)
    }
  }
}
