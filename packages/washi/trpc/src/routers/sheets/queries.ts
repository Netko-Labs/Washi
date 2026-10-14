import { getBacklinks, getSheet, listSheets, listTrash, searchSheets } from '@washi/repository'
import { checkSource } from '@washi/service'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

const byId = z.object({ id: z.string() })

export const sheetQueries = router({
  list: workspaceProcedure.query(({ ctx }) => listSheets(ctx.ws)),
  trash: workspaceProcedure.query(({ ctx }) => listTrash(ctx.ws)),
  get: workspaceProcedure.input(byId).query(({ ctx, input }) => getSheet(ctx.ws, input.id)),
  backlinks: workspaceProcedure
    .input(byId)
    .query(({ ctx, input }) => getBacklinks(ctx.ws, input.id)),
  search: workspaceProcedure
    .input(z.object({ term: z.string() }))
    .query(({ ctx, input }) => searchSheets(ctx.ws, input.term)),
  check: workspaceProcedure
    .input(z.object({ source: z.string() }))
    .query(({ input }) => checkSource(input.source)),
})
