import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter, createContext } from '@washi/trpc'
import { DEFAULT_HOSTED_PORT, EMBEDDED_HOSTNAME } from './lib/constants'
import { createRuntime } from './lib/runtime'
import type { RunningServer, ServerOptions } from './lib/types'

const TRPC_PREFIX = '/trpc'
const WORKSPACE_HEADER = 'x-washi-workspace'

export function startServer(options: ServerOptions): RunningServer {
  const runtime = createRuntime(options)
  const hostname = options.hostname ?? (options.mode === 'embedded' ? EMBEDDED_HOSTNAME : '0.0.0.0')
  const requestedPort = options.port ?? (options.mode === 'embedded' ? 0 : DEFAULT_HOSTED_PORT)

  const server = Bun.serve({
    hostname,
    port: requestedPort,
    idleTimeout: 0,
    async fetch(request) {
      const url = new URL(request.url)

      if (url.pathname === '/health') {
        return Response.json({ ok: true, mode: options.mode })
      }

      if (url.pathname === TRPC_PREFIX || url.pathname.startsWith(`${TRPC_PREFIX}/`)) {
        return fetchRequestHandler({
          endpoint: TRPC_PREFIX,
          req: request,
          router: appRouter,
          createContext: () =>
            createContext(runtime, {
              workspaceId: request.headers.get(WORKSPACE_HEADER),
              // Phase 2 reads a verified JWT here. Until then there is no actor,
              // and embedded mode never has one anyway.
              actorId: null,
            }),
        })
      }

      return new Response('not found', { status: 404 })
    },
  })

  const port = server.port ?? 0
  const displayHost = hostname === '0.0.0.0' ? 'localhost' : hostname

  return {
    url: `http://${displayHost}:${port}`,
    port,
    mode: options.mode,
    runtime,
    async stop() {
      await server.stop(true)
      runtime.close()
    },
  }
}

export { DEFAULT_WORKSPACE_ID, EMBEDDED_HOSTNAME } from './lib/constants'
export { assertMode } from './lib/mode'
export type { RunningServer, ServerOptions } from './lib/types'
