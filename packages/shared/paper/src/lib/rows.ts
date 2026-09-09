import type { WsxValue } from '@washi/wsx'
import type { Row } from './types'

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
