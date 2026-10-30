import { fileAsOf, readFileAs, readStored, storedKey, writeStored } from '../../../lib'
import type {
  ActionRef,
  FrameLook,
  WidgetAsk,
  WidgetMessage,
  WidgetPage,
  WidgetWrite,
} from '../../../lib/types'
import { CSP_HOST, EMPTY_ANSWERS, TOKENS, WIDGET_ONERROR, WIDGET_STYLE } from './values'

const ASKS = new Set(['rows', 'table', 'pages', 'members', 'me', 'stored', 'file'])
const WRITES = new Set(['set', 'store', 'act', 'navigate'])

export function tokensOf(element: Element | null): string {
  if (!element) return ''
  const style = getComputedStyle(element)
  return TOKENS.map((token) => `${token}: ${style.getPropertyValue(token).trim()};`).join(' ')
}

/** `scheme://host` for a host, and for `*.domain` the domain itself too. */
function sources(scheme: string, hosts: readonly string[]): string[] {
  return hosts.flatMap((host) =>
    host.startsWith('*.')
      ? [`${scheme}://${host.slice(2)}`, `${scheme}://${host}`]
      : [`${scheme}://${host}`],
  )
}

/**
 * Scripts and styles inline only; nothing submits or navigates. With no hosts (the default) no
 * network at all — not even pictures, which could carry data out in their address. Listed hosts
 * (D118) may be reached over https and wss; `*` is every one.
 */
export function widgetCsp(network: readonly string[] = []): string {
  const isAny = network.includes('*')
  const hosts = network.filter((host) => CSP_HOST.test(host))
  const https = isAny ? ['https:'] : sources('https', hosts)
  const wss = isAny ? ['wss:'] : sources('wss', hosts)
  const reach = [...https, ...wss]
  return [
    "default-src 'none'",
    "script-src 'unsafe-inline'",
    "style-src 'unsafe-inline'",
    ['img-src data: blob:', ...https].join(' '),
    ['font-src data:', ...https].join(' '),
    ['media-src data: blob:', ...https].join(' '),
    ...(reach.length > 0 ? [['connect-src', ...reach].join(' ')] : []),
    "form-action 'none'",
    "base-uri 'none'",
  ].join('; ')
}

/** The frame's whole document: the CSP first, then the bundle; a widget's colours arrive on load. */
export function widgetDocument(
  js: string,
  network: readonly string[] = [],
  { style = WIDGET_STYLE, onerror = WIDGET_ONERROR }: FrameLook = {},
): string {
  const script = js.replace(/<\/(script)/gi, '<\\/$1')
  return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${widgetCsp(network)}">
<style>${style}</style>
<script>${onerror}</script>
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
    if (ask.type === 'file') return await answerFile(host, String(ask.key), ask.as)
    const raw = readStored(storedKey(host.pageId, String(ask.key)))
    return raw === undefined ? undefined : JSON.parse(raw)
  } catch {
    return EMPTY_ANSWERS[ask.type]
  }
}

/** An upload as the reader may open it, or why not — the frame's `useFile` throws the words. */
async function answerFile(host: WidgetPage['host'], key: string, as: unknown) {
  try {
    return { ok: true, value: await readFileAs(host, key, fileAsOf(as)) }
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : String(cause) }
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
