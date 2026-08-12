import type { SheetDetail, SheetWrite } from '@washi/desktop-domain'
import { createSheet, deleteSheet, getSheet, updateSheet } from '@washi/desktop-repository'
import { paperRegistry } from '@washi/paper/registry'
import {
  type Diagnostic,
  extractRefs,
  extractText,
  parse,
  validate,
  WsxParseError,
} from '@washi/wsx'

export interface WsxCheck {
  ok: boolean
  diagnostics: Diagnostic[]
}

/** Parse + registry-validate WSX source. The agent-facing `sheet_check` runs this too. */
export function checkSource(source: string): WsxCheck {
  try {
    const root = parse(source)
    const diagnostics = validate(root, paperRegistry)
    return { ok: diagnostics.length === 0, diagnostics }
  } catch (error) {
    if (error instanceof WsxParseError) return { ok: false, diagnostics: error.diagnostics }
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
