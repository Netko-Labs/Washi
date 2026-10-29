import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { publicProcedure, router } from '../../init'
import { requireOAuth } from './guard'

export const oauthQueries = router({
  /** How the agent asking for consent calls itself. */
  client: publicProcedure
    .input(z.object({ clientId: z.string().min(1).max(200) }))
    .query(async ({ ctx, input }) => {
      const { oauth } = requireOAuth(ctx)
      const name = await oauth.clientName(input.clientId)
      if (name === null) throw new TRPCError({ code: 'NOT_FOUND', message: 'unknown agent' })
      return { name }
    }),
})
