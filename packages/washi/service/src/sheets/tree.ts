import type { SheetDetail } from '@washi/domain'
import {
  ancestorIds,
  getSheet,
  indexSheet,
  listSheets,
  moveSheet,
  restoreSheet,
  updateSheetMeta,
  type Workspace,
} from '@washi/repository'
import { extractRefs, extractText, parse } from '@washi/wsx'
import { createSheetFromSource, requireSheet } from './service'

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

/** A copy right below the original, with its look; the pages inside it are not copied. */
export function duplicateSheet(ws: Workspace, id: string): SheetDetail {
  const original = requireSheet(ws, id)
  const copy = createSheetFromSource(
    ws,
    {
      title: `${original.title} (copy)`.slice(0, 200),
      icon: original.icon,
      tags: original.tags,
      source: original.source,
    },
    original.parentId,
  )
  const siblings = listSheets(ws)
    .filter((sheet) => sheet.parentId === original.parentId && sheet.id !== copy.id)
    .sort((a, b) => (a.position < b.position ? -1 : a.position > b.position ? 1 : 0))
  const at = siblings.findIndex((sheet) => sheet.id === original.id)
  moveSheet(ws, copy.id, original.parentId, at + 1)
  updateSheetMeta(ws, copy.id, { cover: original.cover, fullWidth: original.fullWidth })
  return requireSheet(ws, copy.id)
}
