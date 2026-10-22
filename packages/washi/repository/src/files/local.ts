import { mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import type { BlobStore } from './types'

/** A folder beside the workspace file — the workspace travels as a folder (C1). */
export function localBlobStore(dir: string): BlobStore {
  const pathOf = (key: string) => join(dir, key)
  return {
    async write(key, bytes) {
      await mkdir(dir, { recursive: true })
      await Bun.write(pathOf(key), bytes)
    },
    async read(key) {
      const file = Bun.file(pathOf(key))
      return (await file.exists()) ? new Uint8Array(await file.arrayBuffer()) : null
    },
    async delete(key) {
      await rm(pathOf(key), { force: true })
    },
  }
}
