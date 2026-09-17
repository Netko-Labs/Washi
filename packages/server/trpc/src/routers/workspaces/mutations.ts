import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

function requireSecrets(ctx: { runtime: { control: { secrets?: unknown } } }) {
  const { secrets } = ctx.runtime.control
  if (!secrets) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'this deployment has no key store — the agent uses this machine’s own key',
    })
  }
  return secrets as NonNullable<typeof secrets>
}

export const workspaceMutations = router({
  /**
   * Write-only by construction: the key goes in, only `last4` comes back out.
   * An Anthropic key cannot be scoped, so a leak is the whole account.
   */
  setAgentKey: workspaceProcedure
    .input(z.object({ key: z.string().min(8) }))
    .mutation(({ ctx, input }) => {
      const secrets = requireSecrets(ctx) as import('../../init').SecretStore
      if (!ctx.actorId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'sign in to set a key' })
      }
      return secrets.set(ctx.workspaceId, ctx.actorId, input.key)
    }),
})
