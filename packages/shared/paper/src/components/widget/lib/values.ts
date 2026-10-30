/** A widget's own height is believed between these; a fixed `height` overrides it. */
export const MIN_HEIGHT = 40
export const MAX_HEIGHT = 4000
export const FIRST_HEIGHT = 160
/** How often a running widget asks again whether widgets are still allowed. */
export const RECHECK_MS = 30_000

/** The page's colours a frame wears, so it can look like it belongs without reading anything. */
export const TOKENS = [
  '--ink',
  '--muted',
  '--accent',
  '--accent-ink',
  '--card',
  '--bg',
  '--border',
  '--muted-bg',
]

/** A host as a CSP source may name it; anything else from the list is dropped, never spliced in. */
export const CSP_HOST = /^(\*\.)?([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/

export const WIDGET_STYLE = `:root { color-scheme: light dark; }
body { margin: 0; font: 14px/1.5 system-ui, sans-serif; color: var(--ink); background: transparent; }
.washi-stopped { margin: 0; color: var(--muted); font-size: 13px; }`

/** Code that throws before React has mounted still says why, in the frame. */
export const WIDGET_ONERROR = `addEventListener('error', (event) => {
  const said = document.createElement('p')
  said.className = 'washi-stopped'
  said.textContent = 'This widget stopped: ' + event.message
  document.body.replaceChildren(said)
})`

export const HTML_WORDS = 'This widget was written as HTML; rewrite it as a JSX component.'

/** What an ask answers when the page has nothing to say, or failed to. */
export const EMPTY_ANSWERS: Record<string, unknown> = {
  rows: [],
  pages: [],
  members: [],
  table: null,
  me: null,
  stored: undefined,
}
