import type { SheetAuthor, SheetDetail, SheetWrite } from '@washi/domain'
import { pageTables, paperRegistry } from '@washi/paper/registry'
import {
  createSheet,
  deleteSheet,
  getSheet,
  latestRevision,
  mergeSheetSource,
  restoreRevision,
  updateSheet,
  type Workspace,
} from '@washi/repository'
import {
  type Diagnostic,
  domDiagnostics,
  extractFiles,
  extractMissing,
  extractRefs,
  extractText,
  hasCode,
  hasErrors,
  parse,
  validate,
  type WsxMissing,
  WsxParseError,
} from '@washi/wsx'
import { pageCodeDiagnostics } from '../pages'
import { extractAutomations, extractFormulas, scriptDiagnostics } from '../scripts/compile'
import { pagePackagesOf } from '../server'
import { guardWashiWrite, syncShare } from './access'
import { accessOf, lookOf } from './look-of'

export interface WsxCheck {
  ok: boolean
  diagnostics: Diagnostic[]
  /** Registry requests the sheet carries as <Missing kind reason />. */
  missing: WsxMissing[]
}

/**
 * Parse + registry-validate WSX source. Warnings (the complexity budget) never block a save.
 * Without the workspace, page code imports only Washi's own libraries.
 */
export function checkSource(source: string, ws?: Workspace): WsxCheck {
  try {
    const root = parse(source)
    const diagnostics = [
      ...validate(root, paperRegistry),
      ...scriptDiagnostics(root),
      ...(hasCode(root)
        ? [...pageCodeDiagnostics(source, pagePackagesOf(ws)), ...domDiagnostics(root)]
        : []),
    ]
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

function parseValidated(ws: Workspace, source: string) {
  const check = checkSource(source, ws)
  if (!check.ok) throw new SheetValidationError(check.diagnostics)
  return parse(source)
}

export function createSheetFromSource(
  ws: Workspace,
  write: SheetWrite,
  parentId: string | null = null,
  editedBy: SheetAuthor = null,
): SheetDetail {
  const root = parseValidated(ws, write.source)
  if (parentId) requireSheet(ws, parentId)
  if (editedBy === 'washi') guardWashiWrite(null, root)
  const access = accessOf(root)
  const sheet = createSheet(
    ws,
    { ...write, ...lookOf(root), ...access },
    indexOf(root),
    parentId,
    editedBy,
  )
  syncShare(ws, sheet.id, access, null)
  return sheet
}

export class SheetConflictError extends Error {
  constructor(id: string) {
    super(`page ${id} changed under this edit and the two do not fit together; reload it`)
    this.name = 'SheetConflictError'
  }
}

/** Two writers, one page: with the version it read, an edit merges instead of replacing. */
function mergedSource(ws: Workspace, id: string, write: SheetWrite, baseVersion?: string): string {
  if (!baseVersion) return write.source
  let merged: string | null
  try {
    merged = mergeSheetSource(ws, id, baseVersion, write.source)
  } catch {
    throw new SheetConflictError(id)
  }
  if (merged === null) throw new Error(`sheet not found: ${id}`)
  if (merged !== write.source && !checkSource(merged, ws).ok) throw new SheetConflictError(id)
  return merged
}

export function updateSheetFromSource(
  ws: Workspace,
  id: string,
  write: SheetWrite,
  editedBy: SheetAuthor = null,
  baseVersion?: string,
): SheetDetail {
  parseValidated(ws, write.source)
  const source = mergedSource(ws, id, write, baseVersion)
  const root = parse(source)
  if (editedBy === 'washi') guardWashiWrite(parse(requireSheet(ws, id).source), root)
  const access = accessOf(root)
  const updated = updateSheet(
    ws,
    id,
    { ...write, source, ...lookOf(root), ...access },
    indexOf(root),
    editedBy,
  )
  if (!updated) throw new Error(`sheet not found: ${id}`)
  syncShare(ws, id, access, null)
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
  const root = revision ? parse(revision.source) : null
  if (!revision || !root || !restoreRevision(ws, revision, indexOf(root), lookOf(root))) {
    throw new SheetUndoError(id)
  }
  return requireSheet(ws, id)
}

/** What search, backlinks and purge read off a page: its words, its links, its uploads. */
export function indexOf(root: ReturnType<typeof parse>) {
  return {
    body: extractText(root),
    refs: extractRefs(root),
    files: extractFiles(root),
    automations: extractAutomations(root),
    formulas: extractFormulas(root),
    tables: [...pageTables(root)],
  }
}

export function removeSheet(ws: Workspace, id: string): void {
  if (!deleteSheet(ws, id)) throw new Error(`sheet not found: ${id}`)
}

export function requireSheet(ws: Workspace, id: string): SheetDetail {
  const sheet = getSheet(ws, id)
  if (!sheet) throw new Error(`sheet not found: ${id}`)
  return sheet
}
