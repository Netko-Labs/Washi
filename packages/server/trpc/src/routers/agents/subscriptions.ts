import { tracked } from '@trpc/server'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

/**
 * `tracked` + `lastEventId` is why these survive a dropped socket: a laptop lid
 * closing mid-turn resumes the transcript instead of losing its middle.
 *
 * Every one is a workspaceProcedure and filters on its workspace: the bus is
 * shared by the whole server, and a transcript is the workspace's content.
 */
const resumable = z.object({ lastEventId: z.string().nullish() }).optional()

export const agentSubscriptions = router({
  onAgentUpdate: workspaceProcedure.input(resumable).subscription(async function* ({
    ctx,
    input,
    signal,
  }) {
    for await (const event of ctx.events.subscribe('agentUpdate', {
      lastEventId: input?.lastEventId,
      signal,
    })) {
      if (event.data.workspaceId === ctx.workspaceId) yield tracked(event.id, event.data)
    }
  }),

  onApprovalRequested: workspaceProcedure.input(resumable).subscription(async function* ({
    ctx,
    input,
    signal,
  }) {
    for await (const event of ctx.events.subscribe('approvalRequested', {
      lastEventId: input?.lastEventId,
      signal,
    })) {
      if (event.data.workspaceId === ctx.workspaceId) yield tracked(event.id, event.data)
    }
  }),

  onOpenSheetRequested: workspaceProcedure.input(resumable).subscription(async function* ({
    ctx,
    input,
    signal,
  }) {
    for await (const event of ctx.events.subscribe('openSheetRequested', {
      lastEventId: input?.lastEventId,
      signal,
    })) {
      if (event.data.workspaceId === ctx.workspaceId) yield tracked(event.id, event.data)
    }
  }),
})
