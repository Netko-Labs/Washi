import { tracked } from '@trpc/server'
import { z } from 'zod'
import { publicProcedure, router } from '../../init'

/** Registered unconditionally; only a dev-only menu ever emits on this channel. */
export const devSubscriptions = router({
  onDevCommand: publicProcedure
    .input(z.object({ lastEventId: z.string().nullish() }).optional())
    .subscription(async function* ({ ctx, input, signal }) {
      for await (const event of ctx.events.subscribe('devCommand', {
        lastEventId: input?.lastEventId,
        signal,
      })) {
        yield tracked(event.id, event.data)
      }
    }),
})
