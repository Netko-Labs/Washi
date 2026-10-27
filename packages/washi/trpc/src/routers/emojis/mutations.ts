import { customEmojiWriteSchema } from '@washi/domain'
import { addCustomEmoji, LOCAL_AUTHOR, removeCustomEmoji } from '@washi/service'
import { z } from 'zod'
import { isSteward, router, workspaceProcedure } from '../../init'

export const emojiMutations = router({
  /** The picture goes through `/api/files` first; this names it. */
  add: workspaceProcedure
    .input(customEmojiWriteSchema)
    .mutation(({ ctx, input }) =>
      addCustomEmoji(ctx.ws, ctx.files, input, ctx.actor?.id ?? LOCAL_AUTHOR.id),
    ),
  remove: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const remover = { id: ctx.actor?.id ?? LOCAL_AUTHOR.id, mayRemoveAny: await isSteward(ctx) }
      const { freed } = removeCustomEmoji(ctx.ws, input.id, remover)
      if (freed) await ctx.files.remove(freed)
      return { removed: true }
    }),
})
