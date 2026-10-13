import { publicProcedure, router, workspaceProcedure } from '../../init'

export const workspaceQueries = router({
  /** What this actor may open. Embedded returns its single local workspace. */
  list: publicProcedure.query(({ ctx }) => ctx.runtime.control.listWorkspaces(ctx.actorId)),
  me: publicProcedure.query(({ ctx }) => ({
    actor: ctx.actor,
    mode: ctx.mode,
    workspaceId: ctx.workspaceId,
  })),
  /** Never the key — only enough to show "set" versus "not set". */
  agentKey: workspaceProcedure.query(
    ({ ctx }) => ctx.runtime.control.secrets?.info(ctx.workspaceId) ?? null,
  ),
})
