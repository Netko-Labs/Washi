import type { StorageConfig, StorageStore } from '@washi/trpc'

export interface SealedSecret {
  ciphertext: string
  iv: string
  /** The only part a client ever sees. */
  last4: string
}

export interface ControlPlaneOptions {
  databaseUrl: string
  masterKey: string
  /** Public origin, for auth callbacks and cookie scope. */
  baseUrl: string
  /** Origins allowed to call the auth endpoints. */
  trustedOrigins?: string[]
}

/** The pair sealed together; endpoint, region, bucket and prefix stay legible beside it. */
export interface StorageKeys {
  accessKeyId: string
  secretAccessKey: string
}

export interface HostedStorageStore extends StorageStore {
  /** Decrypted, for the runtime's blob store only — never for a route. */
  config(workspaceId: string): Promise<StorageConfig | null>
}
