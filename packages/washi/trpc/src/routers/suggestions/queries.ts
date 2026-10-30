import { requestedAskSchema } from '@washi/domain'
import { requestedSpans, suggestionInbox, unreadSuggestions } from '@washi/service'
import { router, workspaceProcedure } from '../../init'

export const suggestionQueries = router({
  /** Pending suggestions on the pages the caller reads (D120). */
  inbox: workspaceProcedure.query(({ ctx }) => suggestionInbox(ctx.ws, ctx.viewer)),
  unread: workspaceProcedure.query(({ ctx }) => unreadSuggestions(ctx.ws, ctx.viewer)),
  /** Pending times on a table's date column: members read every table, so only the times. */
  requested: workspaceProcedure
    .input(requestedAskSchema)
    .query(({ ctx, input }) => requestedSpans(ctx.ws, input)),
})
