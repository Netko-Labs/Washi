import { tracked } from '@trpc/server'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

const resumable = z.object({ lastEventId: z.string().nullish() }).optional()

/** What moved in the workspace, and who is where — both filtered to this workspace. */
export const liveSubscriptions = router({
  onChange: workspaceProcedure.input(resumable).subscription(async function* ({
    ctx,
    input,
    signal,
  }) {
    for await (const event of ctx.events.subscribe('workspaceChanged', {
      lastEventId: input?.lastEventId,
      signal,
    })) {
      if (event.data.workspaceId === ctx.workspaceId) yield tracked(event.id, event.data)
    }
  }),
  onPresence: workspaceProcedure.input(resumable).subscription(async function* ({
    ctx,
    input,
    signal,
  }) {
    for await (const event of ctx.events.subscribe('presenceChanged', {
      lastEventId: input?.lastEventId,
      signal,
    })) {
      if (event.data.workspaceId === ctx.workspaceId) yield tracked(event.id, event.data)
    }
  }),
})
