import {
  agentCredentialSchema,
  agentModelSchema,
  hostListSchema,
  integrationKeySchema,
  workspaceDefaultsSchema,
} from '@washi/domain'
import { embedHostList, fetchHostList, PagePackageError, pagePackageSpec } from '@washi/service'
import { z } from 'zod'
import { adminProcedure, router } from '../../init'
import { SIGNUP_MODES } from '../../shared/instance'

export const instanceMutations = router({
  setSignup: adminProcedure
    .input(z.object({ mode: z.enum(SIGNUP_MODES) }))
    .mutation(({ ctx, input }) => ctx.instance.setSignup(input.mode)),
  /** Write-only like a workspace key: the key goes in, only `last4` comes back out. */
  setKey: adminProcedure
    .input(agentCredentialSchema)
    .mutation(({ ctx, input }) =>
      ctx.instance.setKey(ctx.adminId, { ...input, model: input.model ?? null }),
    ),
  setKeyModel: adminProcedure
    .input(z.object({ model: agentModelSchema }))
    .mutation(async ({ ctx, input }) => {
      await ctx.instance.setKeyModel(ctx.adminId, input.model)
      return { model: input.model }
    }),
  removeKey: adminProcedure.mutation(async ({ ctx }) => {
    await ctx.instance.removeKey()
    return { removed: true }
  }),
  /** Exa for every workspace without its own; write-only like the model key. */
  setSearchKey: adminProcedure
    .input(integrationKeySchema)
    .mutation(({ ctx, input }) => ctx.instance.setSearchKey(ctx.adminId, input.key)),
  removeSearchKey: adminProcedure.mutation(async ({ ctx }) => {
    await ctx.instance.removeSearchKey()
    return { removed: true }
  }),
  /** Unsplash for every workspace without its own Access Key (D117); write-only the same way. */
  setUnsplashKey: adminProcedure
    .input(integrationKeySchema)
    .mutation(({ ctx, input }) => ctx.instance.setUnsplashKey(ctx.adminId, input.key)),
  removeUnsplashKey: adminProcedure.mutation(async ({ ctx }) => {
    await ctx.instance.removeUnsplashKey()
    return { removed: true }
  }),
  /** Hosts every workspace may fetch without asking; tsuru's refusals still refuse. */
  setFetchHosts: adminProcedure
    .input(z.object({ hosts: hostListSchema }))
    .mutation(async ({ ctx, input }) => {
      const hosts = fetchHostList(input.hosts)
      await ctx.instance.setFetchHosts(hosts)
      return hosts
    }),
  setEmbedHosts: adminProcedure
    .input(z.object({ hosts: hostListSchema }))
    .mutation(async ({ ctx, input }) => {
      const hosts = embedHostList(input.hosts)
      await ctx.instance.setEmbedHosts(hosts)
      return hosts
    }),
  /** Off is off for every workspace; on, each workspace still decides for itself. */
  setWidgets: adminProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.instance.setWidgets(input.enabled)
      return input.enabled
    }),
  /** Listed at once, installed on the server after (D116): the row says installing, ready or why not. */
  addPagePackage: adminProcedure
    .input(z.object({ spec: z.string().max(300) }))
    .mutation(({ ctx, input }) => {
      const store = ctx.runtime.pagePackages
      if (!store) throw new PagePackageError('this server installs no page packages')
      return store.add(pagePackageSpec(input.spec))
    }),
  /** Pages importing it stop running, with the reason in words; nothing else changes. */
  removePagePackage: adminProcedure
    .input(z.object({ name: z.string().min(1).max(214) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.runtime.pagePackages?.remove(input.name)
      return { removed: true }
    }),
  /** Only a workspace made from now on starts with these; existing ones keep their own. */
  setDefaults: adminProcedure.input(workspaceDefaultsSchema).mutation(async ({ ctx, input }) => {
    await ctx.instance.setDefaults(input)
    return input
  }),
})
