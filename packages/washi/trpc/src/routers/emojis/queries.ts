import { listCustomEmojis } from '@washi/repository'
import { router, workspaceProcedure } from '../../init'

export const emojiQueries = router({
  list: workspaceProcedure.query(({ ctx }) => listCustomEmojis(ctx.ws)),
})
