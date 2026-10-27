import { z } from 'zod'
import { dailyCron, isCron } from '../shared/cron'

/** How hard Washi thinks, in words; the SDK's low · medium · high behind them. */
export const effortSchema = z.enum(['quick', 'balanced', 'deep'])
export type Effort = z.infer<typeof effortSchema>

/** How far a chat's anchor reaches: its page alone, or the page and everything under it (D67). */
export const chatAnchorScopeSchema = z.enum(['page', 'subtree'])
export type ChatAnchorScope = z.infer<typeof chatAnchorScopeSchema>

export const chatAnchorSchema = z.object({
  sheetId: z.string().min(1),
  scope: chatAnchorScopeSchema,
})
export type ChatAnchor = z.infer<typeof chatAnchorSchema>

export const agentSessionSchema = z.object({
  id: z.string(),
  provider: z.string(),
  title: z.string(),
  status: z.enum(['idle', 'running', 'error']),
  costUsd: z.number(),
  /** A conversation's own choices; null takes the workspace default (D61). */
  model: z.string().nullable(),
  effort: effortSchema.nullable(),
  /** Whose chat it is; null is the workspace's — a routine's runs, and every chat before D67. */
  createdBy: z.string().nullable(),
  anchor: chatAnchorSchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

/** A model the workspace offers in the composer; the name is the catalogue's, kept for the label. */
export const enabledModelSchema = z.object({
  provider: z.string().min(1).max(40),
  id: z.string().min(1).max(200),
  name: z.string().min(1).max(120),
})
export type EnabledModel = z.infer<typeof enabledModelSchema>

/** A chat found by what was said in it: the words around the match, marked with ⟦ ⟧. */
export const chatSearchHitSchema = z.object({
  sessionId: z.string(),
  title: z.string(),
  snippet: z.string(),
  updatedAt: z.string(),
})
export type ChatSearchHit = z.infer<typeof chatSearchHitSchema>

/** What rides with an ask: a page by id (Washi reads it), or a file from the files store. */
export const attachmentRefSchema = z.object({
  kind: z.enum(['page', 'file']),
  id: z.string().min(1),
  name: z.string().max(200),
})
export type AttachmentRef = z.infer<typeof attachmentRefSchema>
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
  z.object({
    kind: z.literal('user_message'),
    text: z.string(),
    attachments: z.array(attachmentRefSchema).optional(),
  }),
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

/** A prompt Washi runs on its own, on a schedule in its own zone (D68). Each run is a chat. */
export const routineSchema = z.object({
  id: z.string(),
  title: z.string(),
  prompt: z.string(),
  /** Five-field cron on the wall clock of `timeZone`. */
  cron: z.string(),
  /** The first minute the schedule names in a day; kept for clients from before D68. */
  minuteOfDay: z.number().int().min(0).max(1439),
  timeZone: z.string(),
  enabled: z.boolean(),
  /** The wall key (`YYYY-MM-DDTHH:MM`, in its zone) of the last scheduled run. */
  lastRunAt: z.string().nullable(),
  /** The latest run's chat. */
  sessionId: z.string().nullable(),
  createdBy: z.string().nullable(),
  createdAt: z.string(),
})
export type Routine = z.infer<typeof routineSchema>

/** The canonical IANA name ('utc' → 'UTC'), or null when the zone does not exist. */
function canonicalZone(zone: string): string | null {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: zone }).resolvedOptions().timeZone
  } catch {
    return null
  }
}

/** An IANA zone, stored the way every client spells it. */
export const timeZoneSchema = z
  .string()
  .min(1)
  .max(64)
  .refine((zone) => canonicalZone(zone) !== null, 'not an IANA time zone')
  .transform((zone) => canonicalZone(zone) ?? zone)

const cronSchema = z.string().trim().max(120).refine(isCron, 'not a five-field cron schedule')

/** `cron`, or `minuteOfDay` for "every day at" — the desktop still sends that. */
export const routineCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    prompt: z.string().trim().min(1).max(4000),
    cron: cronSchema.optional(),
    minuteOfDay: z.number().int().min(0).max(1439).optional(),
    timeZone: timeZoneSchema,
  })
  .refine((input) => input.cron !== undefined || input.minuteOfDay !== undefined, {
    message: 'a routine needs a schedule',
  })
  .transform(({ minuteOfDay, cron, ...rest }) => ({
    ...rest,
    cron: cron ?? dailyCron(minuteOfDay ?? 0),
  }))
export type RoutineCreate = z.output<typeof routineCreateSchema>

export const routineUpdateSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1).max(120).optional(),
  prompt: z.string().trim().min(1).max(4000).optional(),
  cron: cronSchema.optional(),
  timeZone: timeZoneSchema.optional(),
})
export type RoutineUpdate = z.output<typeof routineUpdateSchema>

export const routineRunStatusSchema = z.enum(['running', 'waiting', 'done', 'failed'])

/** One run of a routine: what started it, its chat, and how it went — read off that chat. */
export const routineRunSchema = z.object({
  id: z.string(),
  routineId: z.string(),
  sessionId: z.string(),
  trigger: z.enum(['schedule', 'manual']),
  startedAt: z.string(),
  status: routineRunStatusSchema,
  costUsd: z.number(),
  /** From its start to the chat's last word; null while it runs. */
  durationMs: z.number().nullable(),
})
export type RoutineRun = z.infer<typeof routineRunSchema>
