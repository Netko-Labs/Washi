import { approveSuggestion, declineSuggestion, markSuggestionsSeen } from '@washi/service'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

const byId = z.object({ id: z.string().min(1).max(80) })

export const suggestionMutations = router({
  /** The row lands through ink's insert, signed by the member who approved it. */
  approve: workspaceProcedure
    .input(byId)
    .mutation(({ ctx, input }) => approveSuggestion(ctx.ws, input.id, ctx.viewer)),
  decline: workspaceProcedure.input(byId).mutation(({ ctx, input }) => {
    declineSuggestion(ctx.ws, input.id, ctx.viewer)
  }),
  /** The given suggestions, or every one the caller sees when none are named. */
  markRead: workspaceProcedure
    .input(z.object({ ids: z.array(z.string()).max(200).optional() }))
    .mutation(({ ctx, input }) => {
      markSuggestionsSeen(ctx.ws, ctx.viewer, input.ids)
    }),
})
