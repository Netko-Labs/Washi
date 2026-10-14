import { countUnreadMentions, listComments, listMentions } from '@washi/repository'
import { LOCAL_AUTHOR } from '@washi/service'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

export const commentQueries = router({
  list: workspaceProcedure
    .input(z.object({ sheetId: z.string() }))
    .query(({ ctx, input }) => listComments(ctx.ws, input.sheetId)),
  mentions: workspaceProcedure.query(({ ctx }) =>
    listMentions(ctx.ws, ctx.actor?.id ?? LOCAL_AUTHOR.id),
  ),
  unreadMentions: workspaceProcedure.query(({ ctx }) =>
    countUnreadMentions(ctx.ws, ctx.actor?.id ?? LOCAL_AUTHOR.id),
  ),
})
