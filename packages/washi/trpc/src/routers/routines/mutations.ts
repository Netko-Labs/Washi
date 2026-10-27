import { TRPCError } from '@trpc/server'
import { routineCreateSchema, routineUpdateSchema } from '@washi/domain'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

const byId = z.object({ id: z.string() })

export const routineMutations = router({
  /** Who asked for it is stamped from the session, so a routine has an owner. */
  create: workspaceProcedure
    .input(routineCreateSchema)
    .mutation(({ ctx, input }) => ctx.host.routines.create(input, ctx.actorId)),
  /** Title, prompt, schedule or zone; a new schedule starts from now. */
  update: workspaceProcedure.input(routineUpdateSchema).mutation(({ ctx, input }) => {
    const routine = ctx.host.routines.update(input)
    if (!routine)
      throw new TRPCError({ code: 'NOT_FOUND', message: 'That routine no longer exists.' })
    return routine
  }),
  setEnabled: workspaceProcedure
    .input(byId.extend({ enabled: z.boolean() }))
    .mutation(({ ctx, input }) => ctx.host.routines.setEnabled(input.id, input.enabled)),
  remove: workspaceProcedure.input(byId).mutation(({ ctx, input }) => {
    ctx.host.routines.remove(input.id)
  }),
  /** Run it now, in its own chat. The schedule is left alone: its next minute still runs. */
  runNow: workspaceProcedure.input(byId).mutation(({ ctx, input }) => {
    const outcome = ctx.host.routines.run(input.id)
    if (outcome === 'started') return
    throw new TRPCError(
      outcome === 'missing'
        ? { code: 'NOT_FOUND', message: 'That routine no longer exists.' }
        : outcome === 'busy'
          ? { code: 'CONFLICT', message: 'A routine is already running. Try again when it ends.' }
          : {
              code: 'PRECONDITION_FAILED',
              message: 'Washi is at its daily stop. Resume it first.',
            },
    )
  }),
})
