import { type ColumnChange, changedSpec, rowPatch, type TableSpec } from '@washi/ink'
import {
  executeQuery,
  getTableByName,
  listReminders,
  listTables,
  updateRecords,
  type Workspace,
} from '@washi/repository'
import { InkError } from './errors'
import { defineUserTable } from './service'
import type { ColumnChangeResult } from './types'

const ALL_ROWS = 100_000

/** What reads `column` of `table` from beyond its own spec: rollups (any table's), reminders. */
function readersOf(ws: Workspace, table: string, column: string): string[] {
  const rollups = listTables(ws).flatMap(({ spec }) =>
    spec.columns.flatMap((each) => {
      const rollup = each.rollup
      const reads =
        rollup?.table === table &&
        (rollup.via === column ||
          rollup.column === column ||
          (rollup.where ?? []).some((filter) => filter.column === column))
      return reads ? [`the rollup “${each.name}” on ${spec.name}`] : []
    }),
  )
  const reminders = listReminders(ws).flatMap((reminder) =>
    reminder.table === table &&
    (reminder.dateColumn === column ||
      reminder.personColumn === column ||
      reminder.where.some((filter) => filter.column === column))
      ? [`the reminder “${reminder.title}”`]
      : [],
  )
  return [...rollups, ...reminders]
}

/** The formula the spec check refused over, in a person's words; names are snake_case words. */
function formulaReading(spec: TableSpec, name: string): string | undefined {
  const word = new RegExp(`\\b${name}\\b`)
  return spec.columns.find(
    (each) => each.type === 'formula' && each.name !== name && word.test(each.expr ?? ''),
  )?.name
}

/**
 * A property renamed, deleted or given other options from its column menu: the spec is redefined
 * (so a formula that reads a renamed name refuses it), and the stored values that must follow are
 * rewritten through `updateRecords` — history keeps what they were. One transaction.
 */
export function changeColumn(
  ws: Workspace,
  change: ColumnChange,
  author: string | null = null,
): ColumnChangeResult {
  const table = getTableByName(ws, change.table)
  if (!table) throw new InkError(`unknown table "${change.table}"`)
  const next = changedSpec(table.spec, change)
  if (!next.ok) throw new InkError(next.error)
  const column = table.spec.columns.find((each) => each.name === change.column)
  if (!column || next.spec === table.spec) return { moved: 0 }

  if (change.kind !== 'option') {
    const readers = readersOf(ws, table.name, column.name)
    if (readers.length > 0) {
      throw new InkError(`${readers.join(' and ')} reads “${column.name}” — change that first.`)
    }
  }

  const rows = executeQuery(ws, table.id, table.spec, { table: table.name, limit: ALL_ROWS }).rows
  if (rows.length >= ALL_ROWS) {
    throw new InkError(`too many rows to change in one step (${ALL_ROWS} or more); nothing changed`)
  }

  try {
    return ws.sqlite.transaction(() => {
      defineUserTable(ws, next.spec)
      let moved = 0
      for (const row of rows) {
        const patch = rowPatch(column, change, row)
        if (!patch) continue
        moved += updateRecords(ws, table.id, [String(row.id)], patch, author)
      }
      return { moved }
    })()
  } catch (cause) {
    const formula = change.kind === 'option' ? undefined : formulaReading(table.spec, column.name)
    if (cause instanceof InkError && formula) {
      throw new InkError(`The formula “${formula}” reads “${column.name}” — change it first.`)
    }
    throw cause
  }
}
