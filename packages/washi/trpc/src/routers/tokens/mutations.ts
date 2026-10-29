import { TRPCError } from '@trpc/server'
import { accessTokenNameSchema } from '@washi/domain'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'
import type { TokenContext } from '../../shared/tokens'

function requireTokens(ctx: TokenContext) {
  const { tokens } = ctx.runtime.control
  if (!tokens || !ctx.actorId) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'tokens live on a Washi server — this one has no accounts',
    })
  }
  return { tokens, actorId: ctx.actorId }
}

/** Any member makes their own; each acts as them, in this workspace only. */
export const tokenMutations = router({
  create: workspaceProcedure
    .input(z.object({ name: accessTokenNameSchema }))
    .mutation(async ({ ctx, input }) => {
      const { tokens, actorId } = requireTokens(ctx)
      return tokens.create(actorId, ctx.workspaceId, input.name)
    }),
  revoke: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { tokens, actorId } = requireTokens(ctx)
      await tokens.revoke(actorId, input.id)
    }),
})
