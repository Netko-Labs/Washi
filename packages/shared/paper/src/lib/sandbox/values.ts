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

/**
 * QuickJS has no `Intl`: numbers read in en-US (grouping, fraction digits, currency and percent),
 * so `toLocaleString()` groups as it does in the browser. Nothing else of `Intl` is lent.
 */
export const INTL_SHIM = `globalThis.Intl || (() => {
  const SYMBOLS = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: 'CN¥', INR: '₹', KRW: '₩', BRL: 'R$', CAD: 'CA$', AUD: 'A$', MXN: 'MX$' }
  function NumberFormat(locale, options) {
    if (!(this instanceof NumberFormat)) return new NumberFormat(locale, options)
    const o = options || {}
    const style = o.style || 'decimal'
    const fixed = style === 'currency' ? 2 : 0
    const min = o.minimumFractionDigits ?? Math.min(fixed, o.maximumFractionDigits ?? fixed)
    const max = Math.max(min, o.maximumFractionDigits ?? (style === 'decimal' ? 3 : fixed))
    this.resolvedOptions = () => ({ locale: 'en-US', style, minimumFractionDigits: min, maximumFractionDigits: max })
    this.format = (value) => {
      let n = Number(value)
      if (style === 'percent') n *= 100
      if (!isFinite(n)) return isNaN(n) ? 'NaN' : (n < 0 ? '-∞' : '∞')
      const [whole, fraction = ''] = Math.abs(n).toFixed(max).split('.')
      let digits = fraction
      while (digits.length > min && digits.endsWith('0')) digits = digits.slice(0, -1)
      const grouped = o.useGrouping === false ? whole : whole.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',')
      const body = grouped + (digits ? '.' + digits : '')
      const sign = n < 0 && /[1-9]/.test(body) ? '-' : ''
      if (style === 'percent') return sign + body + '%'
      if (style !== 'currency') return sign + body
      const code = String(o.currency || 'USD').toUpperCase()
      return sign + (SYMBOLS[code] || code + '\\u00a0') + body
    }
  }
  globalThis.Intl = { NumberFormat }
  Number.prototype.toLocaleString = function (locale, options) {
    return new NumberFormat(locale, options).format(this)
  }
})()`
