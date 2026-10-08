import { z } from 'zod'

export const agentSessionSchema = z.object({
  id: z.string(),
  provider: z.string(),
  title: z.string(),
  status: z.enum(['idle', 'running', 'error']),
  costUsd: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type AgentSession = z.infer<typeof agentSessionSchema>

/**
 * Who paid for a turn. `metered` bills an API key; `plan` ran through a local
 * Claude login whose subscription already covers it.
 */
export const turnBillingSchema = z.enum(['metered', 'plan'])
export type TurnBilling = z.infer<typeof turnBillingSchema>

/**
 * ACP-shaped transcript events. One vocabulary for every provider: the UI
 * renders these, the repository persists them, the agent host emits them.
 */
export const agentUpdateSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('user_message'), text: z.string() }),
  z.object({ kind: z.literal('message_chunk'), text: z.string() }),
  z.object({
    kind: z.literal('tool_call'),
    toolCallId: z.string(),
    title: z.string(),
    toolKind: z.enum(['read', 'edit', 'delete', 'search', 'fetch', 'execute', 'think', 'other']),
    status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
    input: z.unknown().optional(),
  }),
  z.object({
    kind: z.literal('tool_call_update'),
    toolCallId: z.string(),
    status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
    output: z.string().optional(),
    diff: z.object({ path: z.string(), oldText: z.string(), newText: z.string() }).optional(),
  }),
  z.object({
    kind: z.literal('turn_done'),
    stopReason: z.enum(['end_turn', 'max_tokens', 'refusal', 'cancelled', 'error']),
    /** What the turn cost — or, under `plan`, what it would have cost on a key. */
    costUsd: z.number().optional(),
    error: z.string().optional(),
    billing: turnBillingSchema.optional(),
    model: z.string().optional(),
    durationMs: z.number().optional(),
  }),
])
export type AgentUpdate = z.infer<typeof agentUpdateSchema>

export interface TranscriptEntry {
  id: string
  seq: number
  update: AgentUpdate
  createdAt: string
}

export const approvalRequestSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  toolName: z.string(),
  /** Optional because JSON drops undefined — the wire type is the honest one. */
  input: z.unknown().optional(),
  createdAt: z.string(),
})
export type ApprovalRequest = z.infer<typeof approvalRequestSchema>

export type ApprovalDecision = 'allow_once' | 'allow_always' | 'reject_once'

/** A prompt Washi runs on its own once a day. Writes still wait for a person. */
export const routineSchema = z.object({
  id: z.string(),
  title: z.string(),
  prompt: z.string(),
  minuteUtc: z.number().int().min(0).max(1439),
  enabled: z.boolean(),
  lastRunDay: z.string().nullable(),
  sessionId: z.string().nullable(),
  createdBy: z.string().nullable(),
  createdAt: z.string(),
})
export type Routine = z.infer<typeof routineSchema>

export const routineCreateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  prompt: z.string().trim().min(1).max(4000),
  minuteUtc: z.number().int().min(0).max(1439),
})
export type RoutineCreate = z.infer<typeof routineCreateSchema>
