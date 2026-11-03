import { z } from 'zod'

/** Gradients drawn from Washi's own palette. A page wears `preset:<key>`. */
export const COVER_PRESETS: Record<string, { label: string; background: string }> = {
  persimmon: { label: 'Persimmon', background: 'linear-gradient(120deg, #d4713f, #e9a066)' },
  paper: { label: 'Paper', background: 'linear-gradient(120deg, #f7edd6, #e6d3ad)' },
  sage: { label: 'Sage', background: 'linear-gradient(120deg, #aebb9a, #74866a)' },
  matcha: { label: 'Matcha', background: 'linear-gradient(120deg, #c9d6a3, #8fa65c)' },
  sakura: { label: 'Sakura', background: 'linear-gradient(120deg, #f7d3c4, #f0a487)' },
  indigo: { label: 'Indigo', background: 'linear-gradient(120deg, #3d4f7c, #7a8cbf)' },
  sky: { label: 'Sky', background: 'linear-gradient(120deg, #bcd8e8, #f2e6c9)' },
  dusk: { label: 'Dusk', background: 'linear-gradient(120deg, #31261e, #8a5a3c)' },
  ink: { label: 'Ink', background: 'linear-gradient(120deg, #221a14, #4a3a2e)' },
}

/** The twelve photographs Washi ships, the same bytes on every install. A page wears `picture:<slug>`. */
export const COVER_PICTURES: { slug: string; label: string }[] = [
  { slug: 'fjord', label: 'Fjord' },
  { slug: 'canyon', label: 'Canyon' },
  { slug: 'highlands', label: 'Highlands' },
  { slug: 'storm-sea', label: 'Storm sea' },
  { slug: 'aurora', label: 'Aurora' },
  { slug: 'fog', label: 'Fog' },
  { slug: 'snow-camp', label: 'Snow camp' },
  { slug: 'waterfall', label: 'Waterfall' },
  { slug: 'valley', label: 'Valley' },
  { slug: 'river', label: 'River' },
  { slug: 'alley', label: 'Alley' },
  { slug: 'tower', label: 'Tower' },
]

export const FILE_KEY = /^file:[a-z0-9-]{1,48}$/
/** A photo picked from Unsplash: the workspace keeps its hotlinks and credit by id (D117). */
export const UNSPLASH_KEY = /^unsplash:[A-Za-z0-9_-]{1,64}$/

const UNSPLASH_UTM = { utm_source: 'washi', utm_medium: 'referral' }
export const UNSPLASH_HOME = 'https://unsplash.com/'

/** Unsplash's guidelines: a link back to it or a photographer carries the app's referral. */
export function unsplashLink(href: string): string {
  const url = new URL(href)
  for (const [key, value] of Object.entries(UNSPLASH_UTM)) url.searchParams.set(key, value)
  return url.href
}

export const unsplashCaption = (name: string) => `Photo by ${name} on Unsplash`

/** The registry's page icons: a page wears one by name, or an emoji, or an upload. */
export const SHEET_ICONS = [
  'notebook',
  'book',
  'bookmark',
  'calendar',
  'chart',
  'checklist',
  'clock',
  'compass',
  'flag',
  'flask',
  'heart',
  'home',
  'inbox',
  'kanban',
  'leaf',
  'map',
  'money',
  'music',
  'pen',
  'plane',
  'rocket',
  'sparkles',
  'star',
  'sun',
  'tag',
  'target',
  'tools',
  'user',
] as const

/** Edits between two short names — enough to say "did you mean". */
function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, at) => at)
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0] ?? 0
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const above = row[j] ?? 0
      row[j] = Math.min(
        above + 1,
        (row[j - 1] ?? 0) + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
      diagonal = above
    }
  }
  return row[b.length] ?? 0
}

/** The names nearest a miss, closest first: within two edits, or one holding the other. */
export function nearestNames(miss: string, names: readonly string[], count = 3): string[] {
  const word = miss.toLowerCase()
  return names
    .map((name) => ({
      name,
      score: name.includes(word) || word.includes(name) ? 0 : distance(word, name),
    }))
    .filter((each) => each.score <= 2)
    .sort((a, b) => a.score - b.score)
    .slice(0, count)
    .map((each) => each.name)
}

const meant = (miss: string, names: readonly string[]) => {
  const near = nearestNames(miss, names)
  return near.length > 0 ? ` — did you mean ${near.join(' or ')}?` : '.'
}

export const COVER_PRESET_NAMES = Object.keys(COVER_PRESETS)
export const COVER_PICTURE_NAMES = COVER_PICTURES.map((picture) => picture.slug)

/** Why a cover key is not one, naming every key it could be; null when it is one. */
export function coverKeyProblem(key: string): string | null {
  const [kind, name] = [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':') + 1)]
  if (kind === 'preset' && name in COVER_PRESETS) return null
  if (kind === 'picture' && COVER_PICTURE_NAMES.includes(name)) return null
  if (FILE_KEY.test(key) || UNSPLASH_KEY.test(key)) return null
  const presets = `preset:${COVER_PRESET_NAMES.join(' · ')}`
  const pictures = `picture:${COVER_PICTURE_NAMES.join(' · ')}`
  const near =
    kind === 'preset'
      ? meant(name, COVER_PRESET_NAMES)
      : kind === 'picture'
        ? meant(name, COVER_PICTURE_NAMES)
        : '.'
  return `"${key}" is not a cover${near} A cover is ${presets}; ${pictures}; file:<id> (an upload) or unsplash:<id>`
}

/** `preset:sage` · `picture:fjord` · `file:<id>` · `unsplash:<id>` — a key, never a URL (D60). */
export const coverKeySchema = z.string().superRefine((key, ctx) => {
  const problem = coverKeyProblem(key)
  if (problem) ctx.addIssue({ code: 'custom', message: problem })
})

const isEmojiIcon = (icon: string) => icon.length <= 16 && /\p{Extended_Pictographic}/u.test(icon)

/** An emoji or an upload's `file:<id>` — what a page may wear besides a registry name. */
export const pageIconSchema = z
  .string()
  .min(1)
  .max(48)
  .refine((icon) => FILE_KEY.test(icon) || isEmojiIcon(icon), {
    message: 'an icon is a registry name, one emoji or file:<id>',
  })

/** Why an icon is not one, naming every registry icon; null when it is one. */
export function sheetIconProblem(icon: string): string | null {
  if ((SHEET_ICONS as readonly string[]).includes(icon)) return null
  if (icon.length >= 1 && icon.length <= 48 && (FILE_KEY.test(icon) || isEmojiIcon(icon))) {
    return null
  }
  return `"${icon}" is not an icon${meant(icon, SHEET_ICONS)} An icon is one emoji, file:<id> (an upload) or a registry name: ${SHEET_ICONS.join(' · ')}`
}

/** A page's icon: a registry name, one emoji or `file:<id>` — a miss names what would do. */
export const sheetIconSchema = z.string().superRefine((icon, ctx) => {
  const problem = sheetIconProblem(icon)
  if (problem) ctx.addIssue({ code: 'custom', message: problem })
})
