import { router, workspaceProcedure } from '../../init'

export const tokenQueries = router({
  /** This person's tokens for this workspace; a server with no token store has none. */
  list: workspaceProcedure.query(async ({ ctx }) => {
    const { tokens } = ctx.runtime.control
    if (!tokens || !ctx.actorId) return { isAvailable: false, tokens: [] }
    return { isAvailable: true, tokens: await tokens.list(ctx.actorId, ctx.workspaceId) }
  }),
})
