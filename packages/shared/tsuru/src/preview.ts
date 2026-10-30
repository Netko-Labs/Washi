import { guardedFetch } from './fetch'
import { fetchPolicySchema } from './policy'

export interface LinkPreview {
  href: string
  title: string | null
  description: string | null
  image: string | null
  site: string | null
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
}

const decode = (text: string) =>
  text
    .replace(/&(amp|lt|gt|quot|#39|apos);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\s+/g, ' ')
    .trim()

function meta(html: string, names: string[]): string | null {
  for (const name of names) {
    const tag = html.match(
      new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*>`, 'i'),
    )?.[0]
    const content = tag?.match(/content=["']([^"']*)["']/i)?.[1]
    if (content?.trim()) return decode(content)
  }
  return null
}

/** Only an https image becomes a card's picture; a relative one is read against the page. */
function imageOf(raw: string | null, base: URL): string | null {
  if (!raw) return null
  try {
    const url = new URL(raw, base)
    return url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

/** What a page says about itself, read off its head. Pure: the HTML is already fetched. */
export function readPreview(href: string, html: string): LinkPreview {
  const url = new URL(href)
  const head = html.slice(0, 200_000)
  const tagTitle = head.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]
  const title = meta(head, ['og:title', 'twitter:title']) ?? (tagTitle ? decode(tagTitle) : null)
  return {
    href: url.href,
    title: title?.slice(0, 200) || null,
    description:
      meta(head, ['og:description', 'twitter:description', 'description'])?.slice(0, 400) ?? null,
    image: imageOf(meta(head, ['og:image', 'twitter:image']), url),
    site: meta(head, ['og:site_name'])?.slice(0, 80) ?? null,
  }
}

/**
 * A person asked for this link's card: their press is the consent for this one host, so the
 * policy allows exactly it — still https only, no private ranges (unless the server lifted that
 * guard), redirects re-checked.
 */
export async function linkPreview(href: string, allowPrivate = false): Promise<LinkPreview> {
  const host = new URL(href).hostname
  const html = await guardedFetch(
    href,
    fetchPolicySchema.parse({
      allowedHosts: [host],
      allowPrivate,
      maxResponseBytes: 524_288,
      timeoutMs: 8000,
    }),
  )
  return readPreview(href, html)
}
