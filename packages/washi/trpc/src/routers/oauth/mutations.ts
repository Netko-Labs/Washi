import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { publicProcedure, router } from '../../init'
import { requireOAuth } from './guard'

/**
 * On consent: the workspaces this agent will act in, for this person — each one of their own,
 * the default first (D124).
 */
export const oauthMutations = router({
  grant: publicProcedure
    .input(
      z.object({
        clientId: z.string().min(1).max(200),
        workspaceIds: z.array(z.string().min(1)).min(1).max(50),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { oauth, actorId } = requireOAuth(ctx)
      const workspaceIds = [...new Set(input.workspaceIds)]
      const [memberships, name] = await Promise.all([
        Promise.all(workspaceIds.map((id) => ctx.runtime.control.authorize(actorId, id))),
        oauth.clientName(input.clientId),
      ])
      if (memberships.some((isMember) => !isMember) || name === null) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      await oauth.grant(actorId, input.clientId, workspaceIds)
    }),
})
