import type { SheetAuthor } from '@washi/domain'
import type { Workspace } from '@washi/repository'
import { z } from 'zod'
import { pagesFor } from '../agents/lib/pages'
import { checkSource, createSheetFromSource, updateSheetFromSource } from '../sheets/service'
import { trashSheetAs } from '../sheets/tree'
import { capability } from './define'
import type { Capability, CapabilityContext } from './types'

/** Reading and writing pages, as the viewer reads them and signed by the context's author. */
export function pageCapabilities(ws: Workspace, context: CapabilityContext): Capability[] {
  const pages = pagesFor(ws, context.viewer)
  // A page records Washi's hand or a person's; which person is the row history's to keep.
  const editedBy: SheetAuthor = context.author === 'washi' ? 'washi' : null
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
      'Read one sheet: metadata, full WSX source, and its version (for sheet_replace).',
      { id: z.string() },
      true,
      ({ id }) => pages.get(id),
    ),
    capability(
      'sheet_check',
      'Validate WSX source without saving. Returns diagnostics — run before sheet_create/sheet_replace.',
      { source: z.string() },
      true,
      ({ source }) => checkSource(source, ws),
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
      'Create a sheet from WSX source. The source must pass sheet_check. Pass parentId (from sheet_list) to file it under another sheet, as a sub-page.',
      { title: z.string().min(1).max(200), source: z.string(), parentId: z.string().optional() },
      false,
      ({ parentId, ...write }) => {
        if (parentId) pages.require(parentId)
        const sheet = createSheetFromSource(ws, write, parentId ?? null, editedBy)
        context.onCreate?.(sheet.id)
        return sheet
      },
    ),
    capability(
      'sheet_replace',
      "Replace a sheet's WSX source (whole-document write). Pass the version sheet_get returned as baseVersion: a teammate typing in the page meanwhile is merged, not overwritten.",
      {
        id: z.string(),
        title: z.string().min(1).max(200),
        source: z.string(),
        baseVersion: z.string().optional(),
      },
      false,
      ({ id, baseVersion, ...write }) => {
        pages.require(id)
        return updateSheetFromSource(ws, id, write, editedBy, baseVersion)
      },
    ),
    capability(
      'sheet_delete',
      'Move a sheet and every sub-page under it to the Trash — only when the person asked for that page to go. They can restore it from the Trash.',
      { id: z.string() },
      false,
      ({ id }) => trashSheetAs(ws, id, context.viewer, editedBy),
    ),
  ]
}
