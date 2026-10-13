import type { TRPCErrorShape } from '@trpc/server/unstable-core-do-not-import'

export type MirinProcedureType = 'query' | 'mutation'

export interface MirinCall {
  path: string
  type: MirinProcedureType
  input: unknown
}

export type MirinCallResult = { ok: true; data: unknown } | { ok: false; error: TRPCErrorShape }

export interface MirinStart {
  id: string
  path: string
  input: unknown
}

/** One frame of one subscription, pushed main → renderer over a mirin event. */
export type MirinFrame =
  | { id: string; type: 'data'; data: unknown; trackedId?: string }
  | { id: string; type: 'error'; error: TRPCErrorShape }
  | { id: string; type: 'stopped' }

/** What the renderer needs from mirin: two calls, a start/stop pair and one push channel. */
export interface MirinTransport {
  call(op: MirinCall): Promise<MirinCallResult>
  start(op: MirinStart): Promise<void>
  stop(op: { id: string }): Promise<void>
  onFrame(listener: (frame: MirinFrame) => void): () => void
}
