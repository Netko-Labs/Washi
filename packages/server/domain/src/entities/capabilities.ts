import { z } from 'zod'

/**
 * The capability ledger (spec §09). Every side effect a sheet or an agent
 * triggers leaves a row here — the audit trail the trust model promises, and
 * the data the Inbox currently fakes.
 */
export const capabilityOriginSchema = z.enum(['agent', 'sheet'])
export type CapabilityOrigin = z.infer<typeof capabilityOriginSchema>

/** `auto` is a click on a reversible verb: consent without a prompt (Q13). */
export const capabilityDecisionSchema = z.enum(['auto', 'allowed', 'denied'])
export type CapabilityDecision = z.infer<typeof capabilityDecisionSchema>

export const capabilityCallSchema = z.object({
  id: z.string(),
  origin: capabilityOriginSchema,
  /** Which human, once a workspace has more than one. Null in embedded mode. */
  actorId: z.string().nullable(),
  subject: z.string(),
  input: z.unknown(),
  decision: capabilityDecisionSchema,
  detail: z.string().nullable(),
  createdAt: z.string(),
})
export type CapabilityCall = z.infer<typeof capabilityCallSchema>

export interface CapabilityWrite {
  origin: CapabilityOrigin
  actorId?: string | null
  subject: string
  input?: unknown
  decision: CapabilityDecision
  detail?: string
}
