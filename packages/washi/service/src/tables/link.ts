import type { LinkColumnInput } from '@washi/domain'
import type { Cell } from '@washi/ink'
import {
  executeQuery,
  getTableByName,
  insertRecord,
  updateRecords,
  type Workspace,
} from '@washi/repository'
import { InkError } from './errors'
import { defineUserTable } from './service'
import type { LinkColumnResult } from './types'

const LINKABLE = new Set(['text', 'select', 'multi_select'])
const ALL_ROWS = 100_000
const SHOWN_UNMATCHED = 10

const keyOf = (value: string) => value.trim().toLowerCase()

/**
 * A choice column becomes a relation to `target`: each value names the target row whose `on`
 * column reads the same (case and spaces aside), and the cell holds that row's id from then on —
 * so renaming the target renames it everywhere. Unmatched values are created when `create`, and
 * otherwise refused, listed. One transaction: the column changes with every row or not at all.
 */
export function linkColumn(ws: Workspace, input: LinkColumnInput): LinkColumnResult {
  const source = getTableByName(ws, input.table)
  if (!source) throw new InkError(`unknown table "${input.table}"`)
  const column = source.spec.columns.find((each) => each.name === input.column)
  if (!column) throw new InkError(`"${input.table}" has no column "${input.column}"`)
  if (!LINKABLE.has(column.type)) {
    throw new InkError(
      `"${column.name}" is ${column.type}; only text, select and multi_select link`,
    )
  }
  const target = getTableByName(ws, input.target)
  if (!target) throw new InkError(`unknown table "${input.target}"`)
  const on = input.on ?? target.spec.columns.find((each) => each.type === 'text')?.name
  const onColumn = target.spec.columns.find((each) => each.name === on)
  if (!on || !onColumn || onColumn.type !== 'text') {
    throw new InkError(`"${input.target}" needs a text column to match names on`)
  }

  const ids = new Map<string, string>()
  for (const row of executeQuery(ws, target.id, target.spec, {
    table: target.name,
    limit: ALL_ROWS,
  }).rows) {
    const name = row[on]
    if (typeof name === 'string' && !ids.has(keyOf(name))) ids.set(keyOf(name), String(row.id))
  }
  const rows = executeQuery(ws, source.id, source.spec, {
    table: source.name,
    limit: ALL_ROWS,
  }).rows
  const valuesOf = (cell: Cell | undefined) =>
    (Array.isArray(cell) ? cell : [cell]).filter(
      (value): value is string => typeof value === 'string' && value.trim() !== '',
    )
  const unmatched = [
    ...new Set(
      rows.flatMap((row) => valuesOf(row[column.name])).filter((value) => !ids.has(keyOf(value))),
    ),
  ]
  if (unmatched.length > 0 && !input.create) {
    const shown = unmatched
      .slice(0, SHOWN_UNMATCHED)
      .map((value) => `"${value}"`)
      .join(', ')
    throw new InkError(
      `no ${input.target} row is named ${shown}${unmatched.length > SHOWN_UNMATCHED ? ', …' : ''} — create them, or pass create`,
    )
  }

  return ws.sqlite.transaction(() => {
    for (const value of unmatched)
      ids.set(keyOf(value), insertRecord(ws, target.id, { [on]: value.trim() }))
    defineUserTable(ws, {
      ...source.spec,
      columns: source.spec.columns.map((each) =>
        each.name === column.name
          ? { name: column.name, type: 'relation', table: target.name }
          : each,
      ),
    })
    for (const row of rows) {
      const linked = [
        ...new Set(valuesOf(row[column.name]).map((value) => ids.get(keyOf(value)) ?? '')),
      ]
      updateRecords(ws, source.id, [String(row.id)], { [column.name]: linked.filter(Boolean) })
    }
    return { linked: rows.length, created: unmatched }
  })()
}
