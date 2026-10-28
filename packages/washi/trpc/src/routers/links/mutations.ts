import { TRPCError } from '@trpc/server'
import { linkPreview, TsuruError } from '@washi/tsuru'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

/**
 * A person turning a link into a bookmark: their press is the consent for that one host. tsuru keeps
 * its refusals — https only, no private ranges, redirects re-checked, the body capped.
 */
export const linkMutations = router({
  preview: workspaceProcedure
    .input(z.object({ href: z.url({ protocol: /^https$/ }) }))
    .mutation(async ({ input }) => {
      try {
        return await linkPreview(input.href)
      } catch (cause) {
        if (cause instanceof TsuruError) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: cause.message, cause })
        }
        throw cause
      }
    }),
})
