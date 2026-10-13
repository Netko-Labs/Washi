import { publicProcedure, router } from '../../init'

export const systemQueries = router({
  ping: publicProcedure.query(() => 'pong' as const),
  appInfo: publicProcedure.query(() => ({ name: 'Washi', version: '0.1.0' })),
  mode: publicProcedure.query(({ ctx }) => ({ mode: ctx.mode, workspaceId: ctx.workspaceId })),
})
