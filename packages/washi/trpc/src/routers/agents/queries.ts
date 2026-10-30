import { getTranscript, isSessionVisible, listSessions, searchChats } from '@washi/repository'
import { movedFrom, serverApprovesAll } from '@washi/service'
import { z } from 'zod'
import { pageProcedure, router, workspaceProcedure } from '../../init'
import { chatProcedure } from '../../shared/chats'

const SEARCH_LIMIT = 30

export const agentQueries = router({
  /** Your chats and the workspace's, newest first (D67). */
  listSessions: workspaceProcedure.query(({ ctx }) => listSessions(ctx.ws, ctx.viewer.id)),
  /** Every word, as a prefix, in a chat's title or anything said in it. */
  searchChats: workspaceProcedure
    .input(z.object({ text: z.string().trim().min(1).max(200) }))
    .query(({ ctx, input }) => searchChats(ctx.ws, ctx.viewer.id, input.text, SEARCH_LIMIT)),
  /** What today cost and whether the breaker is holding the next turn. */
  spend: workspaceProcedure.query(({ ctx }) => ctx.host.spend()),
  /** The stop's settings and the workspace's standing choices: who resumes, the default effort. */
  settings: workspaceProcedure.query(({ ctx }) => ctx.host.settings()),
  /** Ask (the default) or auto; `server` is the admin's yes for every workspace, which wins (D118). */
  approvalMode: workspaceProcedure.query(({ ctx }) => ({
    mode: ctx.host.approvalMode(),
    server: serverApprovesAll(ctx.ws),
  })),
  /** Idle, working, waiting on a person, or paused — plus today's numbers. Cheap; poll it. */
  status: workspaceProcedure.query(({ ctx }) => ctx.host.activity()),
  /** What the next turn will run on. Embedded probes the local Claude CLI, so not free. */
  inference: workspaceProcedure.query(({ ctx }) => ctx.host.inference()),
  /** Whether page and table changes skip the desk. Outbound actions always ask. */
  /** What Washi is waiting on right now — so a panel opened late can still answer. */
  pendingApprovals: workspaceProcedure.query(({ ctx }) =>
    ctx.host
      .pendingApprovals()
      .filter((request) => isSessionVisible(ctx.ws, request.sessionId, ctx.viewer.id)),
  ),
  /** The last day's turns with their receipts, what is waiting on a person, and the spend. */
  today: workspaceProcedure.query(({ ctx }) => {
    const report = ctx.host.today(ctx.viewer.id)
    return {
      ...report,
      pending: report.pending.filter((request) =>
        isSessionVisible(ctx.ws, request.sessionId, ctx.viewer.id),
      ),
    }
  }),
  /** The newest of your chats that left this page and is still away (D110). */
  movedFrom: pageProcedure
    .input(z.object({ sheetId: z.string() }))
    .query(({ ctx, input }) => movedFrom(ctx.ws, input.sheetId, ctx.viewer)),
  transcript: chatProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(({ ctx, input }) => getTranscript(ctx.ws, input.sessionId)),
})
