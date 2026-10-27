import { describe, expect, test } from 'bun:test'
import { type BlobStore, ProbeMismatchError, probeBlobStore, routedBlobStore } from '../files'

const bytes = (text: string) => new TextEncoder().encode(text)
const text = (value: Uint8Array | null) => (value ? new TextDecoder().decode(value) : null)

function memoryStore(): BlobStore & { keys: Map<string, Uint8Array> } {
  const keys = new Map<string, Uint8Array>()
  return {
    keys,
    async write(key, value) {
      keys.set(key, value)
    },
    async read(key) {
      return keys.get(key) ?? null
    },
    async delete(key) {
      keys.delete(key)
    },
  }
}

describe('a workspace bucket in front of the server store', () => {
  test('new bytes land in the bucket; a file from before the switch still reads', async () => {
    const server = memoryStore()
    const bucket = memoryStore()
    await server.write('old', bytes('before'), 'image/png')
    const routed = routedBlobStore(async () => bucket, server)

    await routed.write('new', bytes('after'), 'image/png')

    expect(bucket.keys.has('new')).toBe(true)
    expect(server.keys.has('new')).toBe(false)
    expect(text(await routed.read('new'))).toBe('after')
    expect(text(await routed.read('old'))).toBe('before')
    expect(server.keys.has('old')).toBe(true)
  })

  test('no bucket: the server store alone', async () => {
    const server = memoryStore()
    const routed = routedBlobStore(async () => null, server)
    await routed.write('a', bytes('x'), 'image/png')
    expect(text(await routed.read('a'))).toBe('x')
  })

  test('a bucket that refuses still lets an old file through, and says so for a new one', async () => {
    const server = memoryStore()
    await server.write('old', bytes('before'), 'image/png')
    const refusing: BlobStore = {
      ...memoryStore(),
      read: () => Promise.reject(new Error('AccessDenied')),
    }
    const routed = routedBlobStore(async () => refusing, server)
    expect(text(await routed.read('old'))).toBe('before')
    await expect(routed.read('gone')).rejects.toThrow('AccessDenied')
  })

  test('a delete clears both, so a purge never leaves bytes behind', async () => {
    const server = memoryStore()
    const bucket = memoryStore()
    await server.write('k', bytes('a'), 'image/png')
    await bucket.write('k', bytes('b'), 'image/png')
    await routedBlobStore(async () => bucket, server).delete('k')
    expect(server.keys.size + bucket.keys.size).toBe(0)
  })
})

describe('the probe', () => {
  test('writes, reads back and deletes, leaving nothing', async () => {
    const store = memoryStore()
    await probeBlobStore(store)
    expect(store.keys.size).toBe(0)
  })

  test('a store that hands back other bytes fails it', async () => {
    const liar: BlobStore = { ...memoryStore(), read: async () => bytes('not it') }
    await expect(probeBlobStore(liar)).rejects.toBeInstanceOf(ProbeMismatchError)
  })
})
