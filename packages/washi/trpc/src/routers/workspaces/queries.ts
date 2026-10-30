import { z } from 'zod'
import { INTEGRATIONS, publicProcedure, router, workspaceProcedure } from '../../init'
import type { ServerKeyUse } from '../../shared/instance'

export const workspaceQueries = router({
  /** What this actor may open. Embedded returns its single local workspace. */
  list: publicProcedure.query(({ ctx }) => ctx.runtime.control.listWorkspaces(ctx.actorId)),
  me: publicProcedure.query(({ ctx }) => ({
    actor: ctx.actor,
    mode: ctx.mode,
    workspaceId: ctx.workspaceId,
  })),
  members: workspaceProcedure.query(({ ctx }) => ctx.runtime.control.listMembers(ctx.workspaceId)),
  /** Never the key — only enough to show "set" versus "not set". */
  agentKey: workspaceProcedure.query(
    ({ ctx }) => ctx.runtime.control.secrets?.info(ctx.workspaceId) ?? null,
  ),
  /** Whether the server lends its key to a workspace without one (D105) — never even its last four. */
  serverKey: workspaceProcedure.query(async ({ ctx }): Promise<ServerKeyUse | null> => {
    const info = await ctx.runtime.control.instance?.keyInfo()
    return info ? { provider: info.provider, model: info.model } : null
  }),
  /** Whether web search falls back to the server's Exa key here — a yes or no, nothing more. */
  serverSearchKey: workspaceProcedure.query(
    async ({ ctx }) => (await ctx.runtime.control.instance?.searchKeyInfo()) != null,
  ),
  /** The same yes or no for Unsplash (D117). */
  serverUnsplashKey: workspaceProcedure.query(
    async ({ ctx }) => (await ctx.runtime.control.instance?.unsplashKeyInfo()) != null,
  ),
  integrationKey: workspaceProcedure
    .input(z.object({ integration: z.enum(INTEGRATIONS) }))
    .query(
      ({ ctx, input }) =>
        ctx.runtime.control.secrets?.integrationInfo(ctx.workspaceId, input.integration) ?? null,
    ),
})
