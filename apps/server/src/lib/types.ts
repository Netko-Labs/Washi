import type { ServerMode } from '@washi/trpc'

export interface ServerOptions {
  mode: ServerMode
  /** Directory holding `<workspace-id>.db`. */
  dataDir: string
  hostname?: string
  /** 0 asks the OS for a free port — what embedded mode wants. */
  port?: number
}

export interface RunningServer {
  url: string
  port: number
  mode: ServerMode
  stop(): Promise<void>
}
