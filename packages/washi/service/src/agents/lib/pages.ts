import type { Viewer } from '@washi/domain'
import {
  getBacklinks,
  getSheet,
  listSheets,
  searchSheets,
  sheetVersion,
  type Workspace,
} from '@washi/repository'
import { canRead, readableSet, requireReadable } from '../../sheets/access'

/**
 * Washi reads as the person who asked (D65): a page they cannot open does not exist for the
 * turn — not in the list, not in search, not by id. A routine asks as nobody: workspace pages.
 */
export function pagesFor(ws: Workspace, viewer: Viewer) {
  const visible = <T extends { id: string }>(rows: T[]) => {
    const readable = readableSet(ws, viewer)
    return rows.filter((row) => readable.has(row.id))
  }
  return {
    list: () => visible(listSheets(ws)),
    get: (id: string) => {
      const sheet = canRead(ws, id, viewer) ? getSheet(ws, id) : null
      return sheet ? { ...sheet, version: sheetVersion(ws, id) } : null
    },
    backlinks: (id: string) => {
      requireReadable(ws, id, viewer)
      return visible(getBacklinks(ws, id))
    },
    search: (term: string) => visible(searchSheets(ws, term)),
    require: (id: string) => requireReadable(ws, id, viewer),
  }
}
