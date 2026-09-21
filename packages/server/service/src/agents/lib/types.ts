import type { ProviderId } from '../ports/types'

export interface AgentCredential {
  apiKey: string
  provider: ProviderId
  /** Provider-native model id. Falls back to the provider's default. */
  model?: string
}

export interface AgentKeySource {
  /** Null when this deployment has no stored key and no ambient one. */
  resolve(): Promise<AgentCredential | null>
}

export type BreakerState =
  | { kind: 'open' }
  | { kind: 'tripped'; day: string; costUsd: number; capUsd: number }
  | { kind: 'paused'; day: string }

export interface AgentSpendReport {
  day: string
  costUsd: number
  turns: number
  capUsd: number
  paused: boolean
}
