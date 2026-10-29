import type { StoredKey } from '@washi/service'
import type { KeyLookup } from './types'

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
