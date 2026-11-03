import type { SheetAuthor, SheetDetail } from '@washi/domain'
import { sheetVersion, type Workspace } from '@washi/repository'
import { extractText, parse } from '@washi/wsx'
import { z } from 'zod'
import { pagesFor } from '../agents/lib/pages'
import { editSheetSource } from '../sheets/edit'
import { checkSource, createSheetFromSource, updateSheetFromSource } from '../sheets/service'
import { trashSheetAs } from '../sheets/tree'
import { capability } from './define'
import { referenceCapabilities } from './reference'
import type { Capability, CapabilityContext } from './types'
import { PREVIEW_CHARS } from './values'

const verbose = z
  .boolean()
  .optional()
  .describe(
    'true answers with the whole page, source included; by default only its id, title and version',
  )

/** A page's words as a reader sees them, for a check that wants to see what it wrote. */
function previewOf(source: string): string | undefined {
  try {
    const text = extractText(parse(source))
    return text.length > PREVIEW_CHARS ? `${text.slice(0, PREVIEW_CHARS)}…` : text
  } catch {
    return undefined
  }
}

/** Reading and writing pages, as the viewer reads them and signed by the context's author. */
export function pageCapabilities(ws: Workspace, context: CapabilityContext): Capability[] {
  const pages = pagesFor(ws, context.viewer)
  // A page records Washi's hand or a person's; which person is the row history's to keep.
  const editedBy: SheetAuthor = context.author === 'washi' ? 'washi' : null
  /** What a write answers: enough to write again, never the source it was just sent. */
  const written = (sheet: SheetDetail, full?: boolean) => {
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
  return [
    capability(
      'sheet_list',
      'List all sheets (id, title, icon, tags, parentId). A sheet with a parentId is a sub-page of that sheet.',
      {},
      true,
      () => pages.list(),
    ),
    capability(
      'sheet_get',
      'Read one sheet: metadata, full WSX source, and its version (for sheet_replace and sheet_edit).',
      { id: z.string() },
      true,
      ({ id }) => pages.get(id),
    ),
    capability(
      'sheet_check',
      'Validate WSX source without saving. Returns diagnostics — run before sheet_create/sheet_replace. preview: true also answers with the words the page draws, to check text and escaping read right. wsx_reference lists the primitives and their props.',
      { source: z.string(), preview: z.boolean().optional() },
      true,
      ({ source, preview }) => {
        const check = checkSource(source, ws)
        return preview ? { ...check, preview: previewOf(source) } : check
      },
    ),
    capability(
      'sheet_backlinks',
      'Sheets that reference the given sheet.',
      { id: z.string() },
      true,
      ({ id }) => pages.backlinks(id),
    ),
    capability(
      'search',
      'Full-text search across sheets.',
      { term: z.string() },
      true,
      ({ term }) => pages.search(term),
    ),
    capability(
      'sheet_create',
      'Create a sheet from WSX source. The source must pass sheet_check. Pass parentId (from sheet_list) to file it under another sheet, as a sub-page. Answers { id, title, parentId, version }.',
      {
        title: z.string().min(1).max(200),
        source: z.string(),
        parentId: z.string().optional(),
        verbose,
      },
      false,
      ({ parentId, verbose: full, ...write }) => {
        if (parentId) pages.require(parentId)
        const sheet = createSheetFromSource(ws, write, parentId ?? null, editedBy)
        context.onCreate?.(sheet.id)
        return written(sheet, full)
      },
    ),
    capability(
      'sheet_replace',
      "Replace a sheet's WSX source (whole-document write). Pass the version sheet_get returned as baseVersion: a teammate typing in the page meanwhile is merged, not overwritten. To change a few lines, sheet_edit sends only those. Answers { id, title, parentId, version }.",
      {
        id: z.string(),
        title: z.string().min(1).max(200),
        source: z.string(),
        baseVersion: z.string().optional(),
        verbose,
      },
      false,
      ({ id, baseVersion, verbose: full, ...write }) => {
        pages.require(id)
        return written(updateSheetFromSource(ws, id, write, editedBy, baseVersion), full)
      },
    ),
    capability(
      'sheet_edit',
      "Change part of a sheet's WSX source without sending it whole: edits [{ old, new }] apply in order, each old matching exactly once (add the words around it when it repeats); all apply or none do. Pass the version sheet_get or your last write returned as baseVersion: the edits apply to the page as it was then, and a teammate's typing since is merged. The result is checked like sheet_replace. Answers { id, title, parentId, version }.",
      {
        id: z.string(),
        edits: z
          .array(z.object({ old: z.string().min(1), new: z.string() }))
          .min(1)
          .max(64),
        baseVersion: z.string().optional(),
        title: z.string().min(1).max(200).optional(),
        verbose,
      },
      false,
      ({ id, edits, baseVersion, title, verbose: full }) => {
        pages.require(id)
        return written(editSheetSource(ws, id, edits, { editedBy, baseVersion, title }), full)
      },
    ),
    capability(
      'sheet_delete',
      'Move a sheet and every sub-page under it to the Trash — only when the person asked for that page to go. They can restore it from the Trash.',
      { id: z.string() },
      false,
      ({ id }) => trashSheetAs(ws, id, context.viewer, editedBy),
    ),
    ...referenceCapabilities(ws),
  ]
}
