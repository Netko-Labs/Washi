import type { BlobStore, BlobStoreFactory, S3BlobOptions } from './types'

/** Bun's own S3 client: no dependency, one bucket, a prefix per workspace. */
export function s3BlobStores(options: S3BlobOptions): BlobStoreFactory {
  const client = new Bun.S3Client({
    bucket: options.bucket,
    region: options.region,
    endpoint: options.endpoint,
    accessKeyId: options.accessKeyId,
    secretAccessKey: options.secretAccessKey,
  })
  const root = options.prefix ? `${options.prefix.replace(/\/+$/, '')}/` : ''

  return (workspaceId): BlobStore => {
    const keyOf = (key: string) => `${root}${workspaceId}/${key}`
    return {
      async write(key, bytes, mime) {
        await client.write(keyOf(key), bytes, { type: mime })
      },
      async read(key) {
        const object = client.file(keyOf(key))
        return (await object.exists()) ? new Uint8Array(await object.arrayBuffer()) : null
      },
      async delete(key) {
        await client.delete(keyOf(key))
      },
    }
  }
}
