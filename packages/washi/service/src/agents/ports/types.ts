import type { AgentUpdate, TurnBilling, Viewer } from '@washi/domain'
import type { AgentCredential, SdkEffort } from '../lib/types'

/** Every provider Washi can reach. `anthropic` is the native Claude Agent SDK path. */
export type ProviderId = 'anthropic' | 'openrouter'

export interface ModelChoice {
  provider: ProviderId
  /** Provider-native id — 'anthropic/claude-opus-5' on OpenRouter, the CLI default when absent. */
  model?: string
}

export interface PromptRequest {
  sessionId: string
  text: string
  credential: AgentCredential
  model: ModelChoice
  /** The SDK's reasoning effort; the AI SDK path has no equivalent yet and ignores it. */
  effort?: SdkEffort
  /** Pictures attached to the ask. The Claude port sends them as image blocks; the AI SDK port cannot yet. */
  images?: { mime: string; base64: string }[]
  /** Washi names the conversation through a tool; the host stores what it says. */
  setTitle?: (title: string) => void
  /** Moves this conversation to a page the asker can read (D110); refusals come back in words. */
  handover?: (sheetId: string, note?: string) => HandoverResult
  /** Who asked; the tools read only the pages they can (D65). */
  viewer?: Viewer
  /** Prior turns, for ports that do not resume server-side. */
  history: { role: 'user' | 'assistant'; text: string }[]
  /** Opaque to Washi: the Claude SDK's own session id, when a port keeps one. */
  resumeToken?: string | null
  signal?: AbortSignal
}

export type HandoverResult = { ok: true; page: string } | { ok: false; reason: string }

export interface TurnResult {
  /** Under `plan` this is notional — what the turn would have cost on a key. */
  costUsd: number | null
  billing: TurnBilling
  model?: string
  /** Stored and handed back as `resumeToken` next turn. */
  resumeToken?: string | null
  /** Set when the turn ended badly but the port still produced a result. */
  error?: string
  /** A person pressed Stop. Not an error: nothing went wrong, someone changed their mind. */
  cancelled?: boolean
}

/**
 * One turn, however it is produced. The transcript UI renders `AgentUpdate` and
 * nothing else, so a port's only job is to turn a prompt into that vocabulary —
 * which is what §05 meant by "two ports, one vocabulary". A port never emits
 * `turn_done`: the host closes every turn the same way, with its receipt.
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

export type ToolVerdict =
  | { behavior: 'allow'; updatedInput: Record<string, unknown> }
  | { behavior: 'deny'; message: string }
