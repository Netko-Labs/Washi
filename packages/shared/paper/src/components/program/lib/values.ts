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
]

/**
 * What every page that runs stands on, inside the sandbox: the registry's names as tags, `h` that
 * calls a page's own components and keeps handlers, and `globalThis.__washi` — what
 * `import … from 'washi'` reads. A page acts only from a press, so drawing can never write.
 */
export const programPrelude = (names: string[]) => `
for (const name of ${JSON.stringify(names)}) globalThis[name] = name
globalThis.Fragment = '__fragment'
let __handlers = [], __slots = [], __slot = 0, __drawing = false
globalThis.h = (name, props, ...children) => {
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
  __bridge_act(JSON.stringify(action))
}
const __keyed = (get, put, what) => (key, initial) => {
  const value = __read(get(String(key)), initial)
  const set = (next) => {
    __pressOnly(what)
    put(String(key), JSON.stringify(typeof next === 'function' ? next(value) : next))
  }
  return [value, set]
}
globalThis.__washi = {
  useRows: (query) => __read(__bridge_rows(JSON.stringify(query)), []),
  useRow: (table, id) =>
    __read(__bridge_rows(JSON.stringify({ table, where: [{ column: 'id', op: 'eq', value: id }], limit: 1 })), [])[0] ?? null,
  useTable: (name) => __read(__bridge_table(String(name)), null),
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
  usePageState: __keyed((key) => __bridge_state(key), (key, json) => __bridge_set(key, json), 'a page state change'),
  useStored: __keyed((key) => __bridge_stored(key), (key, json) => __bridge_store(key, json), 'a stored change'),
  useInterval: (ms) => void __bridge_interval(String(ms)),
  useNow: (ms = 1000) => {
    __bridge_interval(String(ms))
    return Date.now()
  },
  usePage: () => __read(__bridge_page(), null),
  usePages: (of) => __read(__bridge_pages(of == null ? '' : String(of)), []),
  useMembers: () => __read(__bridge_members(), []),
  useMe: () => __read(__bridge_me(), null),
  useNavigate: () => (id) => {
    __pressOnly('navigate')
    __bridge_navigate(String(id))
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
`
