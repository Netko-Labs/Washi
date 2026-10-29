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
  /** Whose key it is: the workspace's own, or the server's for a workspace without one (D105). */
  source?: 'workspace' | 'server'
}

export type StoredKeyLookup = () => Promise<StoredKey | null>

export type ApiKeyCredential = Extract<AgentCredential, { kind: 'api_key' }>
