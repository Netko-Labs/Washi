import { requestedAskSchema } from '@washi/domain'
import { guestOfRecord, requestedSpans, suggestionInbox, unreadSuggestions } from '@washi/service'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

export const suggestionQueries = router({
  /** Pending suggestions on the pages the caller reads (D120). */
  inbox: workspaceProcedure.query(({ ctx }) => suggestionInbox(ctx.ws, ctx.viewer)),
  unread: workspaceProcedure.query(({ ctx }) => unreadSuggestions(ctx.ws, ctx.viewer)),
  /** Who asked for this row through a link, once approved (D131); null for a row a member made. */
  guest: workspaceProcedure
    .input(z.object({ recordId: z.string().min(1).max(80) }))
    .query(({ ctx, input }) => guestOfRecord(ctx.ws, input.recordId, ctx.viewer)),
  /** Pending times on a table's date column: members read every table, so only the times. */
  requested: workspaceProcedure
    .input(requestedAskSchema)
    .query(({ ctx, input }) => requestedSpans(ctx.ws, input)),
})
