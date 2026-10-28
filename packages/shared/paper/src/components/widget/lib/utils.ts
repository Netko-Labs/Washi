import { WIDGET_CSP, WIDGET_PRELUDE } from './values'

const TOKENS = [
  '--ink',
  '--muted',
  '--accent',
  '--accent-ink',
  '--card',
  '--bg',
  '--border',
  '--muted-bg',
]

/** The page's colours as the widget's own, so it can look like it belongs without reading anything. */
export function tokensOf(element: Element | null): string {
  if (!element) return ''
  const style = getComputedStyle(element)
  return TOKENS.map((token) => `${token}: ${style.getPropertyValue(token).trim()};`).join(' ')
}

/** The frame's whole document: the CSP first, then the bridge, then the widget; colours arrive on load. */
export function widgetDocument(html: string): string {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${WIDGET_CSP}">
<style>:root { color-scheme: light dark; } body { margin: 0; font: 14px/1.5 system-ui, sans-serif; color: var(--ink); background: transparent; }</style>
<script>${WIDGET_PRELUDE}</script>
</head><body>${html}</body></html>`
}

/** Page state holds text, numbers or true/false; anything else a widget sends is not kept. */
export const isScalar = (value: unknown): value is string | number | boolean | null =>
  value === null || ['string', 'number', 'boolean'].includes(typeof value)
