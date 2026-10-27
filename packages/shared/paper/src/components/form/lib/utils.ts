import { ARRAY_COLUMN_TYPES, type TableSpec } from '@washi/ink'
import { isRank } from '../../database'
import type { Cell, ColumnSpec, FormDefault, FormEntries, FormPlan, SheetStateValue } from './types'

const isComputed = (column: ColumnSpec) => column.type === 'formula' || column.type === 'rollup'

/**
 * Named fields in their order, or every stored column but a board's rank. Defaults for columns
 * not shown are written too. Unknown and computed names are refused in ink's own words.
 */
export function formPlan(
  spec: TableSpec,
  fields?: string[],
  defaults?: Record<string, FormDefault>,
): FormPlan {
  const columns = new Map(spec.columns.map((column) => [column.name, column]))
  const refused: string[] = []
  const writable = (name: string): ColumnSpec[] => {
    const column = columns.get(name)
    if (!column) {
      refused.push(`“${name}” is not a column of “${spec.name}”`)
      return []
    }
    if (isComputed(column)) {
      const from = column.type === 'formula' ? 'its formula' : 'the rows it rolls up'
      refused.push(`“${name}” is computed from ${from}; a form writes its inputs`)
      return []
    }
    return [column]
  }
  const shown = fields
    ? fields.flatMap(writable)
    : spec.columns.filter((column) => !isComputed(column) && !isRank(column))
  const hidden = Object.keys(defaults ?? {})
    .filter((name) => !shown.some((column) => column.name === name))
    .flatMap(writable)
  return { fields: shown, written: [...shown, ...hidden], refused }
}

/** A `{ state }` default reads the page; unset, empty or null state leaves the column alone. */
export function resolveDefaults(
  defaults: Record<string, FormDefault> | undefined,
  values: Record<string, SheetStateValue>,
): Record<string, Cell> {
  const resolved: Record<string, Cell> = {}
  for (const [name, value] of Object.entries(defaults ?? {})) {
    const read =
      value !== null && typeof value === 'object' && !Array.isArray(value)
        ? values[value.state]
        : value
    if (read !== undefined && read !== null && read !== '') resolved[name] = read
  }
  return resolved
}

/** What an input holds, as the column stores it; empty is left out. A bad number reaches ink. */
export function cellOf(column: ColumnSpec, value: Cell | undefined): Cell | undefined {
  if (value === undefined || value === null) return undefined
  if (ARRAY_COLUMN_TYPES.has(column.type)) {
    const list = Array.isArray(value) ? value : [String(value)]
    return list.length > 0 ? list : undefined
  }
  if (Array.isArray(value)) return value
  if (column.type === 'boolean') return value === true || value === 'true'
  const text = typeof value === 'string' ? value.trim() : value
  if (text === '') return undefined
  if (column.type === 'number' && typeof text === 'string') {
    const number = Number(text)
    return Number.isFinite(number) ? number : text
  }
  return typeof text === 'string' || column.type === 'number' ? text : String(text)
}

export function rowOf(written: ColumnSpec[], values: Record<string, Cell>): Record<string, Cell> {
  const row: Record<string, Cell> = {}
  for (const column of written) {
    const cell = cellOf(column, values[column.name])
    if (cell !== undefined) row[column.name] = cell
  }
  return row
}

/** Something typed, ticked or picked — defaults alone never make a row worth adding. */
export function hasEntries(entries: FormEntries): boolean {
  return Object.values(entries).some((value) =>
    Array.isArray(value)
      ? value.length > 0
      : typeof value === 'string'
        ? value.trim() !== ''
        : value !== null && value !== false,
  )
}

export function reasonOf(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause)
}
