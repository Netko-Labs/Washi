import type { SheetAuthor, SheetDetail, SheetWrite } from '@washi/domain'
import { paperRegistry } from '@washi/paper/registry'
import {
  createSheet,
  deleteSheet,
  getSheet,
  latestRevision,
  restoreRevision,
  updateSheet,
  type Workspace,
} from '@washi/repository'
import {
  type Diagnostic,
  extractMissing,
  extractRefs,
  extractText,
  hasErrors,
  parse,
  validate,
  type WsxMissing,
  WsxParseError,
} from '@washi/wsx'

export interface WsxCheck {
  ok: boolean
  diagnostics: Diagnostic[]
  /** Registry requests the sheet carries as <Missing kind reason />. */
  missing: WsxMissing[]
}

/** Parse + registry-validate WSX source. Warnings (the complexity budget) never block a save. */
export function checkSource(source: string): WsxCheck {
  try {
    const root = parse(source)
    const diagnostics = validate(root, paperRegistry)
    return { ok: !hasErrors(diagnostics), diagnostics, missing: extractMissing(root) }
  } catch (error) {
    if (error instanceof WsxParseError) {
      return { ok: false, diagnostics: error.diagnostics, missing: [] }
    }
    throw error
  }
}

export class SheetValidationError extends Error {
  readonly diagnostics: Diagnostic[]

  constructor(diagnostics: Diagnostic[]) {
    super(`invalid WSX: ${diagnostics.map((diagnostic) => diagnostic.message).join('; ')}`)
    this.name = 'SheetValidationError'
    this.diagnostics = diagnostics
  }
}

function parseValidated(source: string) {
  const check = checkSource(source)
  if (!check.ok) throw new SheetValidationError(check.diagnostics)
  return parse(source)
}

export function createSheetFromSource(
  ws: Workspace,
  write: SheetWrite,
  parentId: string | null = null,
  editedBy: SheetAuthor = null,
): SheetDetail {
  const root = parseValidated(write.source)
  if (parentId) requireSheet(ws, parentId)
  return createSheet(ws, write, indexOf(root), parentId, editedBy)
}

export function updateSheetFromSource(
  ws: Workspace,
  id: string,
  write: SheetWrite,
  editedBy: SheetAuthor = null,
): SheetDetail {
  const updated = updateSheet(ws, id, write, indexOf(parseValidated(write.source)), editedBy)
  if (!updated) throw new Error(`sheet not found: ${id}`)
  return updated
}

export class SheetUndoError extends Error {
  constructor(id: string) {
    super(`nothing of Washi's to undo on ${id}`)
    this.name = 'SheetUndoError'
  }
}

/** Takes back Washi's last write — only while nobody has written the page since. */
export function undoWashiWrite(ws: Workspace, id: string): SheetDetail {
  const revision = latestRevision(ws, id)
  if (!revision || !restoreRevision(ws, revision, indexOf(parse(revision.source)))) {
    throw new SheetUndoError(id)
  }
  return requireSheet(ws, id)
}

function indexOf(root: ReturnType<typeof parse>) {
  return { body: extractText(root), refs: extractRefs(root) }
}

export function removeSheet(ws: Workspace, id: string): void {
  if (!deleteSheet(ws, id)) throw new Error(`sheet not found: ${id}`)
}

export function requireSheet(ws: Workspace, id: string): SheetDetail {
  const sheet = getSheet(ws, id)
  if (!sheet) throw new Error(`sheet not found: ${id}`)
  return sheet
}
