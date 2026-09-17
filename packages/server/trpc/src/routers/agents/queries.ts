import { getTranscript, listSessions } from '@washi/repository'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

export const agentQueries = router({
  listSessions: workspaceProcedure.query(({ ctx }) => listSessions(ctx.ws)),
  transcript: workspaceProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(({ ctx, input }) => getTranscript(ctx.ws, input.sessionId)),
})
