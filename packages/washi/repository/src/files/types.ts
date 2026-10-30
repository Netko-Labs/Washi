/** Where a workspace's bytes live: a folder beside the .db, or a bucket. Keys are opaque to callers. */
export interface BlobStore {
  write(key: string, bytes: Uint8Array, mime: string): Promise<void>
  read(key: string): Promise<Uint8Array | null>
  delete(key: string): Promise<void>
}

export type BlobStoreFactory = (workspaceId: string) => BlobStore

export interface S3BlobOptions {
  bucket: string
  region?: string
  endpoint?: string
  accessKeyId: string
  secretAccessKey: string
  /** A prefix inside the bucket, so one bucket can hold more than Washi. */
  prefix?: string | null
}

export interface StoredFile {
  id: string
  name: string
  mime: string
  size: number
  hlcCreated: string
}

export interface FileStore {
  put(input: { name: string; mime: string; bytes: Uint8Array }): Promise<StoredFile>
  get(id: string): Promise<{ file: StoredFile; bytes: Uint8Array } | null>
  info(id: string): StoredFile | null
  /** The newest uploads first, so a picker can offer one already stored. */
  recent(limit: number): StoredFile[]
  remove(id: string): Promise<void>
}
