import type { SheetAuthor, SheetDetail } from '@washi/domain'
import type { TableSpec } from '@washi/ink'
import { sheetVersion, type Workspace } from '@washi/repository'
import { extractText, parse } from '@washi/wsx'
import type { CapabilityContext } from './types'
import { PREVIEW_CHARS } from './values'

/**
 * A spec sent for a table that exists, laid over the one it has: each column it names replaces
 * that column in place, a new one is added at the end, and one it leaves out stays — an outside
 * agent adding a column never drops the rest by omission.
 */
export function mergedSpec(existing: TableSpec | undefined, sent: TableSpec): TableSpec {
  if (!existing) return sent
  const named = new Map(sent.columns.map((column) => [column.name, column]))
  const kept = existing.columns.map((column) => named.get(column.name) ?? column)
  const added = sent.columns.filter(
    (column) => !existing.columns.some((each) => each.name === column.name),
  )
  return { name: sent.name, columns: [...kept, ...added] }
}

/** A page's words as a reader sees them, for a check that wants to see what it wrote. */
export function previewOf(source: string): string | undefined {
  try {
    const text = extractText(parse(source))
    return text.length > PREVIEW_CHARS ? `${text.slice(0, PREVIEW_CHARS)}…` : text
  } catch {
    return undefined
  }
}

/** A page records Washi's hand or a person's; which person is the row history's to keep. */
export const editedByOf = (context: CapabilityContext): SheetAuthor =>
  context.author === 'washi' ? 'washi' : null

/** What a page write answers: enough to write again, never the source it was just sent. */
export const writtenAnswer =
  (ws: Workspace, context: CapabilityContext) => (sheet: SheetDetail, full?: boolean) => {
    const version = sheetVersion(ws, sheet.id) ?? undefined
    if (full) return { ...sheet, version }
    return {
      id: sheet.id,
      title: sheet.title,
      parentId: sheet.parentId,
      version,
      ...(context.pageUrl ? { url: context.pageUrl(sheet.id) } : {}),
    }
  }
