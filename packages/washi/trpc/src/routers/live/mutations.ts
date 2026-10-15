import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

const onPage = z.object({ sheetId: z.string().min(1), editing: z.boolean().default(false) })

/** A heartbeat, not a record: who is on a page lives in the server's memory and nowhere else. */
export const liveMutations = router({
  here: workspaceProcedure.input(onPage).mutation(({ ctx, input }) =>
    ctx.runtime.presence.touch(ctx.workspaceId, input.sheetId, {
      id: ctx.actorId ?? 'local',
      name: ctx.actor?.name ?? 'You',
      editing: input.editing,
      agent: false,
    }),
  ),
  leave: workspaceProcedure
    .input(z.object({ sheetId: z.string().min(1) }))
    .mutation(({ ctx, input }) => {
      ctx.runtime.presence.leave(ctx.workspaceId, input.sheetId, ctx.actorId ?? 'local')
    }),
})
