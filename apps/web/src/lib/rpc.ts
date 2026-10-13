import { createTRPCClient, httpBatchLink, httpSubscriptionLink, splitLink } from '@trpc/client'
import type { AppRouter } from '@washi/trpc'
import { ACTIVE_WORKSPACE_KEY, SERVER_URL, WORKSPACE_HEADER } from './constants'

const url = `${SERVER_URL}/trpc`

export function activeWorkspace(): string | null {
  try {
    return localStorage.getItem(ACTIVE_WORKSPACE_KEY)
  } catch {
    return null
  }
}

export function setActiveWorkspace(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_WORKSPACE_KEY, id)
    else localStorage.removeItem(ACTIVE_WORKSPACE_KEY)
  } catch {
    // private mode; the header just falls back to the server's default
  }
}

/**
 * No token here, unlike the desktop client: hosted mode authenticates with a
 * Better Auth session cookie, so `credentials: 'include'` is the whole story.
 */
export const api = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition: (op) => op.type === 'subscription',
      // EventSource cannot set headers: the cookie rides withCredentials and
      // the workspace rides connectionParams.
      true: httpSubscriptionLink({
        url,
        eventSourceOptions: () => ({ withCredentials: true }),
        connectionParams: () => {
          const workspace = activeWorkspace()
          return workspace ? { workspace } : {}
        },
      }),
      false: httpBatchLink({
        url,
        fetch: (input, init) => fetch(input, { ...init, credentials: 'include' }),
        headers: () => {
          const workspace = activeWorkspace()
          return workspace ? { [WORKSPACE_HEADER]: workspace } : {}
        },
      }),
    }),
  ],
})
