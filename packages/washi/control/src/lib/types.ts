import type { InstanceStore, StorageConfig, StorageStore } from '@washi/trpc'

export interface SealedSecret {
  ciphertext: string
  iv: string
  /** The only part a client ever sees. */
  last4: string
}

export interface ControlPlaneOptions {
  databaseUrl: string
  masterKey: string
  /** Public origin, for auth callbacks and cookie scope. */
  baseUrl: string
  /** Origins allowed to call the auth endpoints. */
  trustedOrigins?: string[]
}

/** The pair sealed together; endpoint, region, bucket and prefix stay legible beside it. */
export interface StorageKeys {
  accessKeyId: string
  secretAccessKey: string
}

export interface HostedStorageStore extends StorageStore {
  /** Decrypted, for the runtime's blob store only — never for a route. */
  config(workspaceId: string): Promise<StorageConfig | null>
}

/** A model key decrypted for the agent host — a workspace's or the server's. */
export interface AgentCredentialOut {
  apiKey: string
  provider: string
  model: string | null
}

/** `instance_setting` as the server settings read and write it. */
export interface SettingRows {
  all(): Promise<{ key: string; value: string }[]>
  get(key: string): Promise<string | null>
  put(key: string, value: string): Promise<void>
  drop(key: string): Promise<void>
}

/** The server key's row: sealed like a workspace's, legible only by its last four. */
export interface SealedServerKey extends SealedSecret {
  provider: string
  model: string | null
  updatedBy: string | null
  updatedAt: string
}

export interface ServerSettingsDeps {
  rows: SettingRows
  masterKey: string
  /** Who changed the key, by name. */
  nameOf(userId: string): Promise<string | null>
}

/** The D105 settings: everything an admin sets besides who may sign up. */
export type ServerSettings = Omit<InstanceStore, 'isAdmin' | 'signup' | 'setSignup'> & {
  /** Fills the in-memory policy; boot calls it once before anything serves. */
  load(): Promise<void>
  /** Decrypted, for the agent host only — never for a route. */
  agentKey(): Promise<AgentCredentialOut | null>
}

export type HostedInstanceStore = InstanceStore & Pick<ServerSettings, 'load' | 'agentKey'>
