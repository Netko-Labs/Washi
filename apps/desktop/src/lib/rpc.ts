import { createTRPCClient, httpBatchLink, httpSubscriptionLink, splitLink } from '@trpc/client'
import type { AppRouter } from '@washi/trpc'

/**
 * The renderer is a client of the Washi server, not of the process hosting it
 * (C4). The main process passes the loopback origin on the window URL; a hosted
 * build will hand over a real one and nothing else here changes.
 */
function param(name: string): string {
  const value = new URLSearchParams(window.location.search).get(name)
  if (value) return value
  throw new Error(`no ?${name}= on the window URL — the main process did not pass one`)
}

const url = `${param('server')}/trpc`
const token = param('token')

export const api = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition: (op) => op.type === 'subscription',
      // SSE, so a dropped connection resumes from lastEventId instead of
      // losing the middle of a turn.
      // EventSource cannot set headers, so the token rides connectionParams.
      true: httpSubscriptionLink({ url, connectionParams: () => ({ token }) }),
      false: httpBatchLink({ url, headers: () => ({ authorization: `Bearer ${token}` }) }),
    }),
  ],
})
