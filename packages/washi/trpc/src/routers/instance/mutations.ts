import {
  agentCredentialSchema,
  agentModelSchema,
  hostListSchema,
  workspaceDefaultsSchema,
} from '@washi/domain'
import { embedHostList, fetchHostList } from '@washi/service'
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
  /** Only a workspace made from now on starts with these; existing ones keep their own. */
  setDefaults: adminProcedure.input(workspaceDefaultsSchema).mutation(async ({ ctx, input }) => {
    await ctx.instance.setDefaults(input)
    return input
  }),
})
