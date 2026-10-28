import { toHex } from './theme-color'
import type { ThemeDraft, ThemeMode, ThemePair, ThemeTokens } from './themes'

export const THEME_TOKENS: readonly (keyof ThemeTokens)[] = [
  'bg',
  'card',
  'ink',
  'muted',
  'border',
  'mutedBg',
  'accent',
  'accentInk',
]

/** shadcn's variable for each token; tweakcn writes the same names. */
const SHADCN: Record<string, keyof ThemeTokens> = {
  background: 'bg',
  card: 'card',
  foreground: 'ink',
  'muted-foreground': 'muted',
  border: 'border',
  muted: 'mutedBg',
  primary: 'accent',
  'primary-foreground': 'accentInk',
}

export class ThemeImportError extends Error {}

function readCss(text: string): ThemeDraft {
  const draft: ThemeDraft = { name: null, light: {}, dark: {} }
  for (const block of text.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const selector = (block[1] ?? '').trim()
    if (selector.startsWith('@')) continue
    const mode: ThemeMode | null = /dark/.test(selector)
      ? 'dark'
      : /:root|light|html|body/.test(selector)
        ? 'light'
        : null
    if (!mode) continue
    for (const declaration of (block[2] ?? '').matchAll(/--([\w-]+)\s*:\s*([^;]+)/g)) {
      const token = SHADCN[declaration[1] ?? '']
      const color = toHex(declaration[2] ?? '')
      if (token && color) draft[mode][token] = color
    }
  }
  return draft
}

function readTokens(value: unknown): Partial<ThemeTokens> {
  const out: Partial<ThemeTokens> = {}
  if (!value || typeof value !== 'object') return out
  for (const token of THEME_TOKENS) {
    const raw = (value as Record<string, unknown>)[token]
    const color = typeof raw === 'string' ? toHex(raw) : null
    if (color) out[token] = color
  }
  return out
}

function readJson(text: string): ThemeDraft {
  let file: unknown
  try {
    file = JSON.parse(text)
  } catch {
    throw new ThemeImportError('That JSON does not parse.')
  }
  const record = (file ?? {}) as Record<string, unknown>
  return {
    name: typeof record.name === 'string' ? record.name.slice(0, 40) : null,
    light: readTokens(record.light),
    dark: readTokens(record.dark),
  }
}

/** A Washi theme file or shadcn / tweakcn CSS (`:root { --background: … } .dark { … }`). */
export function readTheme(text: string): ThemeDraft {
  const draft = text.trim().startsWith('{') ? readJson(text) : readCss(text)
  if (Object.keys(draft.light).length + Object.keys(draft.dark).length === 0) {
    throw new ThemeImportError(
      'No theme in there — paste :root { --background: … } and .dark { … }, or a Washi theme file.',
    )
  }
  return draft
}

/** The draft over `base`: every token it lacks comes from there, named in `filled`. */
export function fillDraft(draft: ThemeDraft, base: ThemePair) {
  const filled: string[] = []
  const mode = (name: ThemeMode): ThemeTokens => {
    const tokens = { ...base[name] }
    for (const token of THEME_TOKENS) {
      const color = draft[name][token]
      if (color) tokens[token] = color
      else filled.push(`${name} ${token}`)
    }
    return tokens
  }
  return { light: mode('light'), dark: mode('dark'), filled }
}

/** What Export writes and Import reads back. */
export function themeFile(pair: Pick<ThemePair, 'name' | 'light' | 'dark'>): string {
  return `${JSON.stringify({ washi: 'theme/1', name: pair.name, light: pair.light, dark: pair.dark }, null, 2)}\n`
}
