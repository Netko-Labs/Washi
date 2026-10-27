import { TRPCError } from '@trpc/server'
import { isSessionVisible } from '@washi/repository'
import { workspaceProcedure } from '../../init'

/**
 * A procedure about one chat: a `sessionId` in its input must be the asker's or the workspace's
 * (D67), or it answers NOT_FOUND — someone else's chat is not there, not forbidden.
 */
export const chatProcedure = workspaceProcedure.use(async ({ ctx, getRawInput, next }) => {
  const input = (await getRawInput().catch(() => null)) as Record<string, unknown> | null
  const sessionId = input?.sessionId
  if (typeof sessionId === 'string' && !isSessionVisible(ctx.ws, sessionId, ctx.viewer.id)) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'no such chat' })
  }
  return next()
})
