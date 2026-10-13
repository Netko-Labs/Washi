import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

export const capabilityQueries = router({
  fetchUrl: workspaceProcedure
    .input(z.object({ url: z.string() }))
    .query(({ ctx, input }) => ctx.host.fetchForSheet(input.url, ctx.actorId)),
})
