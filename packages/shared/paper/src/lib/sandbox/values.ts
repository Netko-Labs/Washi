export const SANDBOX_STACK_BYTES = 512 * 1024
/** The verb a drawn handler becomes; it never leaves the browser. */
export const INVOKE = 'script.invoke'
export const PRESS_PROPS = new Set(['onPress', 'onClick'])
/** The most random bytes one call hands a sandbox. */
export const MAX_RANDOM_BYTES = 65536

/**
 * Web `crypto` for packages that expect it (nanoid, uuid): randomness from the host's own, and
 * nothing else — it reaches no data, no network, no page.
 */
export const CRYPTO_SHIM = `globalThis.crypto = globalThis.crypto || {
  getRandomValues(view) {
    const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
    const hex = __random(bytes.length)
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
    return view
  },
  randomUUID() {
    const b = this.getRandomValues(new Uint8Array(16))
    b[6] = (b[6] & 15) | 64
    b[8] = (b[8] & 63) | 128
    const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20)
  },
}`
