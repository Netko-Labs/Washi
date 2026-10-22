import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

export const fileMutations = router({
  /** Bytes go through `/api/files` (multipart); only the remove is JSON. */
  remove: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.files.remove(input.id)
      return { removed: true }
    }),
})
