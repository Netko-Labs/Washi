export const SECRET_ENV = 'WASHI_SECRET_KEY'
export const DATABASE_ENV = 'WASHI_DATABASE_URL'

/** AES-GCM standard nonce length. */
export const IV_BYTES = 12
export const KEY_BITS = 256

/** A master key shorter than this is not worth the ceremony around it. */
export const MIN_SECRET_LENGTH = 32
