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
