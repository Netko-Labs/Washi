import type { TableCatalogEntry, TablePage, TrashedTable, UserTable, Viewer } from '@washi/domain'
import {
  listTables,
  listTrashedTables,
  pagesShowingTables,
  purgeTable,
  restoreTable,
  tableStats,
  trashTable,
  type Workspace,
} from '@washi/repository'
import { readableSet } from '../sheets/access'
import { InkError } from './errors'

/** Each table's pages that show it, as this viewer may read them: a private page is not there. */
export function readablePages(ws: Workspace, viewer: Viewer): (table: string) => TablePage[] {
  const readable = readableSet(ws, viewer)
  const shown = pagesShowingTables(ws)
  return (table) => (shown.get(table) ?? []).filter((page) => readable.has(page.id))
}

/** Every live table, what it holds, and where it shows (D109). */
export function tableCatalog(ws: Workspace, viewer: Viewer): TableCatalogEntry[] {
  const pagesOf = readablePages(ws, viewer)
  const stats = tableStats(ws)
  return listTables(ws)
    .map((table) => ({
      id: table.id,
      name: table.name,
      rows: stats.get(table.id)?.rows ?? 0,
      columns: table.spec.columns.length,
      updated: stats.get(table.id)?.updated || table.hlcUpdated,
      pages: pagesOf(table.name),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Tables as Washi lists them: their specs, and the pages that show each — none is a stray. */
export function tablesWithPages(
  ws: Workspace,
  viewer: Viewer,
): (UserTable & { shownOn: TablePage[] })[] {
  const pagesOf = readablePages(ws, viewer)
  return listTables(ws).map((table) => ({ ...table, shownOn: pagesOf(table.name) }))
}

export function trashedTables(ws: Workspace): TrashedTable[] {
  return listTrashedTables(ws)
}

export function trashUserTable(ws: Workspace, id: string): void {
  if (!trashTable(ws, id)) throw new InkError('that table is gone already')
}

export function restoreUserTable(ws: Workspace, id: string): void {
  if (!restoreTable(ws, id)) throw new InkError('that table is not in the Trash')
}

export function purgeUserTable(ws: Workspace, id: string): void {
  if (!purgeTable(ws, id)) throw new InkError('that table is not in the Trash')
}
