import { setEmbedHosts, setWidgetHosts, setWidgetsEnabled } from '@washi/service'
import { z } from 'zod'
import { ownerProcedure, router } from '../../init'

/** What every reader's browser will load: an owner's or admin's call, like what leaves the server. */
export const embedMutations = router({
  setHosts: ownerProcedure
    .input(z.object({ hosts: z.array(z.string().min(1).max(260)).max(64) }))
    .mutation(({ ctx, input }) => setEmbedHosts(ctx.ws, input.hosts)),
  /** Sites a widget's frame may reach (D118): what page code could send its reader's data to. */
  setWidgetHosts: ownerProcedure
    .input(z.object({ hosts: z.array(z.string().min(1).max(260)).max(64) }))
    .mutation(({ ctx, input }) => setWidgetHosts(ctx.ws, input.hosts)),
  /** Widgets run a page's own HTML: a standing yes only an owner or admin may give. */
  setWidgets: ownerProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(({ ctx, input }) => setWidgetsEnabled(ctx.ws, input.enabled)),
})
