import type { QueryRow } from '@washi/ink'
import type { WsxValue } from '@washi/wsx'
import type { CellKind, Row } from './types'

/** Pages speak scalars: a list cell (labels, related ids) reads as its items, comma-joined. */
export function toRows(rows: QueryRow[]): Row[] {
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, cell]) => [key, Array.isArray(cell) ? cell.join(', ') : cell]),
    ),
  )
}

/** A column holding `kind` in any row, preferred names first; a null in row one doesn't hide it. */
export function columnOf(rows: Row[], kind: CellKind, prefer: string[] = []): string | undefined {
  const holds = (key: string) => rows.some((row) => typeof row[key] === kind)
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))]
  return prefer.find(holds) ?? keys.find((key) => key !== 'id' && holds(key))
}

const ROW_REF = /\$row\.([a-z_][a-z0-9_]*)/gi

/** `$row.column` in a string resolves against the row in scope. */
export function resolveRow(value: string, row: Row | undefined): string {
  if (!row || !value.includes('$row.')) return value
  return value.replace(ROW_REF, (_, column: string) => String(row[column] ?? ''))
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
