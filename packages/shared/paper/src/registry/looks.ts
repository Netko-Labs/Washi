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

/** `preset:sage` · `picture:fjord` · `file:<id>` · `unsplash:<id>` — a key, never a URL (D60). */
export const coverKeySchema = z.string().refine(
  (key) => {
    const [kind, name] = [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':') + 1)]
    if (kind === 'preset') return name in COVER_PRESETS
    if (kind === 'picture') return COVER_PICTURES.some((picture) => picture.slug === name)
    return FILE_KEY.test(key) || UNSPLASH_KEY.test(key)
  },
  { message: 'a cover is preset:<name>, picture:<name>, file:<id> or unsplash:<id>' },
)

/** An emoji, a registry icon name (checked where the names live), or an upload's `file:<id>`. */
export const pageIconSchema = z
  .string()
  .min(1)
  .max(48)
  .refine(
    (icon) => FILE_KEY.test(icon) || (icon.length <= 16 && /\p{Extended_Pictographic}/u.test(icon)),
    {
      message: 'an icon is a registry name, one emoji or file:<id>',
    },
  )
