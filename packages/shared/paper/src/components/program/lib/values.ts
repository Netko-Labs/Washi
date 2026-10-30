/** One draw's budget: past it, QuickJS interrupts the page mid-loop. */
export const PROGRAM_DEADLINE_MS = 100
export const PROGRAM_MEMORY_BYTES = 32 * 1024 * 1024
/** A clock may tick; nothing draws again more often than this. */
export const PROGRAM_MIN_INTERVAL_MS = 1000

/** The bridge a page's sandbox is lent, each as `__bridge_<name>`. */
export const PROGRAM_BRIDGE = [
  'rows',
  'table',
  'state',
  'seed',
  'set',
  'stored',
  'store',
  'interval',
  'page',
  'pages',
  'members',
  'me',
  'navigate',
  'act',
  'file',
]

/**
 * What every page that runs stands on, inside the sandbox: the registry's names as tags, `__h`
 * (the JSX factory, named so no page's own `h` shadows it) that calls a page's own components and
 * keeps handlers, and `globalThis.__washi` — what
 * `import … from 'washi'` reads. A page acts only from a press, so drawing can never write — the
 * host refuses one too (`programBridge`), whatever the page's code calls.
 */
export const programPrelude = (names: string[]) => `
for (const name of ${JSON.stringify(names)}) globalThis[name] = name
;(() => {
// The bridge is taken in here and its globals removed: page code reaches the host only through
// the hooks below, never by calling a __bridge_* itself.
const B = {}
for (const name of ${JSON.stringify(PROGRAM_BRIDGE)}) {
  B[name] = globalThis['__bridge_' + name]
  delete globalThis['__bridge_' + name]
}
globalThis.Fragment = '__fragment'
let __handlers = [], __slots = [], __slot = 0, __drawing = false
globalThis.__h = (name, props, ...children) => {
  const kids = children.flat(Infinity).filter((child) => child != null && child !== false && child !== true)
  if (typeof name === 'function') return name({ ...(props || {}), children: kids })
  const out = {}
  for (const [key, value] of Object.entries(props || {})) {
    if (typeof value === 'function') {
      __handlers.push(value)
      out[key] = { washiHandler: __handlers.length - 1 }
    } else out[key] = value
  }
  return { name, props: out, children: kids }
}
const __read = (raw, fallback) => (raw === undefined ? fallback : JSON.parse(raw))
const __pressOnly = (what) => {
  if (__drawing) throw new Error(what + ' runs from a press, never while the page draws')
}
const __act = (action) => {
  __pressOnly('act')
  B.act(JSON.stringify(action))
}
const __keyed = (get, put, what) => (key, initial) => {
  const value = __read(get(String(key)), initial)
  const set = (next) => {
    __pressOnly(what)
    put(String(key), JSON.stringify(typeof next === 'function' ? next(value) : next))
  }
  return [value, set]
}
const __files = new Map()
const __bytes = (text) => {
  const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const clean = text.replace(/=+$/, '')
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4))
  let bits = 0, value = 0, at = 0
  for (let i = 0; i < clean.length; i++) {
    value = ((value << 6) | ABC.indexOf(clean[i])) & 0xffffff
    bits += 6
    if (bits >= 8) {
      bits -= 8
      out[at++] = (value >> bits) & 255
    }
  }
  return out
}
// An upload is read once per sandbox and kept: what a file holds never changes under its id.
const __useFile = (key, options) => {
  const as = (options && options.as) || 'text'
  const id = as + ':' + String(key)
  if (__files.has(id)) return __files.get(id)
  const raw = B.file(String(key), as)
  if (raw === undefined) return null
  const answer = JSON.parse(raw)
  if (answer.error) throw new Error(answer.error)
  const value = as === 'bytes' ? __bytes(answer.value) : answer.value
  __files.set(id, value)
  return value
}
const __pageState = __keyed((key) => B.state(key), (key, json) => B.set(key, json), 'a page state change')
globalThis.__washi = {
  useRows: (query) => __read(B.rows(JSON.stringify(query)), []),
  useRow: (table, id) =>
    __read(B.rows(JSON.stringify({ table, where: [{ column: 'id', op: 'eq', value: id }], limit: 1 })), [])[0] ?? null,
  useTable: (name) => __read(B.table(String(name)), null),
  useInsert: (table) => (data) => __act({ verb: 'table.insert', table, data }),
  useUpdate: (table) => (row, set) => __act({ verb: 'table.update', table, row, set }),
  useDelete: (table) => (row) => __act({ verb: 'table.delete', table, row }),
  useState: (initial) => {
    const at = __slot++
    if (!(at in __slots)) __slots[at] = typeof initial === 'function' ? initial() : initial
    const set = (next) => {
      __pressOnly('a state change')
      __slots[at] = typeof next === 'function' ? next(__slots[at]) : next
    }
    return [__slots[at], set]
  },
  usePageState: (key, initial) => {
    if (initial !== undefined && B.state(String(key)) === undefined) B.seed(String(key), JSON.stringify(initial))
    return __pageState(key, initial)
  },
  useStored: __keyed((key) => B.stored(key), (key, json) => B.store(key, json), 'a stored change'),
  useInterval: (ms) => void B.interval(String(ms)),
  useNow: (ms = 1000) => {
    B.interval(String(ms))
    return Date.now()
  },
  usePage: () => __read(B.page(), null),
  usePages: (of) => __read(B.pages(of == null ? '' : String(of)), []),
  useMembers: () => __read(B.members(), []),
  useMe: () => __read(B.me(), null),
  useFile: __useFile,
  useNavigate: () => (id) => {
    __pressOnly('navigate')
    B.navigate(String(id))
  },
  act: __act,
}
globalThis.__render = () => {
  __handlers = []
  __slot = 0
  __drawing = true
  try {
    return JSON.stringify(globalThis.__page.view())
  } finally {
    __drawing = false
  }
}
globalThis.__invoke = (id) => {
  const handler = __handlers[id]
  if (handler) handler()
  return 'null'
}
})()
`
