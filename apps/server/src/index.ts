import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter, createContext } from '@washi/trpc'
import { DEFAULT_HOSTED_PORT, EMBEDDED_HOSTNAME } from './lib/constants'
import { corsHeaders, isAllowedOrigin, preflight, tokenFrom } from './lib/http'
import { createRuntime } from './lib/runtime'
import type { RunningServer, ServerOptions } from './lib/types'

const TRPC_PREFIX = '/trpc'
const WORKSPACE_HEADER = 'x-washi-workspace'

export function startServer(options: ServerOptions): RunningServer {
  const runtime = createRuntime(options)
  const token = options.token ?? crypto.randomUUID()
  const hostname = options.hostname ?? (options.mode === 'embedded' ? EMBEDDED_HOSTNAME : '0.0.0.0')
  const requestedPort = options.port ?? (options.mode === 'embedded' ? 0 : DEFAULT_HOSTED_PORT)

  const server = Bun.serve({
    hostname,
    port: requestedPort,
    idleTimeout: 0,
    async fetch(request) {
      const url = new URL(request.url)
      const origin = request.headers.get('origin')

      if (!isAllowedOrigin(origin)) return new Response('forbidden origin', { status: 403 })
      if (request.method === 'OPTIONS') return preflight(origin)

      const cors = corsHeaders(origin)

      if (url.pathname === '/health') {
        return Response.json({ ok: true, mode: options.mode }, { headers: cors })
      }

      if (url.pathname === TRPC_PREFIX || url.pathname.startsWith(`${TRPC_PREFIX}/`)) {
        // A page in any browser on this machine can reach loopback, so the token
        // is what actually separates the renderer from everything else.
        if (tokenFrom(request, url) !== token) {
          return new Response('unauthorized', { status: 401, headers: cors })
        }

        const response = await fetchRequestHandler({
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
        const headers = new Headers(response.headers)
        for (const [key, value] of Object.entries(cors)) headers.set(key, value)
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        })
      }

      return new Response('not found', { status: 404, headers: cors })
    },
  })

  const port = server.port ?? 0
  const displayHost = hostname === '0.0.0.0' ? 'localhost' : hostname

  return {
    url: `http://${displayHost}:${port}`,
    port,
    token,
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
