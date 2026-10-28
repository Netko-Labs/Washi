import { describe, expect, test } from 'bun:test'
import {
  fillDraft,
  isThemeRefused,
  readTheme,
  THEMES,
  ThemeImportError,
  themeChecks,
  themeFile,
  toHex,
} from '../index'

describe('a theme is accepted only when', () => {
  for (const [id, pair] of Object.entries(THEMES)) {
    test(`${id} passes every rule in both modes`, () => {
      const short = themeChecks(pair).filter((check) => check.verdict !== 'pass')
      expect(
        short.map((check) => `${check.mode} ${check.rule.label} ${check.ratio.toFixed(2)}`),
      ).toEqual([])
    })
  }

  test('pairs ship together — eight tokens, two modes, nothing else', () => {
    for (const pair of Object.values(THEMES)) {
      expect(Object.keys(pair.light).sort()).toEqual(Object.keys(pair.dark).sort())
      expect(Object.keys(pair.light)).toHaveLength(8)
    }
  })

  test('unreadable ink is refused, a soft accent only warned', () => {
    const light = { ...THEMES.washi.light, ink: '#B0A898' }
    expect(isThemeRefused(themeChecks({ light, dark: THEMES.washi.dark }))).toBe(true)
    const soft = { ...THEMES.washi.light, accent: '#CF7444' }
    const checks = themeChecks({ light: soft, dark: THEMES.washi.dark })
    expect(isThemeRefused(checks)).toBe(false)
    expect(checks.some((check) => check.verdict === 'warn')).toBe(true)
  })
})

describe('colours from any theme file', () => {
  test('hex, rgb, hsl, shadcn bare hsl and oklch all land as #RRGGBB', () => {
    expect(toHex('#abc')).toBe('#AABBCC')
    expect(toHex('#c25f2c80')).toBe('#C25F2C')
    expect(toHex('rgb(194 95 44)')).toBe('#C25F2C')
    expect(toHex('rgba(194, 95, 44, 0.5)')).toBe('#C25F2C')
    expect(toHex('hsl(0 0% 100%)')).toBe('#FFFFFF')
    expect(toHex('222.2 84% 4.9%')).toBe('#020817')
    expect(toHex('oklch(1 0 0)')).toBe('#FFFFFF')
    expect(toHex('oklch(0.145 0 0)')).toBe('#0A0A0A')
    expect(toHex('oklch(62.8% 0.2577 29.23)')).toBe('#FF0000')
    expect(toHex('var(--x)')).toBeNull()
  })
})

describe('importing a theme', () => {
  const Shadcn = `@layer base {
  :root { --background: oklch(1 0 0); --foreground: oklch(0.145 0 0); --card: oklch(1 0 0);
    --primary: oklch(0.205 0 0); --primary-foreground: oklch(0.985 0 0); --radius: 0.625rem; }
  .dark { --background: oklch(0.145 0 0); --foreground: oklch(0.985 0 0); }
}
@theme inline { --color-background: var(--background); }`

  test('shadcn / tweakcn CSS maps onto the eight tokens, per mode', () => {
    const draft = readTheme(Shadcn)
    expect(draft.light).toEqual({
      bg: '#FFFFFF',
      ink: '#0A0A0A',
      card: '#FFFFFF',
      accent: '#171717',
      accentInk: '#FAFAFA',
    })
    expect(draft.dark).toEqual({ bg: '#0A0A0A', ink: '#FAFAFA' })
  })

  test('what a file leaves out comes from the base, and says so', () => {
    const { light, dark, filled } = fillDraft(readTheme(Shadcn), THEMES.washi)
    expect(light.bg).toBe('#FFFFFF')
    expect(light.muted).toBe(THEMES.washi.light.muted)
    expect(dark.card).toBe(THEMES.washi.dark.card)
    expect(filled).toContain('light muted')
    expect(filled).not.toContain('light bg')
  })

  test('a Washi file round-trips through export', () => {
    const text = themeFile({ ...THEMES.kanagawa })
    expect(readTheme(text)).toEqual({
      name: 'Kanagawa',
      light: THEMES.kanagawa.light,
      dark: THEMES.kanagawa.dark,
    })
  })

  test('text that is no theme says what to paste', () => {
    expect(() => readTheme('body { color: red }')).toThrow(ThemeImportError)
    expect(() => readTheme('{ nope')).toThrow('does not parse')
  })
})
