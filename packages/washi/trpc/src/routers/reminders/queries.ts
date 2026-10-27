import { LOCAL_AUTHOR, listReminderRules, reminderInbox, unreadReminders } from '@washi/service'
import { router, workspaceProcedure } from '../../init'

export const reminderQueries = router({
  list: workspaceProcedure.query(({ ctx }) => listReminderRules(ctx.ws)),
  /** The caller's hits, newest first: everyone's, and the rows whose person column names them. */
  inbox: workspaceProcedure.query(({ ctx }) =>
    reminderInbox(ctx.ws, ctx.actorId ?? LOCAL_AUTHOR.id),
  ),
  unread: workspaceProcedure.query(({ ctx }) =>
    unreadReminders(ctx.ws, ctx.actorId ?? LOCAL_AUTHOR.id),
  ),
})
