import { TRPCError } from '@trpc/server'
import { unsplashPhotoIdSchema } from '@washi/domain'
import { keepUnsplashPhoto, recordCapability, type Workspace } from '@washi/repository'
import { TsuruError, unsplashDownload, unsplashPhoto, unsplashSearch } from '@washi/tsuru'
import { z } from 'zod'
import { type Context, router, workspaceProcedure } from '../../init'

const NO_KEY =
  'No Unsplash key here yet. An owner adds one in Settings → Washi → What leaves, or the server’s admin in Settings → Server.'

async function accessKeyOf(ctx: Context): Promise<string> {
  const accessKey = await ctx.runtime.unsplashKey?.(ctx.workspaceId)
  if (!accessKey) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: NO_KEY })
  return accessKey
}

/**
 * A person's press is the consent for one call to Unsplash; the ledger keeps it either way, as it
 * keeps every press that reaches out. tsuru keeps its refusals: https, api.unsplash.com, nothing else.
 */
async function ledgered<T>(
  ws: Workspace,
  actorId: string | null,
  call: { subject: string; input: unknown },
  run: () => Promise<T>,
): Promise<T> {
  const entry = { origin: 'sheet' as const, actorId, ...call }
  let result: T
  try {
    result = await run()
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause)
    const decision = cause instanceof TsuruError ? 'denied' : 'auto'
    recordCapability(ws, { ...entry, decision, detail })
    if (cause instanceof TsuruError) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: cause.message, cause })
    }
    throw cause
  }
  recordCapability(ws, { ...entry, decision: 'auto' })
  return result
}

export const unsplashMutations = router({
  search: workspaceProcedure
    .input(
      z.object({
        query: z.string().trim().min(1).max(100),
        page: z.number().int().min(1).max(50).default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const accessKey = await accessKeyOf(ctx)
      const call = { subject: 'unsplash_search', input }
      return ledgered(ctx.ws, ctx.actor?.id ?? null, call, () =>
        unsplashSearch({ ...input, accessKey }),
      )
    }),
  /**
   * A photo picked for a cover or a figure: read again from Unsplash by id, kept with its credit,
   * and counted as a download, as Unsplash's guidelines ask.
   */
  use: workspaceProcedure
    .input(z.object({ id: unsplashPhotoIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const accessKey = await accessKeyOf(ctx)
      const call = { subject: 'unsplash_use', input }
      const photo = await ledgered(ctx.ws, ctx.actor?.id ?? null, call, () =>
        unsplashPhoto(input.id, { accessKey }),
      )
      const kept = keepUnsplashPhoto(
        ctx.ws,
        {
          id: photo.id,
          regularUrl: photo.urls.regular,
          fullUrl: photo.urls.full,
          photographer: photo.photographer.name,
          profileUrl: photo.photographer.profileUrl,
          pageUrl: photo.pageUrl,
        },
        ctx.actor?.id ?? null,
      )
      // A count Unsplash misses (a 429, an outage) is its statistic, never the person's photo.
      void unsplashDownload(photo.downloadLocation, { accessKey }).catch(() => undefined)
      return { ...kept, alt: photo.alt }
    }),
})
