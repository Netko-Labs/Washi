import type { StoredKey } from '@washi/service'
import type { ControlPlane, ServerMode, ServerRuntime } from '@washi/trpc'

export interface RuntimeOptions {
  mode: ServerMode
  /** Identity and membership. Hosted is Postgres + Better Auth; embedded is a stub. */
  control: ControlPlane
  /** The single workspace in embedded mode; the fallback in hosted. */
  defaultWorkspaceId?: string
  /** Directory holding `<workspace-id>.db`. */
  dataDir: string
  /** Hosted only: the organization's decrypted key, for the agent and nothing else. */
  storedAgentKey?: (workspaceId: string) => Promise<StoredKey | null>
}

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
