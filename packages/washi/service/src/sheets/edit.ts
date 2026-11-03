import type { SheetDetail } from '@washi/domain'
import { sheetSourceAt, type Workspace } from '@washi/repository'
import { requireSheet, updateSheetFromSource } from './service'
import type { SheetEdit, SheetEditOptions } from './types'

export class SheetEditError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SheetEditError'
  }
}

const shown = (text: string) => JSON.stringify(text.length > 80 ? `${text.slice(0, 77)}…` : text)

function occurrences(source: string, text: string): number {
  let count = 0
  for (let at = source.indexOf(text); at !== -1; at = source.indexOf(text, at + text.length)) {
    count++
  }
  return count
}

/** Every edit in order, or none: a miss or a repeat says which edit, in words. */
export function applyEdits(source: string, edits: SheetEdit[]): string {
  let next = source
  for (const [at, edit] of edits.entries()) {
    if (edit.old.length === 0) throw new SheetEditError(`edit ${at + 1}: old is empty`)
    const found = occurrences(next, edit.old)
    if (found !== 1) {
      throw new SheetEditError(
        `edit ${at + 1}: ${shown(edit.old)} occurs ${found === 0 ? 'nowhere' : `${found} times`} in the page${found > 1 ? ' — add the words around it so it is one' : ''}; nothing changed`,
      )
    }
    next = next.replace(edit.old, () => edit.new)
  }
  return next
}

/**
 * A few lines of a page changed without sending it whole. The edits apply to the source as it
 * stood at `baseVersion` (or as it is now), and the result is written like any whole-page write:
 * merged with what landed since, validated, a `SheetConflictError` if the two do not fit.
 */
export function editSheetSource(
  ws: Workspace,
  id: string,
  edits: SheetEdit[],
  options: SheetEditOptions = {},
): SheetDetail {
  const current = requireSheet(ws, id)
  let base = current.source
  if (options.baseVersion) {
    try {
      base = sheetSourceAt(ws, id, options.baseVersion) ?? current.source
    } catch {
      throw new SheetEditError(`baseVersion is not a version of page ${id}; read it again`)
    }
  }
  const source = applyEdits(base, edits)
  return updateSheetFromSource(
    ws,
    id,
    { title: options.title ?? current.title, tags: current.tags, source },
    options.editedBy ?? null,
    options.baseVersion,
  )
}
