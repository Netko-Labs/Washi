import { rowActivityInputSchema } from '@washi/domain'
import { historyQuerySchema, querySchema } from '@washi/ink'
import { listTables } from '@washi/repository'
import {
  rowActivity,
  rowOfSheet,
  runHistory,
  runQuery,
  tableCatalog,
  trashedTables,
} from '@washi/service'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

export const tableQueries = router({
  list: workspaceProcedure.query(({ ctx }) => listTables(ctx.ws)),
  /** Every table, its size, and the pages this viewer reads that show it (D109). */
  catalog: workspaceProcedure.query(({ ctx }) => tableCatalog(ctx.ws, ctx.viewer)),
  trashed: workspaceProcedure.query(({ ctx }) => trashedTables(ctx.ws)),
  query: workspaceProcedure
    .input(z.object({ query: querySchema }))
    .query(({ ctx, input }) => runQuery(ctx.ws, input.query)),
  /** Rows matching `where` at the close of each day: what a burn-up draws. */
  history: workspaceProcedure
    .input(z.object({ query: historyQuerySchema }))
    .query(({ ctx, input }) => runHistory(ctx.ws, input.query)),
  /** The row a page is the body of, with its table — null for an ordinary page. */
  rowOf: workspaceProcedure
    .input(z.object({ sheetId: z.string() }))
    .query(({ ctx, input }) => rowOfSheet(ctx.ws, input.sheetId)),
  /** Who changed a row, when, and from what to what — newest first (D78). */
  rowActivity: workspaceProcedure
    .input(rowActivityInputSchema)
    .query(({ ctx, input }) => rowActivity(ctx.ws, input.recordId, input.limit)),
})
