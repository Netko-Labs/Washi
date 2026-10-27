import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

export const routineQueries = router({
  list: workspaceProcedure.query(({ ctx }) => ctx.host.routines.list()),
  /** Newest first: what started each run, its chat, and how it went. */
  runs: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => ctx.host.routines.runs(input.id)),
})
