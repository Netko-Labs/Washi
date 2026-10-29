import type { ServerPolicy } from '@washi/domain'
import type { BlobStore, BlobStoreFactory } from '@washi/repository'
import type { StoredKey } from '@washi/service'
import type { ControlPlane, ServerMode, ServerRuntime, StorageConfig } from '@washi/trpc'

export interface RuntimeOptions {
  mode: ServerMode
  /** Identity and membership. Hosted is Postgres + Better Auth; embedded is a stub. */
  control: ControlPlane
  /** The single workspace in embedded mode; the fallback in hosted. */
  defaultWorkspaceId?: string
  /** Directory holding `<workspace-id>.db`. */
  dataDir: string
  /** Hosted only: the organization's decrypted key (or the server's, D105), for the agent alone. */
  storedAgentKey?: KeyLookup
  /** Hosted only: the server's say over every workspace, read from memory on each check. */
  serverPolicy?: () => ServerPolicy
  /** The Exa key a workspace searches the web with. Hosted stores one; embedded reads the env. */
  searchKey?: (workspaceId: string) => Promise<string | null>
  /** Where a workspace's files go. Absent: a folder beside its .db (D60). */
  blobs?: BlobStoreFactory
  /** Hosted only: a workspace's own bucket, which takes its new uploads in front of `blobs`. */
  workspaceStorage?: (workspaceId: string) => Promise<StorageConfig | null>
}

export type KeyLookup = (workspaceId: string) => Promise<StoredKey | null>

export interface HostedSecrets {
  databaseUrl: string
  masterKey: string
}

export type Runtime = ServerRuntime & { close(): void }

/** A runtime with its clock running and everything it opened, closed in one call. */
export interface BootedRuntime {
  runtime: Runtime
  dataDir: string
  trustedOrigins: string[]
  stop(): Promise<void>
}

/** A workspace's bucket client and the config it was built from, serialised to compare. */
export interface BuiltBucket {
  config: string
  store: BlobStore
}
