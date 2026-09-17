import { querySchema } from '@washi/ink'
import { listTables } from '@washi/repository'
import { runQuery } from '@washi/service'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

export const tableQueries = router({
  list: workspaceProcedure.query(({ ctx }) => listTables(ctx.ws)),
  query: workspaceProcedure
    .input(z.object({ query: querySchema }))
    .query(({ ctx, input }) => runQuery(ctx.ws, input.query)),
})
