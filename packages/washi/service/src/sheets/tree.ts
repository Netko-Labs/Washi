import {
  ancestorIds,
  getSheet,
  indexSheet,
  moveSheet,
  restoreSheet,
  type Workspace,
} from '@washi/repository'
import { extractRefs, extractText, parse } from '@washi/wsx'
import { requireSheet } from './service'

export class SheetMoveError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SheetMoveError'
  }
}

/** Moves a page under `parentId` (null is the top level) at `index` among its siblings. */
export function moveSheetTo(
  ws: Workspace,
  id: string,
  parentId: string | null,
  index: number,
): void {
  requireSheet(ws, id)
  if (parentId) {
    requireSheet(ws, parentId)
    if (ancestorIds(ws, parentId).includes(id)) {
      throw new SheetMoveError('a page cannot move inside itself')
    }
  }
  if (!moveSheet(ws, id, parentId, index)) throw new Error(`sheet not found: ${id}`)
}

/** Restores a trashed page with its sub-pages, and puts them back in search and backlinks. */
export function restoreSheetTree(ws: Workspace, id: string): string[] {
  const ids = restoreSheet(ws, id)
  if (ids.length === 0) throw new Error(`no trashed page: ${id}`)
  for (const each of ids) {
    const sheet = getSheet(ws, each)
    if (!sheet) continue
    const root = parse(sheet.source)
    indexSheet(ws, each, sheet.title, { body: extractText(root), refs: extractRefs(root) })
  }
  return ids
}
