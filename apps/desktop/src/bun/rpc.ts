import { appRouter, type Context, createMirinBridge, type MirinFrame } from '@washi/trpc'
import { rpc } from 'mirinjs/rpc'

/**
 * Washi's whole API, over mirin IPC: the renderer's tRPC client calls these four and nothing
 * else. No port, no token — only this app's own webview can reach the main process.
 */
export function createDesktopRpc(createContext: () => Context) {
  let push: (frame: MirinFrame) => void = () => {}
  const bridge = createMirinBridge({
    router: appRouter,
    createContext,
    emit: (frame) => push(frame),
  })
  const router = rpc.router({
    trpcCall: rpc.mutation(bridge.call),
    trpcStart: rpc.mutation(bridge.start),
    trpcStop: rpc.mutation(bridge.stop),
    trpcFrame: rpc.event<MirinFrame>(),
  })
  return {
    router,
    bridge,
    /** Called once the router is served and its emitters exist. */
    connect(emit: (frame: MirinFrame) => void) {
      push = emit
    },
  }
}

export type DesktopRpc = ReturnType<typeof createDesktopRpc>['router']
