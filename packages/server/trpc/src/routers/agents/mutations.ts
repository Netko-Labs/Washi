import { createSession } from '@washi/repository'
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
  resolveApproval: workspaceProcedure
    .input(z.object({ id: z.string(), decision: decisionSchema }))
    .mutation(({ ctx, input }) => {
      ctx.host.resolveApprovalRequest(input.id, input.decision)
    }),
})
