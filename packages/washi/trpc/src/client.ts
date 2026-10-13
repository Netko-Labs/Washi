// The browser-safe surface: types and constants only. The root barrel carries the router, and
// with it the service layer and the Agent SDK — never import it from client code.

export { MAX_TRPC_BATCH_SIZE } from './http/constants'
export type { AppRouter } from './index'
export { mirinLink } from './mirin/link'
export type {
  MirinCall,
  MirinCallResult,
  MirinFrame,
  MirinStart,
  MirinTransport,
} from './mirin/types'
export { WORKSPACE_HEADER } from './shared/edge/constants'
