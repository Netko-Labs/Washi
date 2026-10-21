import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { INTEGRATIONS, router, type SecretStore, workspaceProcedure } from '../../init'

function requireSecrets(ctx: { runtime: { control: { secrets?: unknown } } }) {
  const { secrets } = ctx.runtime.control
  if (!secrets) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'this deployment has no key store — the agent uses this machine’s own key',
    })
  }
  return secrets as SecretStore
}

export const workspaceMutations = router({
  /**
   * Write-only by construction: the key goes in, only `last4` comes back out.
   * An Anthropic key cannot be scoped, so a leak is the whole account.
   */
  setAgentKey: workspaceProcedure
    .input(
      z.object({
        key: z.string().min(8),
        // OpenRouter reaches hundreds of models with one key, so the model is
        // part of the credential rather than a separate setting.
        provider: z.enum(['anthropic', 'openrouter']).default('anthropic'),
        model: z.string().min(1).max(200).nullish(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const secrets = requireSecrets(ctx)
      if (!ctx.actorId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'sign in to set a key' })
      }
      return secrets.set(ctx.workspaceId, ctx.actorId, {
        key: input.key,
        provider: input.provider,
        model: input.model ?? null,
      })
    }),
  /** Same shape as the agent key: write-only, `last4` back. */
  setIntegrationKey: workspaceProcedure
    .input(z.object({ integration: z.enum(INTEGRATIONS), key: z.string().min(8) }))
    .mutation(({ ctx, input }) => {
      const secrets = requireSecrets(ctx)
      if (!ctx.actorId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'sign in to set a key' })
      }
      return secrets.setIntegration(ctx.workspaceId, ctx.actorId, input.integration, input.key)
    }),
})
