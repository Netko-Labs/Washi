import type { AnyRouter, inferRouterContext, TRPCError, TRPCProcedureType } from '@trpc/server'

/** What both edges hand createContext: the request, plus what a socket sent on connect. */
export interface CreateContextOptions {
  req: Request
  connectionParams?: Record<string, string | undefined> | null
}

/** The slice of a logger the edges write to (structural, so tests can pass a fake). */
export interface EdgeLogger {
  info(fields: object, message: string): void
  warn(fields: object, message: string): void
}

/** A failed call as both edges report it; tRPC raises it once per failure. */
export interface TRPCErrorEvent<TRouter extends AnyRouter> {
  error: TRPCError
  path: string | undefined
  type: TRPCProcedureType | 'unknown'
  ctx: inferRouterContext<TRouter> | undefined
  input: unknown
}
