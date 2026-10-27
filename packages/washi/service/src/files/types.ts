export type StorageTest = { ok: true } | { ok: false; reason: string }

export interface StorageTestOptions {
  /** The app admin may point a workspace at the server's own network. */
  allowPrivate?: boolean
  timeoutMs?: number
  /** Every address a name resolves to; DNS unless a test says otherwise. */
  resolve?: (hostname: string) => Promise<string[]>
}
