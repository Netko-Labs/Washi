import { appRouter, createTRPCWebSocketHooks } from '@washi/trpc'
import { defineWebSocketHandler } from 'nitro/h3'
import { createRequestContext, edgeLogger, trustedOrigins } from './runtime'

const WS_PING_MS = 30_000
const WS_PONG_WAIT_MS = 5_000

// Mounted at /trpc-ws by the nitro plugin in vite.config.ts (dev + Bun build alike).
export default defineWebSocketHandler(
  createTRPCWebSocketHooks({
    router: appRouter,
    createContext: createRequestContext,
    trustedOrigins: trustedOrigins(),
    keepAlive: { pingMs: WS_PING_MS, pongWaitMs: WS_PONG_WAIT_MS },
    logger: edgeLogger,
  }),
)
