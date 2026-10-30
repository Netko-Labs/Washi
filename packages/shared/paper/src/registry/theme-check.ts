import type { ThemeCheck, ThemePair, ThemeRule, ThemeTokens } from './themes'

/** The house pair's own floor: its accent sits at 4.02:1 on card, its hairline at 1.25:1 on paper. */
export const THEME_RULES: readonly ThemeRule[] = [
  { fg: 'ink', on: 'bg', label: 'Ink on the page', warn: 7, refuse: 4.5 },
  { fg: 'ink', on: 'card', label: 'Ink on a card', warn: 7, refuse: 4.5 },
  { fg: 'muted', on: 'card', label: 'Quiet ink on a card', warn: 4.5, refuse: 3 },
  { fg: 'accent', on: 'card', label: 'Accent on a card', warn: 4, refuse: 2.5 },
  { fg: 'accentInk', on: 'accent', label: 'Text on the accent', warn: 4, refuse: 3 },
  { fg: 'border', on: 'bg', label: 'Hairlines on the page', warn: 1.2, refuse: 1 },
]

function luminance(hex: string): number {
  const channel = (offset: number) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

/** WCAG 2 contrast of two `#rrggbb` colours, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

function checkMode(mode: ThemeCheck['mode'], tokens: ThemeTokens): ThemeCheck[] {
  return THEME_RULES.map((rule) => {
    const ratio = contrastRatio(tokens[rule.fg], tokens[rule.on])
    const verdict = ratio < rule.refuse ? 'refuse' : ratio < rule.warn ? 'warn' : 'pass'
    return { mode, rule, ratio, verdict }
  })
}

export function themeChecks(pair: Pick<ThemePair, 'light' | 'dark'>): ThemeCheck[] {
  return [...checkMode('light', pair.light), ...checkMode('dark', pair.dark)]
}

export const isThemeRefused = (checks: ThemeCheck[]) =>
  checks.some((check) => check.verdict === 'refuse')

/** The first refused pairing in words, as a save refuses it: which pairing, which mode, how far. */
export function themeRefusal(checks: ThemeCheck[]): string | null {
  const refused = checks.find((check) => check.verdict === 'refuse')
  if (!refused) return null
  const { rule, ratio, mode } = refused
  return `${rule.label} is ${ratio.toFixed(1)}:1 in ${mode} — it needs ${rule.refuse}:1 to be read`
}
