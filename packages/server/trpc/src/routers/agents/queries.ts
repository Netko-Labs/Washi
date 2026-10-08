import { getTranscript, listSessions } from '@washi/repository'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

export const agentQueries = router({
  listSessions: workspaceProcedure.query(({ ctx }) => listSessions(ctx.ws)),
  /** What today cost and whether the breaker is holding the next turn. */
  spend: workspaceProcedure.query(({ ctx }) => ctx.host.spend()),
  /** Idle, working, waiting on a person, or paused — plus today's numbers. Cheap; poll it. */
  status: workspaceProcedure.query(({ ctx }) => ctx.host.activity()),
  /** What the next turn will run on. Embedded probes the local Claude CLI, so not free. */
  inference: workspaceProcedure.query(({ ctx }) => ctx.host.inference()),
  transcript: workspaceProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(({ ctx, input }) => getTranscript(ctx.ws, input.sessionId)),
})
