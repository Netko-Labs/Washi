import { z } from 'zod'

/** What a new workspace starts with (D105); an unset field keeps Washi's own default. */
export const workspaceDefaultsSchema = z.object({
  approvalMode: z.enum(['ask', 'auto']).optional(),
  dailyCapUsd: z.number().positive().max(10_000).optional(),
  turnCap: z.number().int().positive().max(100_000).optional(),
})
export type WorkspaceDefaults = z.infer<typeof workspaceDefaultsSchema>

/** A host list as an admin types it: addresses, bare names, or `*.suffix` for fetches. */
export const hostListSchema = z.array(z.string().trim().min(1).max(260)).max(128)

/** The server's say over every workspace on it. Absent (embedded): adds nothing, takes nothing. */
export const serverPolicySchema = z.object({
  fetchHosts: z.array(z.string()).default([]),
  embedHosts: z.array(z.string()).default([]),
  widgets: z.boolean().default(true),
  defaults: workspaceDefaultsSchema.default({}),
})
export type ServerPolicy = z.infer<typeof serverPolicySchema>

/** A model key as an owner or admin pastes it — a workspace's or the server's, the same shape. */
export const agentCredentialSchema = z.object({
  key: z.string().min(8),
  // OpenRouter reaches hundreds of models with one key, so the model is part of the credential.
  provider: z.enum(['anthropic', 'openrouter']).default('anthropic'),
  model: z.string().min(1).max(200).nullish(),
})

/** Null takes the provider's default. */
export const agentModelSchema = z.string().min(1).max(200).nullable()
