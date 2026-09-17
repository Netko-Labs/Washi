import { IV_BYTES, KEY_BITS, MIN_SECRET_LENGTH } from './constants'
import type { SealedSecret } from './types'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  return Buffer.from(view).toString('base64')
}

function fromBase64(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, 'base64'))
}

/**
 * One data key per organization, derived from the master key so a single
 * compromised ciphertext is not a compromise of every other workspace's.
 */
async function derive(masterKey: string, organizationId: string): Promise<CryptoKey> {
  if (masterKey.length < MIN_SECRET_LENGTH) {
    throw new Error(`${MIN_SECRET_LENGTH}+ characters required for the master key`)
  }
  const material = await crypto.subtle.importKey('raw', encoder.encode(masterKey), 'HKDF', false, [
    'deriveKey',
  ])
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: encoder.encode(`washi:workspace:${organizationId}`),
      info: encoder.encode('washi:byok:v1'),
    },
    material,
    { name: 'AES-GCM', length: KEY_BITS },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function seal(
  masterKey: string,
  organizationId: string,
  plaintext: string,
): Promise<SealedSecret> {
  const key = await derive(masterKey, organizationId)
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext),
  )
  return {
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv),
    last4: plaintext.slice(-4),
  }
}

export async function open(
  masterKey: string,
  organizationId: string,
  sealed: Pick<SealedSecret, 'ciphertext' | 'iv'>,
): Promise<string> {
  const key = await derive(masterKey, organizationId)
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(sealed.iv) },
    key,
    fromBase64(sealed.ciphertext),
  )
  return decoder.decode(plaintext)
}
