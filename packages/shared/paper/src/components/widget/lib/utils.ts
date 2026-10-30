import { readStored, storedKey, writeStored } from '../../../lib'
import type {
  ActionRef,
  WidgetAsk,
  WidgetMessage,
  WidgetPage,
  WidgetWrite,
} from '../../../lib/types'
import { EMPTY_ANSWERS, TOKENS, WIDGET_CSP, WIDGET_ONERROR, WIDGET_STYLE } from './values'

const ASKS = new Set(['rows', 'table', 'pages', 'members', 'me', 'stored'])
const WRITES = new Set(['set', 'store', 'act', 'navigate'])

export function tokensOf(element: Element | null): string {
  if (!element) return ''
  const style = getComputedStyle(element)
  return TOKENS.map((token) => `${token}: ${style.getPropertyValue(token).trim()};`).join(' ')
}

/** The frame's whole document: the CSP first, then the widget's bundle; colours arrive on load. */
export function widgetDocument(js: string): string {
  const script = js.replace(/<\/(script)/gi, '<\\/$1')
  return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${WIDGET_CSP}">
<style>${WIDGET_STYLE}</style>
<script>${WIDGET_ONERROR}</script>
</head><body><div id="root"></div><script>${script}</script></body></html>`
}

/** Page state holds text, numbers or true/false; anything else a widget sends is not kept. */
export const isScalar = (value: unknown): value is string | number | boolean | null =>
  value === null || ['string', 'number', 'boolean'].includes(typeof value)

export const isAsk = (message: WidgetMessage): message is WidgetAsk =>
  ASKS.has(message.type) && typeof (message as WidgetAsk).id === 'number'

export const isWrite = (message: WidgetMessage): message is WidgetWrite => WRITES.has(message.type)

/** One ask answered as the reader: exactly what the page's own code could read. */
export async function answerAsk(ask: WidgetAsk, { host }: WidgetPage): Promise<unknown> {
  try {
    if (ask.type === 'rows') {
      return (await host.runQuery(ask.query as Parameters<typeof host.runQuery>[0])).rows
    }
    if (ask.type === 'table') return await host.describeTable(String(ask.name))
    if (ask.type === 'pages') {
      const parent = ask.of || host.pageId
      return parent && host.listPages ? host.listPages(parent) : []
    }
    if (ask.type === 'members') return (await host.describePeople?.()) ?? []
    if (ask.type === 'me') return (await host.describeMe?.()) ?? null
    const raw = readStored(storedKey(host.pageId, String(ask.key)))
    return raw === undefined ? undefined : JSON.parse(raw)
  } catch {
    return EMPTY_ANSWERS[ask.type]
  }
}

/** A frame's write, applied as the page's own code would apply it. */
export function applyWrite(write: WidgetWrite, { host, set }: WidgetPage) {
  if (write.type === 'set' && typeof write.key === 'string' && isScalar(write.value)) {
    set(write.key, write.value)
  }
  if (write.type === 'store' && typeof write.key === 'string') {
    writeStored(storedKey(host.pageId, write.key), JSON.stringify(write.value ?? null))
  }
  if (write.type === 'act') void host.runAction(write.action as ActionRef).catch(() => {})
  if (write.type === 'navigate' && typeof write.id === 'string') host.openSheet(write.id)
}

/**
 * The person pressed inside this frame just now: it holds the focus and their gesture still
 * counts. The frame's code can send anything; only a press it could not fake lets a write through.
 */
export function isPressed(frame: HTMLIFrameElement | null): boolean {
  return (
    frame !== null &&
    document.activeElement === frame &&
    navigator.userActivation?.isActive === true
  )
}

export function postTo(frame: HTMLIFrameElement | null, message: Record<string, unknown>) {
  try {
    frame?.contentWindow?.postMessage({ washi: true, ...message }, '*')
  } catch {
    // An answer that cannot be cloned is not sent; the frame keeps what it had.
  }
}

/** `height` is the least a widget takes: content that draws taller is never cut. */
export const frameHeight = (height: number | undefined, measured: number) =>
  Math.max(height ?? 0, measured)
