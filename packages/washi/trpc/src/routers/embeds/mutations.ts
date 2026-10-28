import { setEmbedHosts } from '@washi/service'
import { z } from 'zod'
import { ownerProcedure, router } from '../../init'

/** What every reader's browser will load: an owner's or admin's call, like what leaves the server. */
export const embedMutations = router({
  setHosts: ownerProcedure
    .input(z.object({ hosts: z.array(z.string().min(1).max(260)).max(64) }))
    .mutation(({ ctx, input }) => setEmbedHosts(ctx.ws, input.hosts)),
})
