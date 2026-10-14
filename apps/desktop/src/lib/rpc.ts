import { createTRPCClient } from '@trpc/client'
import { type AppRouter, mirinLink } from '@washi/trpc/client'
import { bindApi } from '@washi/ui'
import { client } from 'mirinjs/client'
import type { DesktopRpc } from '../bun/rpc'

const main = client<DesktopRpc>()

/**
 * The same tRPC client the web uses, over mirin IPC instead of HTTP and a socket (C4). Main
 * runs the router in-process; nothing here knows or cares.
 */
export const api = createTRPCClient<AppRouter>({
  links: [
    mirinLink({
      call: (op) => main.trpcCall(op),
      start: (op) => main.trpcStart(op),
      stop: (op) => main.trpcStop(op),
      onFrame: (listener) => main.trpcFrame.on(listener),
    }),
  ],
})

bindApi(api)
