export type { PeerLike, TRPCWebSocketHooks, TRPCWebSocketHooksOptions } from './types'
export {
  closeAllPeers,
  createTRPCWebSocketHooks,
  MAX_SUBSCRIPTIONS_PER_PEER,
  MAX_WS_MESSAGE_BYTES,
} from './utils'
