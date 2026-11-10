import type { ColumnSpec } from '@washi/ink'
import type { Workspace } from '@washi/repository'
import { runQuery } from '../tables/service'
import type { ContextRow, RowsText } from './types'
import { cell } from './utils'
import { CELL_CHARS, KEY_TYPES, OPEN_ROWS_READ, TITLE_CHARS, WHOLE_TABLE_ROWS } from './values'

/** A status column's values in its own order, and those that mean done. */
export function stepsOf(column: ColumnSpec) {
  const groups = column.groups ?? { todo: [], doing: [], done: [] }
  const order = column.options ?? [...groups.todo, ...groups.doing, ...groups.done]
  return { order, done: new Set(groups.done) }
}

/** How many rows hold each value of a column — `null` for an empty cell. */
export function countsOf(ws: Workspace, table: string, column: string): Map<unknown, number> {
  const counted = runQuery(ws, { table, groupBy: { column, aggregates: [{ fn: 'count' }] } })
  return new Map(counted.rows.map((row) => [row[column] ?? null, Number(row.count)]))
}

/** The columns a row line keeps: the title and what the work is sorted by; a whole table, all. */
function keyColumns(columns: ColumnSpec[], whole: boolean): ColumnSpec[] {
  const title = columns.find((column) => column.type === 'text')
  return columns.filter((column) =>
    column === title || whole ? column.type !== 'relation' : KEY_TYPES.has(column.type),
  )
}

const rowLine = (columns: ColumnSpec[], row: ContextRow) =>
  `- ${columns.map((column, at) => cell(row[column.name], at === 0 ? TITLE_CHARS : CELL_CHARS) || '—').join(' · ')}`

/**
 * Rows as lines, the columns named once — under a heading per value of `by` when given (a status),
 * so that value is said once, not on every line.
 */
function rowLines(
  columns: ColumnSpec[],
  rows: ContextRow[],
  by?: ColumnSpec,
  counts?: Map<unknown, number>,
) {
  const shown = by ? columns.filter((column) => column !== by) : columns
  const head = `Each row: ${shown.map((column) => column.name).join(' · ')}`
  if (!by) return [head, ...rows.map((row) => rowLine(shown, row))].join('\n')
  const groups = new Map<unknown, ContextRow[]>()
  for (const row of rows) {
    const value = row[by.name] ?? null
    groups.set(value, [...(groups.get(value) ?? []), row])
  }
  const lines = [...groups].flatMap(([value, group]) => [
    `**${value ?? 'empty'}** (${counts?.get(value) ?? group.length})`,
    ...group.map((row) => rowLine(shown, row)),
  ])
  return [head, ...lines].join('\n')
}

const asRows = (rows: Record<string, unknown>[]): ContextRow[] =>
  rows.map((row) => ({ ...row, id: String(row.id) }))

/**
 * What a table shows of its rows: all of a table of a dozen or fewer; else, for a table asked for
 * (or any with a status), its open rows — those whose status is outside the done group, empty
 * included — read by that very filter, newest first, then laid out in the status's own order. The
 * open total comes off the counts, so a table of any size says it right.
 */
export function rowsOf(
  ws: Workspace,
  name: string,
  columns: ColumnSpec[],
  count: number,
  wanted: boolean,
): RowsText {
  const status = columns.find((column) => column.type === 'status')
  const fetchAll = `db_query { "table": "${name}" }`
  if (count === 0) return { text: null, fetch: fetchAll }
  if (count <= WHOLE_TABLE_ROWS) {
    const read = asRows(runQuery(ws, { table: name, limit: WHOLE_TABLE_ROWS }).rows)
    return {
      text: `All ${read.length} rows (ids by ${fetchAll}):\n\n${rowLines(keyColumns(columns, true), read)}`,
      fetch: fetchAll,
    }
  }
  if (!wanted || !status) return { text: null, fetch: fetchAll }
  const { order, done } = stepsOf(status)
  const counts = countsOf(ws, name, status.name)
  const openValues = [...new Set([...order, ...counts.keys()])].filter(
    (value) => !done.has(value as string),
  ) as (string | null)[]
  const total = openValues.reduce((sum, value) => sum + (counts.get(value) ?? 0), 0)
  const where = [{ column: status.name, op: 'in' as const, value: openValues }]
  const fetch = `db_query ${JSON.stringify({ table: name, where })}`
  if (total === 0) return { text: 'No open rows.', fetch }
  const read = asRows(
    runQuery(ws, {
      table: name,
      where,
      orderBy: { column: 'id', direction: 'desc' },
      limit: OPEN_ROWS_READ,
    }).rows,
  )
  const rank = (row: ContextRow) => {
    const at = order.indexOf(row[status.name] as string)
    return at === -1 ? order.length : at
  }
  const open = read.sort((a, b) => rank(a) - rank(b))
  const kept = keyColumns(columns, false)
  const left = columns.filter((column) => !kept.includes(column)).map((column) => column.name)
  const leftWords = left.length ? `; ${left.join(', ')} and each row's id by` : '; ids by'
  const shown = open.length < total ? `, the newest ${open.length} here` : ''
  const lines = rowLines(kept, open, status, counts)
  return {
    text: `Open rows (${total} of ${count}${shown}, newest first; ${status.name} not ${[...done].join('/') || 'done'}${leftWords} ${fetch}):\n\n${lines}`,
    fetch,
    unshown: total - open.length,
  }
}
