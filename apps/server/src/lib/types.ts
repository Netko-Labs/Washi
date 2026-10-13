import type { RuntimeOptions } from '@washi/runtime'
import type { ServerMode, ServerRuntime } from '@washi/trpc'

export interface ServerOptions extends RuntimeOptions {
  hostname?: string
  /** 0 asks the OS for a free port — what embedded mode wants. */
  port?: number
  /** Required on every call in embedded mode. Generated per boot when omitted. */
  token?: string
  /** Extra origins the hosted web client is served from. */
  trustedOrigins?: string[]
  /** Run routines on the minute. On unless a test says otherwise. */
  routines?: boolean
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
