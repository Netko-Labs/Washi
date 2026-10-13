// The browser-safe surface: types and constants only. The root barrel carries the router, and
// with it the service layer and the Agent SDK — never import it from client code.

export { MAX_TRPC_BATCH_SIZE } from './http/constants'
export type { AppRouter } from './index'
export { WORKSPACE_HEADER } from './shared/edge/constants'
