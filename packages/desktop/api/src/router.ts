import { rpc } from 'mirinjs/rpc'
import { systemRoutes } from './routes/system'

/**
 * Washi's RPC surface as a mirin router. The renderer imports only the `Router`
 * type; handlers run in the Bun worker. Routes are grouped by concern under
 * `./routes/` and composed here — this file stays a thin composition root.
 */
export function createRouter() {
  return rpc.router({
    ...systemRoutes(),
  })
}

export type Router = ReturnType<typeof createRouter>
