import type { SheetDetail, SheetWrite } from '@washi/desktop-domain'
import { createSheet, deleteSheet, getSheet, updateSheet } from '@washi/desktop-repository'
import { paperRegistry } from '@washi/paper/registry'
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

export function createSheetFromSource(write: SheetWrite): SheetDetail {
  const root = parseValidated(write.source)
  return createSheet(write, { body: extractText(root), refs: extractRefs(root) })
}

export function updateSheetFromSource(id: string, write: SheetWrite): SheetDetail {
  const root = parseValidated(write.source)
  const updated = updateSheet(id, write, { body: extractText(root), refs: extractRefs(root) })
  if (!updated) throw new Error(`sheet not found: ${id}`)
  return updated
}

export function removeSheet(id: string): void {
  if (!deleteSheet(id)) throw new Error(`sheet not found: ${id}`)
}

export function requireSheet(id: string): SheetDetail {
  const sheet = getSheet(id)
  if (!sheet) throw new Error(`sheet not found: ${id}`)
  return sheet
}
