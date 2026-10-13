import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createRuntime, startRoutineClock } from '@washi/runtime'
import { appRouter, createContext } from '@washi/trpc'
import { DEFAULT_HOSTED_PORT, EMBEDDED_HOSTNAME } from './lib/constants'
import { corsHeaders, isAllowedOrigin, preflight, tokenFrom } from './lib/http'
import type { RunningServer, ServerOptions } from './lib/types'

const TRPC_PREFIX = '/trpc'
const WORKSPACE_HEADER = 'x-washi-workspace'

export function startServer(options: ServerOptions): RunningServer {
  const runtime = createRuntime(options)
  const token = options.token ?? crypto.randomUUID()
  const embedded = options.mode === 'embedded'
  const hostname = options.hostname ?? (embedded ? EMBEDDED_HOSTNAME : '0.0.0.0')
  const requestedPort = options.port ?? (embedded ? 0 : DEFAULT_HOSTED_PORT)

  const server = Bun.serve({
    hostname,
    port: requestedPort,
    idleTimeout: 0,
    async fetch(request) {
      const url = new URL(request.url)
      const origin = request.headers.get('origin')

      if (!isAllowedOrigin(origin, options.trustedOrigins)) {
        return new Response('forbidden origin', { status: 403 })
      }
      if (request.method === 'OPTIONS') return preflight(origin)

      const cors = corsHeaders(origin)

      if (url.pathname === '/health') {
        return Response.json({ ok: true, mode: options.mode }, { headers: cors })
      }

      // Sign-in, sign-up, organizations and invitations. Hosted only — the
      // embedded control plane answers null and this falls through to a 404.
      const auth = await options.control.handle(request)
      if (auth) {
        const headers = new Headers(auth.headers)
        for (const [key, value] of Object.entries(cors)) headers.set(key, value)
        return new Response(auth.body, {
          status: auth.status,
          statusText: auth.statusText,
          headers,
        })
      }

      if (url.pathname === TRPC_PREFIX || url.pathname.startsWith(`${TRPC_PREFIX}/`)) {
        // Embedded has no accounts, so a per-boot token is what separates the
        // renderer from any other page that can reach loopback. Hosted has real
        // sessions and does not use one.
        if (embedded && tokenFrom(request, url) !== token) {
          return new Response('unauthorized', { status: 401, headers: cors })
        }

        const actor = embedded ? null : await options.control.authenticate(request)

        const response = await fetchRequestHandler({
          endpoint: TRPC_PREFIX,
          req: request,
          router: appRouter,
          // EventSource cannot set headers, so a subscription names its
          // workspace in connectionParams instead.
          createContext: ({ info }) =>
            createContext(runtime, {
              workspaceId:
                request.headers.get(WORKSPACE_HEADER) ?? info.connectionParams?.workspace ?? null,
              actor,
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

  const stopClock =
    options.routines === false ? () => {} : startRoutineClock(runtime, options.dataDir)
  const port = server.port ?? 0
  const displayHost = hostname === '0.0.0.0' ? 'localhost' : hostname

  return {
    url: `http://${displayHost}:${port}`,
    port,
    token,
    mode: options.mode,
    runtime,
    async stop() {
      stopClock()
      await server.stop(true)
      runtime.close()
      await options.control.close()
    },
  }
}

export { assertHostedSecrets, assertMode, DEFAULT_WORKSPACE_ID } from '@washi/runtime'
export { EMBEDDED_HOSTNAME } from './lib/constants'
export type { RunningServer, ServerOptions } from './lib/types'
