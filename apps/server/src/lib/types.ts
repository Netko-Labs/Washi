import type { StoredKey } from '@washi/service'
import type { ControlPlane, ServerMode, ServerRuntime } from '@washi/trpc'

export interface ServerOptions {
  mode: ServerMode
  /** Identity and membership. Hosted is Postgres + Better Auth; embedded is a stub. */
  control: ControlPlane
  /** The single workspace in embedded mode; the fallback in hosted. */
  defaultWorkspaceId?: string
  /** Directory holding `<workspace-id>.db`. */
  dataDir: string
  hostname?: string
  /** 0 asks the OS for a free port — what embedded mode wants. */
  port?: number
  /** Required on every call in embedded mode. Generated per boot when omitted. */
  token?: string
  /** Extra origins the hosted web client is served from. */
  trustedOrigins?: string[]
  /** Hosted only: the organization's decrypted key, for the agent and nothing else. */
  storedAgentKey?: (workspaceId: string) => Promise<StoredKey | null>
}

export interface RunningServer {
  url: string
  port: number
  /** The client is handed this; without it every request is a 401. */
  token: string
  mode: ServerMode
  /** The embedded host reaches through this for the Develop menu and seeding. */
  runtime: ServerRuntime
  stop(): Promise<void>
}
