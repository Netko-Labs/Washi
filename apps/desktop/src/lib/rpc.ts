import { createTRPCClient, httpBatchLink, httpSubscriptionLink, splitLink } from '@trpc/client'
import type { AppRouter } from '@washi/trpc'

/**
 * The renderer is a client of the Washi server, not of the process hosting it
 * (C4). The main process passes the loopback origin on the window URL; a hosted
 * build will hand over a real one and nothing else here changes.
 */
function serverUrl(): string {
  const fromUrl = new URLSearchParams(window.location.search).get('server')
  if (fromUrl) return fromUrl
  throw new Error('no ?server= origin on the window URL — the main process did not pass one')
}

const url = `${serverUrl()}/trpc`

export const api = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition: (op) => op.type === 'subscription',
      // SSE, so a dropped connection resumes from lastEventId instead of
      // losing the middle of a turn.
      true: httpSubscriptionLink({ url }),
      false: httpBatchLink({ url }),
    }),
  ],
})
