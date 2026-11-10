import {
  getBacklinks,
  getSheet,
  listSheets,
  listTrash,
  searchSheets,
  sheetVersion,
} from '@washi/repository'
import { agentGuidePage, checkSource, readableSet, shareSettings } from '@washi/service'
import { z } from 'zod'
import { pageProcedure, router, workspaceProcedure } from '../../init'

const byId = z.object({ id: z.string() })

export const sheetQueries = router({
  list: workspaceProcedure.query(({ ctx }) => {
    const readable = readableSet(ctx.ws, ctx.viewer)
    return listSheets(ctx.ws).filter((page) => readable.has(page.id))
  }),
  trash: workspaceProcedure.query(({ ctx }) => {
    const readable = readableSet(ctx.ws, ctx.viewer)
    return listTrash(ctx.ws).filter((entry) => readable.has(entry.id))
  }),
  get: pageProcedure.input(byId).query(({ ctx, input }) => {
    const sheet = getSheet(ctx.ws, input.id)
    return sheet ? { ...sheet, version: sheetVersion(ctx.ws, input.id) ?? undefined } : null
  }),
  backlinks: pageProcedure.input(byId).query(({ ctx, input }) => {
    const readable = readableSet(ctx.ws, ctx.viewer)
    return getBacklinks(ctx.ws, input.id).filter((page) => readable.has(page.id))
  }),
  search: workspaceProcedure.input(z.object({ term: z.string() })).query(({ ctx, input }) => {
    const readable = readableSet(ctx.ws, ctx.viewer)
    return searchSheets(ctx.ws, input.term).filter((hit) => readable.has(hit.id))
  }),
  /** The page outside agents read first (D135), as this person may read it — or none. */
  agentGuide: workspaceProcedure.query(({ ctx }) => agentGuidePage(ctx.ws, ctx.viewer)),
  /** Who reads the page and its link, for the Share popover (D65). */
  share: pageProcedure.input(byId).query(({ ctx, input }) => shareSettings(ctx.ws, input.id)),
  check: workspaceProcedure
    .input(z.object({ source: z.string() }))
    .query(({ ctx, input }) => checkSource(input.source, ctx.ws)),
})
