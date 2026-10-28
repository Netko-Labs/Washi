const hex2 = (value: number) =>
  Math.round(Math.min(1, Math.max(0, value)) * 255)
    .toString(16)
    .padStart(2, '0')

const toHexRgb = (r: number, g: number, b: number) =>
  `#${hex2(r)}${hex2(g)}${hex2(b)}`.toUpperCase()

const gamma = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055)

/** A number, a percentage of `whole`, or an angle in deg · turn · rad. */
function amount(token: string, whole = 1): number {
  if (token.endsWith('%')) return (Number.parseFloat(token) / 100) * whole
  if (token.endsWith('turn')) return Number.parseFloat(token) * 360
  if (token.endsWith('rad')) return (Number.parseFloat(token) * 180) / Math.PI
  return Number.parseFloat(token)
}

function fromOklch(l: number, c: number, h: number): string {
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)
  const L = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const M = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const S = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  return toHexRgb(
    gamma(4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S),
    gamma(-1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S),
    gamma(-0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S),
  )
}

function fromHsl(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return toHexRgb(f(0), f(8), f(4))
}

/**
 * Any colour a theme file writes — `#hex`, `rgb()`, `hsl()`, `oklch()`, or shadcn's bare
 * `222 84% 5%` — as `#RRGGBB`; alpha is dropped. Null for what is not a colour (a `var()`).
 */
export function toHex(raw: string): string | null {
  const value = raw.trim().toLowerCase()
  const hex = value.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/)
  if (hex?.[1]) {
    const digits = hex[1].length <= 4 ? [...hex[1]].map((d) => d + d).join('') : hex[1]
    return `#${digits.slice(0, 6)}`.toUpperCase()
  }
  const call = value.match(/^(rgba?|hsla?|oklch)\(([^)]*)\)$/)
  const [fn, body] = call ? [call[1], call[2] ?? ''] : ['hsl', value]
  const parts = body.split(/[\s,/]+/).filter(Boolean)
  if (parts.length < 3 || parts.slice(0, 3).some((part) => Number.isNaN(Number.parseFloat(part)))) {
    return null
  }
  const [x = '', y = '', z = ''] = parts
  if (fn?.startsWith('rgb'))
    return toHexRgb(amount(x, 255) / 255, amount(y, 255) / 255, amount(z, 255) / 255)
  if (fn === 'oklch') return fromOklch(amount(x), amount(y, 0.4), amount(z))
  return fromHsl(amount(x), amount(y), amount(z))
}
