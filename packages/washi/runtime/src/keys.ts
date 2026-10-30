import type { StoredKey } from '@washi/service'
import type { KeyLookup, SearchKeyLookup } from './types'

/** D105: a workspace's own key wins; one without falls back to the server's, else Washi sleeps. */
export function keyWithFallback(
  own: KeyLookup,
  server: () => Promise<Omit<StoredKey, 'source'> | null>,
): KeyLookup {
  return async (workspaceId) => {
    const mine = await own(workspaceId)
    if (mine) return { ...mine, source: 'workspace' }
    const lent = await server()
    return lent ? { ...lent, source: 'server' } : null
  }
}

/** The same rule for a lone integration key — Exa's, Unsplash's: the workspace's, else the server's, else none. */
export function searchKeyWithFallback(
  own: SearchKeyLookup,
  server: () => Promise<string | null>,
): SearchKeyLookup {
  return async (workspaceId) => (await own(workspaceId)) ?? (await server())
}
