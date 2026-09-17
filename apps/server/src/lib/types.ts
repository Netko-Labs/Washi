import type { ServerMode, ServerRuntime } from '@washi/trpc'

export interface ServerOptions {
  mode: ServerMode
  /** Directory holding `<workspace-id>.db`. */
  dataDir: string
  hostname?: string
  /** 0 asks the OS for a free port — what embedded mode wants. */
  port?: number
  /** Required on every call. Generated per boot when omitted. */
  token?: string
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
