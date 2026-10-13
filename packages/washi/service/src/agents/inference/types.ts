import type { AgentCredential, LocalCliStatus } from '../lib'

export interface ProbeDeps {
  /** Ordered: the first executable that exists wins. */
  candidates(): string[]
  isExecutable(path: string): boolean
  /** stdout, or null when the command failed or timed out. */
  run(argv: string[]): Promise<string | null>
}

export type LocalCliProbe = () => Promise<LocalCliStatus | null>

export interface StoredKey {
  apiKey: string
  provider: string
  model: string | null
}

export type StoredKeyLookup = () => Promise<StoredKey | null>

export type ApiKeyCredential = Extract<AgentCredential, { kind: 'api_key' }>
