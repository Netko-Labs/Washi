import { querySchema } from '@washi/ink'
import { listTables } from '@washi/repository'
import { rowOfSheet, runQuery } from '@washi/service'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

export const tableQueries = router({
  list: workspaceProcedure.query(({ ctx }) => listTables(ctx.ws)),
  query: workspaceProcedure
    .input(z.object({ query: querySchema }))
    .query(({ ctx, input }) => runQuery(ctx.ws, input.query)),
  /** The row a page is the body of, with its table — null for an ordinary page. */
  rowOf: workspaceProcedure
    .input(z.object({ sheetId: z.string() }))
    .query(({ ctx, input }) => rowOfSheet(ctx.ws, input.sheetId)),
})
