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

/** Mutations, not queries: a candidate config carries a secret, and a query rides in the URL. */
export const storageMutations = router({
  test: ownerProcedure
    .input(storageConfigSchema)
    .mutation(({ ctx, input }) => testStorage(input, ctx.workspaceId)),
  /** Only a bucket that just took, handed back and deleted a test file. */
  set: ownerProcedure.input(storageConfigSchema).mutation(async ({ ctx, input }) => {
    const storage = requireStorage(ctx)
    if (!ctx.actorId) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'sign in to choose a bucket' })
    }
    const result = await testStorage(input, ctx.workspaceId)
    if (!result.ok) throw new TRPCError({ code: 'BAD_REQUEST', message: result.reason })
    return storage.set(ctx.workspaceId, ctx.actorId, input)
  }),
  /** Back to the server's store. Files already in the bucket stay there, untouched. */
  remove: ownerProcedure.mutation(async ({ ctx }) => {
    await requireStorage(ctx).remove(ctx.workspaceId)
    return { removed: true }
  }),
})
