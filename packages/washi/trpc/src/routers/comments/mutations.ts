import { commentWriteSchema } from '@washi/domain'
import { markMentionsRead } from '@washi/repository'
import { LOCAL_AUTHOR, postComment, removeComment, resolveThread } from '@washi/service'
import { z } from 'zod'
import { pageProcedure, router, workspaceProcedure } from '../../init'

export const commentMutations = router({
  post: pageProcedure
    .input(commentWriteSchema)
    .mutation(({ ctx, input }) => postComment(ctx.ws, input, ctx.actor ?? LOCAL_AUTHOR)),
  resolve: workspaceProcedure
    .input(z.object({ threadId: z.string(), resolved: z.boolean() }))
    .mutation(({ ctx, input }) => {
      resolveThread(ctx.ws, input.threadId, input.resolved)
    }),
  remove: workspaceProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) => {
    removeComment(ctx.ws, input.id, ctx.actor?.id ?? LOCAL_AUTHOR.id)
  }),
  markRead: pageProcedure
    .input(
      z.object({
        commentIds: z.array(z.string()).max(200).optional(),
        sheetId: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      markMentionsRead(ctx.ws, ctx.actor?.id ?? LOCAL_AUTHOR.id, input)
    }),
})
