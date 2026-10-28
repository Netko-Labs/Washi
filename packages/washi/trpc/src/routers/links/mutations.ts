import { TRPCError } from '@trpc/server'
import { recordCapability } from '@washi/repository'
import { linkPreview, TsuruError } from '@washi/tsuru'
import { z } from 'zod'
import { router, workspaceProcedure } from '../../init'

/**
 * A person turning a link into a bookmark: their press is the consent for that one host. tsuru keeps
 * its refusals — https only, no private ranges, redirects re-checked, the body capped — and the
 * ledger keeps the request either way, as it keeps every press that reaches out.
 */
export const linkMutations = router({
  preview: workspaceProcedure
    .input(z.object({ href: z.url({ protocol: /^https$/ }) }))
    .mutation(async ({ ctx, input }) => {
      const entry = {
        origin: 'sheet' as const,
        actorId: ctx.actor?.id ?? null,
        subject: 'link_preview',
        input,
      }
      try {
        const preview = await linkPreview(input.href)
        recordCapability(ctx.ws, { ...entry, decision: 'auto' })
        return preview
      } catch (cause) {
        const detail = cause instanceof Error ? cause.message : String(cause)
        recordCapability(ctx.ws, {
          ...entry,
          decision: cause instanceof TsuruError ? 'denied' : 'auto',
          detail,
        })
        if (cause instanceof TsuruError) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: cause.message, cause })
        }
        throw cause
      }
    }),
})
