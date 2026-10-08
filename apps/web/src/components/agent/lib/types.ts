export interface TranscriptEntryView {
  id: string
  seq: number
  update: AgentUpdateView
  createdAt: string
}

export type AgentUpdateView =
  | { kind: 'user_message'; text: string }
  | { kind: 'message_chunk'; text: string }
  | {
      kind: 'tool_call'
      toolCallId: string
      title: string
      toolKind: string
      status: string
      input?: unknown
    }
  | { kind: 'tool_call_update'; toolCallId: string; status: string; diff?: unknown }
  | TurnDoneView

export interface TurnDoneView {
  kind: 'turn_done'
  stopReason: string
  costUsd?: number
  error?: string
  billing?: 'metered' | 'plan'
  model?: string
  durationMs?: number
}

export interface TurnReceiptProps {
  update: TurnDoneView
}

export interface ApprovalView {
  id: string
  sessionId: string
  toolName: string
  input?: unknown
  createdAt: string
}

export type ApprovalDecision = 'allow_once' | 'allow_always' | 'reject_once'
