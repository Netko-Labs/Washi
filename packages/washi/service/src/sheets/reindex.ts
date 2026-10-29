import {
  getAppMeta,
  getSheet,
  indexSheet,
  listSheets,
  setAppMeta,
  type Workspace,
} from '@washi/repository'
import { parse } from '@washi/wsx'
import { indexOf } from './service'

const REINDEXED = 'index_tables'

/**
 * Once per workspace: pages written before an index existed (links, files, the tables they show)
 * carry what it never saw. Read every live page again so backlinks, purges and the catalog count them.
 */
export function reindexPages(ws: Workspace): void {
  if (getAppMeta(ws, REINDEXED)) return
  for (const { id } of listSheets(ws)) {
    const sheet = getSheet(ws, id)
    if (!sheet) continue
    let root: ReturnType<typeof parse>
    try {
      root = parse(sheet.source)
    } catch {
      // A page that no longer parses keeps the index it had.
      continue
    }
    // A failed write throws and leaves the flag unset, so the next open tries every page again.
    indexSheet(ws, id, sheet.title, indexOf(root))
  }
  setAppMeta(ws, REINDEXED, '1')
}
