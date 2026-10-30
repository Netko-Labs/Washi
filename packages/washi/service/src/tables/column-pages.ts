import type { TablePage, Viewer } from '@washi/domain'
import { namesColumn } from '@washi/paper/registry'
import { getSheet, pagesShowingTables, type Workspace } from '@washi/repository'
import { parse } from '@washi/wsx'
import { readableSet } from '../sheets/access'

/** The pages this viewer reads whose views over `table` name `column` — what a rename leaves. */
export function pagesNamingColumn(
  ws: Workspace,
  viewer: Viewer,
  table: string,
  column: string,
): TablePage[] {
  const readable = readableSet(ws, viewer)
  return (pagesShowingTables(ws).get(table) ?? []).filter((page) => {
    if (!readable.has(page.id)) return false
    const source = getSheet(ws, page.id)?.source
    if (!source) return false
    try {
      return namesColumn(parse(source), table, column)
    } catch {
      return false
    }
  })
}
