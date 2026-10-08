import { TRPCError } from '@trpc/server'
import { createSession } from '@washi/repository'
import { INFERENCE_PREFERENCES } from '@washi/service'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

const decisionSchema = z.enum(['allow_once', 'allow_always', 'reject_once'])

export const agentMutations = router({
  createSession: workspaceProcedure
    .input(z.object({ title: z.string() }))
    .mutation(({ ctx, input }) => createSession(ctx.ws, input.title)),
  // Fire-and-forget: updates stream back over the agentUpdate subscription.
  prompt: workspaceProcedure
    .input(z.object({ sessionId: z.string(), text: z.string() }))
    .mutation(({ ctx, input }) => {
      void ctx.host.prompt(input.sessionId, input.text)
    }),
  /** Clearing the breaker is a person's decision — nothing clears it on a timer. */
  resume: workspaceProcedure.mutation(({ ctx }) => {
    ctx.host.resume()
    return ctx.host.spend()
  }),
  /** The daily stop. A person sets it; the breaker reads it before every turn. */
  setDailyCap: workspaceProcedure
    .input(z.object({ capUsd: z.number().positive().max(10_000) }))
    .mutation(({ ctx, input }) => ctx.host.setDailyCap(input.capUsd)),
  /** Embedded only: Claude Code on this computer, the env key, or whichever is there. */
  setInference: workspaceProcedure
    .input(z.object({ preference: z.enum(INFERENCE_PREFERENCES) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.mode !== 'embedded') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'a hosted workspace runs on its own key — there is nothing to pick',
        })
      }
      return ctx.host.setInference(input.preference)
    }),
  resolveApproval: workspaceProcedure
    .input(z.object({ id: z.string(), decision: decisionSchema }))
    .mutation(({ ctx, input }) => {
      ctx.host.resolveApprovalRequest(input.id, input.decision)
    }),
})
