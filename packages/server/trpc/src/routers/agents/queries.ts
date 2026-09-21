import { getTranscript, listSessions } from '@washi/repository'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

export const agentQueries = router({
  listSessions: workspaceProcedure.query(({ ctx }) => listSessions(ctx.ws)),
  /** What today cost and whether the breaker is holding the next turn. */
  spend: workspaceProcedure.query(({ ctx }) => ctx.host.spend()),
  transcript: workspaceProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(({ ctx, input }) => getTranscript(ctx.ws, input.sessionId)),
})
