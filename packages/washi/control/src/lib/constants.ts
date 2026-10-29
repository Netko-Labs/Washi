export const SECRET_ENV = 'WASHI_SECRET_KEY'
export const DATABASE_ENV = 'WASHI_DATABASE_URL'

/** AES-GCM standard nonce length. */
export const IV_BYTES = 12
export const KEY_BITS = 256

/** A master key shorter than this is not worth the ceremony around it. */
export const MIN_SECRET_LENGTH = 32

/** A fresh server lets its first account in; after that, only invited emails. */
export const DEFAULT_SIGNUP = 'invite'
export const SIGNUP_REFUSED =
  'This server is invite-only. Ask a workspace owner to invite this email, then sign up with it.'

/** Every access token starts so — a secret scanner can tell one from noise. */
export const TOKEN_PREFIX = 'washi_pat_'
export const TOKEN_BYTES = 32
/** How stale "last used" may be before a use writes it again. */
export const TOKEN_USE_GRAIN_MS = 60_000
