import { z } from 'zod'
import { CODE_LIMITS, codeLimitsSchema, SAFEGUARDS_ON, safeguardsSchema } from './safeguards'

/** What a new workspace starts with (D105); an unset field keeps Washi's own default. */
export const workspaceDefaultsSchema = z.object({
  approvalMode: z.enum(['ask', 'auto']).optional(),
  dailyCapUsd: z.number().positive().max(10_000).optional(),
  turnCap: z.number().int().positive().max(100_000).optional(),
})
export type WorkspaceDefaults = z.infer<typeof workspaceDefaultsSchema>

/** A host list as an admin types it: addresses, bare names, `*.domain` or a bare `*` (D118). */
export const hostListSchema = z.array(z.string().trim().min(1).max(260)).max(128)

/** An npm package page code may import (D116): as the admin asked for it, and what it became. */
export const pagePackageSchema = z.object({
  name: z.string().min(1).max(214),
  /** An exact version, a range or a dist-tag, as typed. */
  spec: z.string().min(1).max(64),
  /** Exact, once an install resolved it; null until one has. */
  version: z.string().min(1).max(64).nullable(),
})
export type PagePackage = z.infer<typeof pagePackageSchema>

/** The server's say over every workspace on it. Absent (embedded): adds nothing, takes nothing. */
export const serverPolicySchema = z.object({
  fetchHosts: z.array(z.string()).default([]),
  embedHosts: z.array(z.string()).default([]),
  widgetHosts: z.array(z.string()).default([]),
  widgets: z.boolean().default(true),
  defaults: workspaceDefaultsSchema.default({}),
  pagePackages: z.array(pagePackageSchema).default([]),
  safeguards: safeguardsSchema.default(SAFEGUARDS_ON),
  limits: codeLimitsSchema.default(CODE_LIMITS),
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

/** An integration key as an owner or admin pastes it — a workspace's Exa key or the server's. */
export const integrationKeySchema = z.object({ key: z.string().min(8) })

/** The server's page packages installed and ready, and the folder whose node_modules holds them. */
export interface PagePackageSet {
  dir: string
  packages: { name: string; version: string }[]
}
