import type { ServerPolicy, WorkspaceDefaults } from '@washi/domain'
import type { AgentCredentialInput } from '../../init'
import type { SIGNUP_MODES } from './values'

export type SignupMode = (typeof SIGNUP_MODES)[number]

/** The server's own model key as its admins see it: never the key, only its last four. */
export interface ServerKeyInfo {
  last4: string
  provider: string
  model: string | null
  updatedAt: Date
  updatedBy: string | null
}

/** What a workspace without a key of its own runs on — for its members, not even the last four. */
export interface ServerKeyUse {
  provider: string
  model: string | null
}

/** The server's own settings, held by its app admins (its first account). Absent in embedded mode. */
export interface InstanceStore {
  isAdmin(actorId: string): Promise<boolean>
  signup(): Promise<SignupMode>
  setSignup(mode: SignupMode): Promise<void>
  /** Read from memory: every workspace check asks it, so it never waits on Postgres. */
  policy(): ServerPolicy
  setFetchHosts(hosts: string[]): Promise<void>
  setEmbedHosts(hosts: string[]): Promise<void>
  setWidgets(enabled: boolean): Promise<void>
  setDefaults(defaults: WorkspaceDefaults): Promise<void>
  keyInfo(): Promise<ServerKeyInfo | null>
  setKey(actorId: string, credential: AgentCredentialInput): Promise<{ last4: string }>
  setKeyModel(actorId: string, model: string | null): Promise<void>
  /** Workspaces without a key of their own fall asleep. */
  removeKey(): Promise<void>
}
