/** A widget's own height is believed between these; a fixed `height` overrides it. */
export const MIN_HEIGHT = 40
export const MAX_HEIGHT = 4000
export const FIRST_HEIGHT = 160

/**
 * No network at all — not even pictures, which could carry data out in their address. Scripts and
 * styles inline only; nothing loads, submits or navigates.
 */
export const WIDGET_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  'img-src data: blob:',
  'font-src data:',
  'media-src data: blob:',
  "form-action 'none'",
  "base-uri 'none'",
].join('; ')

/** Inside the frame: `washi.rows`, `washi.state`, `washi.onState`, `washi.setState`, `washi.act`. */
export const WIDGET_PRELUDE = `(() => {
  const pending = new Map()
  const listeners = new Set()
  let next = 0
  let state = {}
  const send = (message) => parent.postMessage({ washi: true, ...message }, '*')
  addEventListener('message', (event) => {
    if (event.source !== parent || !event.data || !event.data.washi) return
    const message = event.data
    if (message.type === 'rows') { pending.get(message.id)?.(message.rows); pending.delete(message.id) }
    if (message.type === 'state') { state = message.values; for (const listener of listeners) listener(state) }
    if (message.type === 'tokens') document.documentElement.setAttribute('style', message.css)
  })
  window.washi = {
    rows: (query) => new Promise((resolve) => { const id = ++next; pending.set(id, resolve); send({ type: 'rows', id, query }) }),
    get state() { return state },
    onState: (listener) => { listeners.add(listener); listener(state); return () => listeners.delete(listener) },
    setState: (key, value) => send({ type: 'set', key, value }),
    act: (action) => send({ type: 'act', action }),
  }
  const measure = () => send({ type: 'height', value: document.documentElement.scrollHeight })
  new ResizeObserver(measure).observe(document.documentElement)
  addEventListener('load', measure)
})()`
