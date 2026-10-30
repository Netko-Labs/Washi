import {
  createTRPCClient,
  createWSClient,
  httpBatchLink,
  splitLink,
  type TRPCWebSocketClient,
  wsLink,
} from '@trpc/client'
import {
  type AppRouter,
  MAX_TRPC_BATCH_SIZE,
  MAX_TRPC_URL_LENGTH,
  WORKSPACE_HEADER,
} from '@washi/trpc/client'
import { bindHost } from '@washi/ui'
import {
  fileUrl,
  getWebSocketUrl,
  readActiveWorkspace,
  TRPC_HTTP_URL,
  TRPC_WS_IDLE_CLOSE_MS,
  writeActiveWorkspace,
} from './lib'

const wsClient: TRPCWebSocketClient | undefined =
  typeof window === 'undefined'
    ? undefined
    : createWSClient({
        url: getWebSocketUrl,
        lazy: { enabled: true, closeMs: TRPC_WS_IDLE_CLOSE_MS },
        connectionParams: () => {
          const workspace = readActiveWorkspace()
          return workspace ? { workspace } : {}
        },
      })

/** A socket keeps the workspace it connected with; switching closes it so the next one reconnects. */
export function setActiveWorkspace(id: string | null): void {
  if (readActiveWorkspace() === id) return
  writeActiveWorkspace(id)
  wsClient?.close()
}

/**
 * Queries and mutations batch over HTTP with the workspace in a header; subscriptions ride one
 * lazy WebSocket to `/trpc-ws`. SSR never subscribes, so the server build stays HTTP-only.
 */
function createLinks() {
  const headers = () => {
    const workspace = readActiveWorkspace()
    return workspace ? { [WORKSPACE_HEADER]: workspace } : {}
  }
  const queries = httpBatchLink<AppRouter>({
    url: TRPC_HTTP_URL,
    maxItems: MAX_TRPC_BATCH_SIZE,
    maxURLLength: MAX_TRPC_URL_LENGTH,
    headers,
  })
  // A page's code is the input of `scripts.*`: as a GET it rode the URL, and a long page got a 431.
  const code = httpBatchLink<AppRouter>({
    url: TRPC_HTTP_URL,
    maxItems: MAX_TRPC_BATCH_SIZE,
    methodOverride: 'POST',
    headers,
  })
  const http = splitLink({
    condition: (op) => op.path.startsWith('scripts.'),
    true: code,
    false: queries,
  })
  if (!wsClient) return [http]
  return [
    splitLink({
      condition: (op) => op.type === 'subscription',
      true: wsLink<AppRouter>({ client: wsClient }),
      false: http,
    }),
  ]
}

export const api = createTRPCClient<AppRouter>({ links: createLinks() })

/** Bytes go to the files route with the active workspace named; the id comes back for the ask. */
async function uploadFile(file: File) {
  const body = new FormData()
  body.set('file', file)
  const workspace = readActiveWorkspace() ?? ''
  const response = await fetch(`/api/files?workspace=${encodeURIComponent(workspace)}`, {
    method: 'POST',
    body,
  })
  if (!response.ok) {
    const reason = ((await response.json().catch(() => null)) as { error?: string } | null)?.error
    throw new Error(reason ?? 'That did not upload.')
  }
  return (await response.json()) as { id: string; name: string; mime: string; size: number }
}

bindHost({
  client: api,
  place: 'your server',
  uploadFile,
  fileUrl: (id) => fileUrl(id, readActiveWorkspace() ?? ''),
})
