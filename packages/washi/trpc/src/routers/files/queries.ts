import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

export const fileQueries = router({
  info: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => ctx.files.info(input.id)),
})
