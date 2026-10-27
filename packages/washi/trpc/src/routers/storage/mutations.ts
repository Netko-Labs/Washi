import { TRPCError } from '@trpc/server'
import { storageConfigSchema } from '@washi/domain'
import { testStorage } from '@washi/service'
import { ownerProcedure, router } from '../../init'
import type { StorageStore } from '../../shared/storage'

function requireStorage(ctx: { runtime: { control: { storage?: StorageStore } } }) {
  const { storage } = ctx.runtime.control
  if (!storage) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'this deployment keeps files on its own disk — there is no bucket to choose',
    })
  }
  return storage
}

/** Only the app admin may point a workspace at the server's own network (a MinIO beside it). */
async function mayUsePrivate(ctx: {
  actorId: string | null
  runtime: { control: { instance?: { isAdmin(actorId: string): Promise<boolean> } } }
}): Promise<boolean> {
  const { instance } = ctx.runtime.control
  return Boolean(ctx.actorId && instance && (await instance.isAdmin(ctx.actorId)))
}

/** Mutations, not queries: a candidate config carries a secret, and a query rides in the URL. */
export const storageMutations = router({
  test: ownerProcedure
    .input(storageConfigSchema)
    .mutation(async ({ ctx, input }) =>
      testStorage(input, ctx.workspaceId, { allowPrivate: await mayUsePrivate(ctx) }),
    ),
  /** Only a bucket that just took, handed back and deleted a test file. */
  set: ownerProcedure.input(storageConfigSchema).mutation(async ({ ctx, input }) => {
    const storage = requireStorage(ctx)
    if (!ctx.actorId) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'sign in to choose a bucket' })
    }
    const result = await testStorage(input, ctx.workspaceId, {
      allowPrivate: await mayUsePrivate(ctx),
    })
    if (!result.ok) throw new TRPCError({ code: 'BAD_REQUEST', message: result.reason })
    return storage.set(ctx.workspaceId, ctx.actorId, input)
  }),
  /** Back to the server's store. Files already in the bucket stay there, untouched. */
  remove: ownerProcedure.mutation(async ({ ctx }) => {
    await requireStorage(ctx).remove(ctx.workspaceId)
    return { removed: true }
  }),
})
