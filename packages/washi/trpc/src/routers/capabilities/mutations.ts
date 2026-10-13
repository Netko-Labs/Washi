import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

/**
 * Origin is stamped here and never taken from the caller — a rendered sheet is
 * a sheet, whatever its WSX claims (spec §09 P4).
 */
export const capabilityMutations = router({
  runAction: workspaceProcedure
    .input(z.object({ action: z.record(z.string(), z.unknown()) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.host.executeAction(input.action, { origin: 'sheet', actorId: ctx.actorId })
    }),
})
