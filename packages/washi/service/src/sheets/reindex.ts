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

const REINDEXED = 'index_links_files'

/**
 * Once per workspace: pages written before PageLink, Include and block uploads were indexed carry
 * links and files the index never saw. Read every live page again so backlinks and purges count them.
 */
export function reindexPages(ws: Workspace): void {
  if (getAppMeta(ws, REINDEXED)) return
  for (const { id } of listSheets(ws)) {
    const sheet = getSheet(ws, id)
    if (!sheet) continue
    try {
      indexSheet(ws, id, sheet.title, indexOf(parse(sheet.source)))
    } catch {
      // A page that no longer parses keeps the index it had.
    }
  }
  setAppMeta(ws, REINDEXED, '1')
}
