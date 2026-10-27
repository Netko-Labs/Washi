import { type BlobStore, s3BlobStores } from '@washi/repository'
import type { StorageConfig } from '@washi/trpc'
import type { BuiltBucket } from './types'

/**
 * Each workspace's own bucket, rebuilt the first time its config reads differently — so a
 * change or a removal in Settings lands on the next upload, without a restart.
 */
export function workspaceBuckets(
  lookup: (workspaceId: string) => Promise<StorageConfig | null>,
): (workspaceId: string) => Promise<BlobStore | null> {
  const built = new Map<string, BuiltBucket>()
  return async (workspaceId) => {
    const config = await lookup(workspaceId)
    if (!config) {
      built.delete(workspaceId)
      return null
    }
    const key = JSON.stringify(config)
    const cached = built.get(workspaceId)
    if (cached?.config === key) return cached.store
    const store = s3BlobStores(config)(workspaceId)
    built.set(workspaceId, { config: key, store })
    return store
  }
}
