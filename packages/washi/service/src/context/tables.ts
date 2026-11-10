import type { TablePage, Viewer } from '@washi/domain'
import type { ColumnSpec } from '@washi/ink'
import { listTables, tableStats, type Workspace } from '@washi/repository'
import { readablePages } from '../tables/catalog'
import { runQuery } from '../tables/service'
import type { TableDigest } from './types'
import { cell } from './utils'
import { CELL_CHARS, KEY_TYPES, ROWS_READ, TITLE_CHARS, WHOLE_TABLE_ROWS } from './values'

type Row = Record<string, unknown> & { id: string }

/** A status column's values in its own order, and those that mean done. */
function stepsOf(column: ColumnSpec) {
  const groups = column.groups ?? { todo: [], doing: [], done: [] }
  const order = column.options ?? [...groups.todo, ...groups.doing, ...groups.done]
  return { order, done: new Set(groups.done) }
}

/** A column's type; a status says which values mean done (its counts line lists the rest). */
const typeWords = (column: ColumnSpec) => {
  if (column.type === 'status' && column.groups) {
    return `status (done: ${column.groups.done.join(', ') || '—'})`
  }
  if (column.type === 'multi_select' && column.options?.length) {
    return `multi_select (${column.options.join(', ')})`
  }
  if (column.type === 'relation' && column.table) return `relation → ${column.table}`
  return column.type
}

/** How many rows hold each value of a status or select column, in the column's own order. */
function valueCounts(ws: Workspace, table: string, column: ColumnSpec): string {
  const counted = runQuery(ws, {
    table,
    groupBy: { column: column.name, aggregates: [{ fn: 'count' }] },
  })
  const counts = new Map(counted.rows.map((row) => [row[column.name], Number(row.count)]))
  const order = column.type === 'status' ? stepsOf(column).order : (column.options ?? [])
  const rest = [...counts.keys()].filter((value) => !order.includes(value as string))
  // Every option is said, a zero too: it is how a reader learns the values a cell may take.
  return [...order, ...rest]
    .map((value) => `${value ?? 'empty'} ${counts.get(value) ?? 0}`)
    .join(' · ')
}

/** The columns a row line keeps: the title and what the work is sorted by; a whole table, all. */
function keyColumns(columns: ColumnSpec[], whole: boolean): ColumnSpec[] {
  const title = columns.find((column) => column.type === 'text')
  return columns.filter((column) =>
    column === title || whole ? column.type !== 'relation' : KEY_TYPES.has(column.type),
  )
}

/** A row as one line, its columns in order, the title kept nearly whole. */
const rowLine = (columns: ColumnSpec[], row: Row) =>
  `- ${columns.map((column, at) => cell(row[column.name], at === 0 ? TITLE_CHARS : CELL_CHARS) || '—').join(' · ')}`

/**
 * Rows as lines, the columns named once — under a heading per value of `by` when given (a status),
 * so that value is said once, not on every line.
 */
function rowLines(columns: ColumnSpec[], rows: Row[], by?: ColumnSpec): string {
  const shown = by ? columns.filter((column) => column !== by) : columns
  const head = `Each row: ${shown.map((column) => column.name).join(' · ')}`
  if (!by) return [head, ...rows.map((row) => rowLine(shown, row))].join('\n')
  const groups = new Map<string, Row[]>()
  for (const row of rows) {
    const value = String(row[by.name] ?? 'empty')
    groups.set(value, [...(groups.get(value) ?? []), row])
  }
  const lines = [...groups].flatMap(([value, group]) => [
    `**${value}** (${group.length})`,
    ...group.map((row) => rowLine(shown, row)),
  ])
  return [head, ...lines].join('\n')
}

function rowsOf(
  ws: Workspace,
  name: string,
  columns: ColumnSpec[],
  count: number,
  wanted: boolean,
): { rows: string | null; fetch: string } {
  const status = columns.find((column) => column.type === 'status')
  const fetchAll = `db_query { "table": "${name}" }`
  const whole = count <= WHOLE_TABLE_ROWS
  if (count === 0 || (!wanted && !whole)) return { rows: null, fetch: fetchAll }
  const read: Row[] = runQuery(ws, { table: name, limit: ROWS_READ }).rows.map((row) => ({
    ...row,
    id: String(row.id),
  }))
  if (whole) {
    const kept = keyColumns(columns, true)
    return {
      rows: `All ${read.length} rows (ids by ${fetchAll}):\n\n${rowLines(kept, read)}`,
      fetch: fetchAll,
    }
  }
  if (!status) return { rows: null, fetch: fetchAll }
  const { order, done } = stepsOf(status)
  const rank = (row: Row) => {
    const at = order.indexOf(row[status.name] as string)
    return at === -1 ? order.length : at
  }
  const open = read
    .filter((row) => !done.has(row[status.name] as string))
    .sort((a, b) => rank(a) - rank(b))
  const kept = keyColumns(columns, false)
  const left = columns.filter((column) => !kept.includes(column)).map((column) => column.name)
  const fetch = `db_query { "table": "${name}", "where": [{ "column": "${status.name}", "op": "in", "value": [${order
    .filter((value) => !done.has(value))
    .map((value) => JSON.stringify(value))
    .join(', ')}] }] }`
  if (open.length === 0) return { rows: 'No open rows.', fetch }
  const leftWords = left.length ? `; ${left.join(', ')} and each row's id by` : '; ids by'
  return {
    rows: `Open rows (${open.length} of ${count}, ${status.name} not ${[...done].join('/') || 'done'}${leftWords} ${fetch}):\n\n${rowLines(kept, open, status)}`,
    fetch,
  }
}

/**
 * Each table as the digest says it: columns and types, how many rows, the counts per status and
 * select value, where it shows — and the rows still open, for the tables asked for (or every table
 * with a status); a table of a dozen rows or fewer is listed whole.
 */
export function tableDigests(
  ws: Workspace,
  viewer: Viewer,
  wanted: string[] | undefined,
): { name: string; digest: TableDigest }[] {
  const pagesOf = readablePages(ws, viewer)
  const stats = tableStats(ws)
  return listTables(ws).map((table) => {
    const { name, spec } = table
    const count = stats.get(table.id)?.rows ?? 0
    const shown: TablePage[] = pagesOf(name)
    const counts = spec.columns
      .filter((column) => column.type === 'status' || column.type === 'select')
      .map((column) => `- ${column.name}: ${valueCounts(ws, name, column)}`)
    const hasStatus = spec.columns.some((column) => column.type === 'status')
    const isWanted = wanted ? wanted.includes(name) : hasStatus
    const { rows, fetch } = rowsOf(ws, name, spec.columns, count, isWanted)
    const summary = [
      `### \`${name}\` — ${count} row${count === 1 ? '' : 's'}${shown.length ? `, shown on ${shown.map((page) => page.title).join(', ')}` : ', on no page'}`,
      `Columns: ${spec.columns.map((column) => `${column.name} ${typeWords(column)}`).join(' · ')}`,
      ...counts,
    ].join('\n')
    return { name, digest: { summary, rows, rowsFetch: fetch } }
  })
}
