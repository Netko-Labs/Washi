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
    costUsd: z.number().optional(),
    error: z.string().optional(),
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
