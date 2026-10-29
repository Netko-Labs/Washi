import type { QueryRow, Scalar } from '@washi/ink'
import type { WsxValue } from '@washi/wsx'
import type { CellKind, Row } from './types'

// Each row's list cells as they arrived, so a view that pills them never re-splits the words.
const lists = new WeakMap<Row, Record<string, string[]>>()

/** Pages speak scalars: a list cell (labels, related ids) reads as its items, comma-joined. */
export function toRows(rows: QueryRow[]): Row[] {
  return rows.map((raw) => {
    const row: Row = {}
    const items: Record<string, string[]> = {}
    for (const [key, cell] of Object.entries(raw)) {
      if (Array.isArray(cell)) items[key] = cell.map(String)
      row[key] = Array.isArray(cell) ? cell.join(', ') : cell
    }
    if (Object.keys(items).length > 0) lists.set(row, items)
    return row
  })
}

/** What a cell holds, one item per pill: a list's items, a value alone, or nothing. */
export function cellItems(row: Row, column: string): Scalar[] {
  const value = row[column]
  return listCell(row, column) ?? (value === null || value === undefined ? [] : [value])
}

/** A row with some cells changed, its list cells still known. */
export function patchRow(row: Row, patch: Row): Row {
  const next = { ...row, ...patch }
  const items = lists.get(row)
  if (items) lists.set(next, items)
  return next
}

/** The items a list cell held before `toRows` joined them; none for a scalar. */
export function listCell(row: Row, column: string): string[] | undefined {
  return lists.get(row)?.[column]
}

/** A column holding `kind` in any row, preferred names first; a null in row one doesn't hide it. */
export function columnOf(rows: Row[], kind: CellKind, prefer: string[] = []): string | undefined {
  const holds = (key: string) => rows.some((row) => typeof row[key] === kind)
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))]
  return prefer.find(holds) ?? keys.find((key) => key !== 'id' && holds(key))
}

const ROW_REF = /\$row\.([a-z_][a-z0-9_]*)/gi

/**
 * `$row.column` in a string resolves against the row in scope — as words through `shown` when it
 * is text a reader sees, raw when it rides in an action.
 */
export function resolveRow(
  value: string,
  row: Row | undefined,
  shown: (cell: unknown) => string = (cell) => String(cell ?? ''),
): string {
  if (!row || !value.includes('$row.')) return value
  return value.replace(ROW_REF, (_, column: string) => shown(row[column]))
}

/** The same, through arrays and objects — verbs carry `$row.id` in their payload. */
export function resolveRowDeep(value: WsxValue, row: Row): WsxValue {
  if (typeof value === 'string') return resolveRow(value, row)
  if (Array.isArray(value)) return value.map((item) => resolveRowDeep(item, row))
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolveRowDeep(item, row)]),
    )
  }
  return value
}

/** Event args a component supplies (`$group`, `$value`, `$now`) — pages never compute them. */
export function resolveArgs(value: WsxValue, args: Record<string, string>): WsxValue {
  if (typeof value === 'string') {
    return Object.entries(args).reduce((out, [name, arg]) => out.replaceAll(name, arg), value)
  }
  if (Array.isArray(value)) return value.map((item) => resolveArgs(item, args))
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolveArgs(item, args)]),
    )
  }
  return value
}
