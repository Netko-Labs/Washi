import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { publicProcedure, router } from '../../init'
import { requireOAuth } from './guard'

/** On consent: the workspace this agent will act in, for this person — one of their own. */
export const oauthMutations = router({
  grant: publicProcedure
    .input(z.object({ clientId: z.string().min(1).max(200), workspaceId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { oauth, actorId } = requireOAuth(ctx)
      const [isMember, name] = await Promise.all([
        ctx.runtime.control.authorize(actorId, input.workspaceId),
        oauth.clientName(input.clientId),
      ])
      if (!isMember || name === null) throw new TRPCError({ code: 'NOT_FOUND' })
      await oauth.grant(actorId, input.clientId, input.workspaceId)
    }),
})
