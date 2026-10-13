import type { AnyRouter, inferRouterContext } from '@trpc/server'
import type { CreateContextOptions, EdgeLogger, TRPCErrorEvent } from '../shared/edge'

/**
 * Requests without an Origin pass the origin check. The logger records refusals only; tRPC
 * calls are logged by the procedure middleware.
 */
export interface TRPCHttpHandlerOptions<TRouter extends AnyRouter> {
  router: TRouter
  endpoint: string
  createContext: (opts: CreateContextOptions) => Promise<inferRouterContext<TRouter>>
  trustedOrigins: readonly string[]
  logger?: EdgeLogger
  onError?: (event: TRPCErrorEvent<TRouter>) => void
}
