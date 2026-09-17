import { tracked } from '@trpc/server'
import { z } from 'zod'
import { publicProcedure, router } from '../../init'

/**
 * `tracked` + `lastEventId` is why these survive a dropped socket: a laptop lid
 * closing mid-turn resumes the transcript instead of losing its middle.
 */
const resumable = z.object({ lastEventId: z.string().nullish() }).optional()

export const agentSubscriptions = router({
  onAgentUpdate: publicProcedure.input(resumable).subscription(async function* ({
    ctx,
    input,
    signal,
  }) {
    for await (const event of ctx.events.subscribe('agentUpdate', {
      lastEventId: input?.lastEventId,
      signal,
    })) {
      yield tracked(event.id, event.data)
    }
  }),

  onApprovalRequested: publicProcedure.input(resumable).subscription(async function* ({
    ctx,
    input,
    signal,
  }) {
    for await (const event of ctx.events.subscribe('approvalRequested', {
      lastEventId: input?.lastEventId,
      signal,
    })) {
      yield tracked(event.id, event.data)
    }
  }),

  onOpenSheetRequested: publicProcedure.input(resumable).subscription(async function* ({
    ctx,
    input,
    signal,
  }) {
    for await (const event of ctx.events.subscribe('openSheetRequested', {
      lastEventId: input?.lastEventId,
      signal,
    })) {
      yield tracked(event.id, event.data)
    }
  }),
})
