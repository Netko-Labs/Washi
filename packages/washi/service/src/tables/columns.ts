import { type ColumnChange, changedSpec, rowPatch, type TableSpec } from '@washi/ink'
import {
  executeQuery,
  formulaFunctions,
  getTableByName,
  listReminders,
  listTables,
  updateRecords,
  type Workspace,
} from '@washi/repository'
import { InkError } from './errors'
import { checkFormulas } from './rules'
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

/**
 * The formula check over the changed spec, run before anything is written. A refusal over the
 * column that went (`total: unknown identifier \`qty\``) is said in a person's words; any other
 * refusal stays as the check said it.
 */
function checkFormulasAfter(ws: Workspace, spec: TableSpec, name: string): void {
  try {
    checkFormulas(
      spec,
      formulaFunctions(ws).map((formula) => formula.name),
    )
  } catch (cause) {
    const message = cause instanceof InkError ? cause.message : ''
    const formula = spec.columns.find(
      (each) => each.type === 'formula' && message.startsWith(`${each.name}: `),
    )
    if (formula && message.includes(`\`${name}\``)) {
      throw new InkError(`The formula “${formula.name}” reads “${name}” — change it first.`)
    }
    throw cause
  }
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

  if (change.kind !== 'option') checkFormulasAfter(ws, next.spec, column.name)

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
}
