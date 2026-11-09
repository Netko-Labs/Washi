import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { THEMES } from '../../registry/themes'

/**
 * Every pairing paper draws, per theme × mode, composited the way the browser does: a tint
 * "x% over transparent" is mixed with the card it sits on, `color-mix` in srgb or oklab as the CSS
 * says. Fixed tones and hues are read off `tokens.css`, so the check follows the file.
 */
type Rgb = [number, number, number]
export interface Pairing {
  theme: string
  mode: 'light' | 'dark'
  what: string
  ratio: number
  need: number
}

const TOKENS = readFileSync(join(import.meta.dir, '..', 'tokens.css'), 'utf8')
const blockOf = (selector: RegExp) => TOKENS.match(selector)?.[0] ?? ''
const LIGHT = blockOf(/\.wsx,\n\.wsx-tokens \{[\s\S]*?\n\}/)
const DARK = blockOf(/\.dark \.wsx,\n\.dark \.wsx-tokens \{[\s\S]*?\n\}/)
const QUIET = Number(/data-emphasis="quiet"\] \{\s*--em-alpha: ([\d.]+)/.exec(TOKENS)?.[1] ?? 1)

function declared(block: string): Record<string, string> {
  return Object.fromEntries(
    [...block.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2]?.trim()]),
  ) as Record<string, string>
}
const FIXED = { light: declared(LIGHT), dark: { ...declared(LIGHT), ...declared(DARK) } }

const hex = (h: string): Rgb =>
  [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16) / 255) as Rgb
const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const unlin = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)
const lum = (c: Rgb) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])
export const ratio = (a: Rgb, b: Rgb) => {
  const [x, y] = [lum(a), lum(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}
const mix = (a: Rgb, p: number, b: Rgb): Rgb =>
  a.map((v, i) => v * p + (b[i] ?? 0) * (1 - p)) as Rgb
function oklab(c: Rgb): Rgb {
  const [r, g, b] = c.map(lin) as Rgb
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}
function rgb(o: Rgb): Rgb {
  const l = (o[0] + 0.3963377774 * o[1] + 0.2158037573 * o[2]) ** 3
  const m = (o[0] - 0.1055613458 * o[1] - 0.0638541728 * o[2]) ** 3
  const s = (o[0] - 0.0894841775 * o[1] - 1.291485548 * o[2]) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((v) => Math.min(1, Math.max(0, unlin(v)))) as Rgb
}
const mixOklab = (a: Rgb, p: number, b: Rgb): Rgb => {
  const [x, y] = [oklab(a), oklab(b)]
  return rgb(x.map((v, i) => v * p + (y[i] ?? 0) * (1 - p)) as Rgb)
}
/** `color-mix(in oklab, var(--x) N%, var(--ink))` as declared, else the share given. */
const shareIn = (value: string | undefined) => Number(/(\d+)%/.exec(value ?? '')?.[1] ?? 100) / 100

/** Body text 4.5:1; a mark beside its label (a chart's bar, a hue) 3:1. */
export function pairings(): Pairing[] {
  const out: Pairing[] = []
  for (const [theme, pair] of Object.entries(THEMES)) {
    for (const mode of ['light', 'dark'] as const) {
      const t = pair[mode]
      const fixed = FIXED[mode]
      const tone = (name: string) => hex(fixed[name] ?? '#000000')
      const [card, bg, ink, muted, mutedBg, accent] = [
        t.card,
        t.bg,
        t.ink,
        t.muted,
        t.mutedBg,
        t.accent,
      ].map(hex) as Rgb[]
      const add = (what: string, fg: Rgb, on: Rgb, need = 4.5) =>
        out.push({ theme, mode, what, ratio: ratio(fg, on), need })
      const accentText = mixOklab(accent as Rgb, shareIn(fixed['tone-accent-text']), ink as Rgb)
      const link = mixOklab(tone('kraft'), shareIn(fixed.link), ink as Rgb)
      const pillShare = shareIn(fixed['pill-hue'])
      const quietInk = mix(muted as Rgb, 0.55, ink as Rgb)

      add('ink on a card', ink as Rgb, card as Rgb)
      add('ink on the page', ink as Rgb, bg as Rgb)
      add('quiet ink on a card', muted as Rgb, card as Rgb)
      add('quiet ink on the page', muted as Rgb, bg as Rgb)
      add('quiet ink on a quiet fill', muted as Rgb, mutedBg as Rgb)
      add('quiet emphasis on a card', mix(ink as Rgb, QUIET, card as Rgb), card as Rgb)
      add('a link on a card', link, card as Rgb)
      add('a link on the page', link, bg as Rgb)
      add('accent words on a card', accentText, card as Rgb)
      add('accent words on an accent tint', accentText, mix(accent as Rgb, 0.14, card as Rgb))
      add('words on the accent', hex(t.accentInk), accent as Rgb)
      add('a neutral button', bg as Rgb, ink as Rgb)
      for (const name of ['info', 'success', 'warning', 'danger', 'neutral']) {
        const fill = tone(`tone-${name}`)
        add(`${name} words on a card`, tone(`tone-${name}-text`), card as Rgb)
        add(`${name} badge`, tone(`tone-${name}-text`), mix(fill, 0.14, card as Rgb))
        add(`${name} filled`, tone(`tone-${name}-on`), fill)
        add(`${name} pill`, mix(fill, pillShare, ink as Rgb), mix(fill, 0.2, card as Rgb))
      }
      add(
        'a quiet pill',
        mix(muted as Rgb, pillShare, ink as Rgb),
        mix(muted as Rgb, 0.2, card as Rgb),
      )
      for (const n of [1, 2, 3, 4, 5]) {
        const hue = tone(`chart-${n}`)
        const event = mix(hue, 0.14, card as Rgb)
        add(`hue ${n}: an event's title`, ink as Rgb, event)
        add(`hue ${n}: an event's time`, quietInk, event)
        add(`hue ${n}: a pill`, mix(hue, pillShare, ink as Rgb), mix(hue, 0.2, card as Rgb))
        add(`hue ${n}: a mark on a card`, hue, card as Rgb, 3)
      }
    }
  }
  return out
}

export const failing = () => pairings().filter((pairing) => pairing.ratio < pairing.need)
