import type { Viewer } from '@washi/domain'
import {
  accessRows,
  getTableByName,
  listTables,
  pagesShowingTables,
  tableStats,
  type Workspace,
} from '@washi/repository'
import { readablePages, trashUserTable } from './catalog'
import { InkError } from './errors'
import type { TrashedByAgent } from './types'

const quoted = (names: string[]) => names.map((name) => `“${name}”`).join(', ')

/** Tables that break without `name`: a relation pointing at it, or a rollup over its rows. */
function dependantsOf(ws: Workspace, name: string): string[] {
  return listTables(ws)
    .filter(
      (table) =>
        table.name !== name &&
        table.spec.columns.some(
          (column) =>
            (column.type === 'relation' && column.table === name) || column.rollup?.table === name,
        ),
    )
    .map((table) => table.name)
}

/**
 * Washi trashes a table only for a person asking (D121, A2): never in a routine, never one a
 * public link draws, never one another table still reads.
 */
export function guardWashiTableTrash(ws: Workspace, name: string, viewer: Viewer): void {
  if (viewer.id === null) {
    throw new InkError('A routine cannot move tables to the trash; only a person asking can.')
  }
  const isPublic = new Set(
    accessRows(ws)
      .filter((page) => page.visibility === 'public')
      .map((page) => page.id),
  )
  const shared = (pagesShowingTables(ws).get(name) ?? []).filter((page) => isPublic.has(page.id))
  if (shared.length > 0) {
    throw new InkError(
      `“${name}” shows on ${quoted(shared.map((page) => page.title))}, on a public link: only a person moves it to the trash.`,
    )
  }
  const dependants = dependantsOf(ws, name)
  if (dependants.length > 0) {
    throw new InkError(
      `${quoted(dependants)} still read “${name}” through a relation or rollup: only a person moves it to the trash.`,
    )
  }
}

/** An agent's trash: a member's `tables.trash`, by name — rows and history wait, restorable. */
export function trashTableAs(
  ws: Workspace,
  name: string,
  viewer: Viewer,
  isWashi: boolean,
): TrashedByAgent {
  const table = getTableByName(ws, name)
  if (!table) throw new InkError(`unknown table "${name}"`)
  if (isWashi) guardWashiTableTrash(ws, name, viewer)
  const shownOn = readablePages(ws, viewer)(name).map((page) => page.title)
  const rows = tableStats(ws).get(table.id)?.rows ?? 0
  trashUserTable(ws, table.id)
  return { id: table.id, name, rows, shownOn }
}
