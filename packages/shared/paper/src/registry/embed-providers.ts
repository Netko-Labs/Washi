import type { EmbedProvider, KnownEmbed } from './embed-types'

const path = (url: URL) => url.pathname.split('/').filter(Boolean)

/**
 * Sites every workspace may embed: each turns a page URL into its own player URL. Anything else
 * renders only from a host the workspace lists (Settings → Workspace → Embeds).
 */
export const EMBED_PROVIDERS: EmbedProvider[] = [
  {
    name: 'YouTube',
    hosts: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'],
    ratio: '16:9',
    player: (url) => {
      const id =
        url.hostname === 'youtu.be'
          ? path(url)[0]
          : (url.searchParams.get('v') ?? (path(url)[0] === 'shorts' ? path(url)[1] : undefined))
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null
    },
  },
  {
    name: 'Vimeo',
    hosts: ['vimeo.com', 'www.vimeo.com'],
    ratio: '16:9',
    player: (url) => {
      const id = path(url).find((part) => /^\d+$/.test(part))
      return id ? `https://player.vimeo.com/video/${id}` : null
    },
  },
  {
    name: 'Spotify',
    hosts: ['open.spotify.com'],
    height: 152,
    player: (url) => {
      const [kind, id] = path(url).filter((part) => !part.startsWith('intl-'))
      if (!kind || !id) return null
      return `https://open.spotify.com/embed/${kind}/${encodeURIComponent(id)}`
    },
  },
  {
    name: 'Loom',
    hosts: ['loom.com', 'www.loom.com'],
    ratio: '16:9',
    player: (url) => {
      const [kind, id] = path(url)
      return kind === 'share' && id ? `https://www.loom.com/embed/${encodeURIComponent(id)}` : null
    },
  },
  {
    name: 'Figma',
    hosts: ['figma.com', 'www.figma.com'],
    ratio: '4:3',
    player: (url) =>
      `https://www.figma.com/embed?embed_host=washi&url=${encodeURIComponent(url.href)}`,
  },
  {
    name: 'CodePen',
    hosts: ['codepen.io'],
    ratio: '4:3',
    player: (url) => {
      const [user, kind, id] = path(url)
      return user && kind === 'pen' && id ? `https://codepen.io/${user}/embed/${id}` : null
    },
  },
  {
    name: 'CodeSandbox',
    hosts: ['codesandbox.io'],
    ratio: '4:3',
    player: (url) => {
      const [kind, id] = path(url)
      return (kind === 's' || kind === 'p') && id ? `https://codesandbox.io/embed/${id}` : null
    },
  },
  {
    name: 'Miro',
    hosts: ['miro.com'],
    ratio: '4:3',
    player: (url) => {
      const [, , id] = path(url)
      return id ? `https://miro.com/app/live-embed/${id}` : null
    },
  },
  {
    name: 'Google Maps',
    hosts: ['www.google.com', 'google.com'],
    ratio: '4:3',
    player: (url) => (url.pathname.startsWith('/maps/embed') ? url.href : null),
  },
  {
    name: 'Indify',
    hosts: ['indify.co'],
    height: 180,
    player: (url) => (url.pathname.startsWith('/widgets/live/') ? url.href : null),
  },
]

/** A URL a built-in provider plays, or null: the workspace's own list decides the rest. */
export function knownEmbed(src: string): KnownEmbed | null {
  let url: URL
  try {
    url = new URL(src)
  } catch {
    return null
  }
  if (url.protocol !== 'https:') return null
  const provider = EMBED_PROVIDERS.find((each) => each.hosts.includes(url.hostname))
  const player = provider?.player(url)
  return provider && player ? { provider, player } : null
}

/** `Docs.Example.com` → `docs.example.com`; null for anything that is not a bare host name. */
export function embedHost(raw: string): string | null {
  const host = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
  return /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host)
    ? host
    : null
}
