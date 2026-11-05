import type { ImagePurpose } from './types'

/** Each purpose's size: a cover's band, an icon's square, a figure's frame (D126). */
export const IMAGE_PRESETS: Record<ImagePurpose, { width: number; height: number }> = {
  cover: { width: 1500, height: 600 },
  icon: { width: 256, height: 256 },
  figure: { width: 1200, height: 800 },
}

export const MIN_SIDE = 16
export const MAX_SIDE = 2400
/** Markup larger than this is a page, not a picture. */
export const MAX_HTML_CHARS = 200_000
/** Elements past this are refused before layout, so a picture cannot tie the server up. */
export const MAX_NODES = 3000
/** Uploads one picture may show, inlined. */
export const MAX_INLINED_FILES = 12
export const PNG = 'image/png'

/** Laid out as blocks are: one under another unless the markup says flex or grid of its own. */
export const BLOCK_TAGS = new Set([
  'div',
  'section',
  'article',
  'aside',
  'header',
  'footer',
  'main',
  'nav',
  'figure',
  'figcaption',
  'ul',
  'ol',
  'li',
  'form',
  'fieldset',
  'blockquote',
  'body',
  'html',
  'table',
  'thead',
  'tbody',
  'tr',
  'dl',
  'dd',
  'dt',
])

/** Never drawn: scripts, frames, links out and the head. Their contents are dropped with them. */
export const DROPPED_TAGS = new Set([
  'script',
  'style',
  'link',
  'meta',
  'head',
  'title',
  'iframe',
  'object',
  'embed',
  'noscript',
  'template',
  'base',
  'audio',
  'video',
  'canvas',
  'input',
  'select',
  'textarea',
])

/** Attributes that name a resource: only a `data:` picture or an upload may stand there. */
export const RESOURCE_ATTRIBUTES = new Set(['src', 'href', 'xlink:href', 'srcset', 'poster'])

/** Pictures that may be inlined; SVG never (D95), a picture is drawn, not run. */
export const INLINED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

/** The house fonts, as `@fontsource` ships them in woff (Satori reads no woff2). */
export const FONT_FILES = [
  {
    name: 'Washi Sans',
    weight: 400,
    file: '@fontsource/zen-kaku-gothic-new/files/zen-kaku-gothic-new-latin-400-normal.woff',
  },
  {
    name: 'Washi Sans',
    weight: 700,
    file: '@fontsource/zen-kaku-gothic-new/files/zen-kaku-gothic-new-latin-700-normal.woff',
  },
  {
    name: 'Washi Serif',
    weight: 400,
    file: '@fontsource/young-serif/files/young-serif-latin-400-normal.woff',
  },
] as const

/** Names a markup may use for the house fonts; anything else falls back to Washi Sans. */
export const FONT_ALIASES: Record<string, string> = {
  'sans-serif': 'Washi Sans',
  sans: 'Washi Sans',
  'system-ui': 'Washi Sans',
  serif: 'Washi Serif',
  'washi sans': 'Washi Sans',
  'washi serif': 'Washi Serif',
}
