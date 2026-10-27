import type { BlobStore } from './types'

/**
 * A workspace's own bucket in front of the server's store. New bytes go to whichever is current;
 * a read tries the workspace's bucket, then the server's, so files from before a switch still open.
 */
export function routedBlobStore(
  own: () => Promise<BlobStore | null>,
  fallback: BlobStore,
): BlobStore {
  return {
    async write(key, bytes, mime) {
      await ((await own()) ?? fallback).write(key, bytes, mime)
    },
    async read(key) {
      const current = await own()
      if (!current) return fallback.read(key)
      let refusal: unknown = null
      const bytes = await current.read(key).catch((cause: unknown) => {
        refusal = cause
        return null
      })
      if (bytes) return bytes
      const earlier = await fallback.read(key)
      if (earlier || !refusal) return earlier
      throw refusal
    },
    async delete(key) {
      const current = await own()
      await Promise.all([current?.delete(key), fallback.delete(key)])
    },
  }
}
