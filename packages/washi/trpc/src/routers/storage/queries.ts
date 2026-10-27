import { router, workspaceProcedure } from '../../init'

export const storageQueries = router({
  /** Where new uploads go. Everyone may read it; the secret never comes back. */
  get: workspaceProcedure.query(async ({ ctx }) => {
    const store = ctx.runtime.control.storage
    const config = store ? await store.info(ctx.workspaceId) : null
    return { isAvailable: Boolean(store), isServerDefault: !config, config }
  }),
})
