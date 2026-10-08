import { TRPCError } from '@trpc/server'
import { routineCreateSchema } from '@washi/domain'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

const byId = z.object({ id: z.string() })

export const routineMutations = router({
  /** Who asked for it is stamped from the session, so a routine has an owner. */
  create: workspaceProcedure
    .input(routineCreateSchema)
    .mutation(({ ctx, input }) => ctx.host.routines.create(input, ctx.actorId)),
  setEnabled: workspaceProcedure
    .input(byId.extend({ enabled: z.boolean() }))
    .mutation(({ ctx, input }) => ctx.host.routines.setEnabled(input.id, input.enabled)),
  remove: workspaceProcedure.input(byId).mutation(({ ctx, input }) => {
    ctx.host.routines.remove(input.id)
  }),
  /** Run it now, in its own conversation — and that counts as today's run. */
  runNow: workspaceProcedure.input(byId).mutation(({ ctx, input }) => {
    if (!ctx.host.routines.run(input.id)) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'That routine is already running, or it no longer exists.',
      })
    }
  }),
})
