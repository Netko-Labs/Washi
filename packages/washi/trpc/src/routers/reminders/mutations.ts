import { reminderCreateSchema, reminderUpdateSchema } from '@washi/domain'
import {
  createReminderRule,
  LOCAL_AUTHOR,
  markRemindersRead,
  removeReminderRule,
  updateReminderRule,
} from '@washi/service'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

export const reminderMutations = router({
  create: workspaceProcedure
    .input(reminderCreateSchema)
    .mutation(({ ctx, input }) => createReminderRule(ctx.ws, input, ctx.actorId)),
  /** Title, days before, filters, person column or the switch; the rule is checked again. */
  update: workspaceProcedure
    .input(reminderUpdateSchema)
    .mutation(({ ctx, input }) => updateReminderRule(ctx.ws, input)),
  remove: workspaceProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) => {
    removeReminderRule(ctx.ws, input.id)
  }),
  /** The given hits, or every one the caller sees when none are named. */
  markRead: workspaceProcedure
    .input(z.object({ hitIds: z.array(z.string()).max(200).optional() }))
    .mutation(({ ctx, input }) => {
      markRemindersRead(ctx.ws, ctx.actorId ?? LOCAL_AUTHOR.id, input.hitIds)
    }),
})
