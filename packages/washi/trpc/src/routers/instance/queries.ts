import { adminProcedure, publicProcedure, router } from '../../init'

export const instanceQueries = router({
  /** Whether this person runs the server itself — the Server tab shows only for them. */
  me: publicProcedure.query(async ({ ctx }) => {
    const store = ctx.runtime.control.instance
    return { isAdmin: Boolean(store && ctx.actorId && (await store.isAdmin(ctx.actorId))) }
  }),
  settings: adminProcedure.query(async ({ ctx }) => ({
    signup: await ctx.instance.signup(),
    key: await ctx.instance.keyInfo(),
    searchKey: await ctx.instance.searchKeyInfo(),
    ...ctx.instance.policy(),
  })),
})
