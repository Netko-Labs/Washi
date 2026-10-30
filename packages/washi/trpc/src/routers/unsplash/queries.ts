import { listUnsplashPhotos } from '@washi/repository'
import { router, workspaceProcedure } from '../../init'

export const unsplashQueries = router({
  /** Whether a key reaches Unsplash from here — the workspace's or the server's — never which. */
  status: workspaceProcedure.query(async ({ ctx }) => ({
    ready: (await ctx.runtime.unsplashKey?.(ctx.workspaceId)) != null,
  })),
  /** Every photo a page here picked: a cover draws from this, never from Unsplash per view. */
  photos: workspaceProcedure.query(({ ctx }) => listUnsplashPhotos(ctx.ws)),
})
