import type { AgentUpdate } from '@washi/domain'

/** Every provider Washi can reach. `anthropic` is the native Claude Agent SDK path. */
export type ProviderId = 'anthropic' | 'openrouter'

export interface ModelChoice {
  provider: ProviderId
  /** Provider-native id — 'anthropic/claude-opus-5' on OpenRouter, ignored by the SDK port. */
  model?: string
}

export interface PromptRequest {
  sessionId: string
  text: string
  apiKey: string
  model: ModelChoice
  /** Prior turns, for ports that do not resume server-side. */
  history: { role: 'user' | 'assistant'; text: string }[]
  /** Opaque to Washi: the Claude SDK's own session id, when a port keeps one. */
  resumeToken?: string | null
  signal?: AbortSignal
}

export interface TurnResult {
  costUsd: number | null
  /** Stored and handed back as `resumeToken` next turn. */
  resumeToken?: string | null
}

/**
 * One turn, however it is produced. The transcript UI renders `AgentUpdate` and
 * nothing else, so a port's only job is to turn a prompt into that vocabulary —
 * which is what §05 meant by "two ports, one vocabulary".
 */
export interface AgentPort {
  readonly id: ProviderId
  /** Tools reach the desk through this; a port never runs a gated tool itself. */
  prompt(request: PromptRequest, emit: (update: AgentUpdate) => void): Promise<TurnResult>
}

export interface ToolGate {
  /** Resolves once a person has answered. Rejecting returns a message for the model. */
  approve(sessionId: string, toolName: string, input: unknown): Promise<boolean>
  /** Reads never ask. */
  isRead(toolName: string): boolean
}
