/** A script's whole budget for one run: past it, QuickJS interrupts it mid-loop. */
export const RUN_DEADLINE_MS = 60
export const MEMORY_BYTES = 16 * 1024 * 1024
/** A clock may tick; nothing re-runs more often than this. */
export const MIN_INTERVAL_MS = 1000

/**
 * What every script runs on, inside the sandbox: the registry's names as JSX tags, `h` to build a
 * tree of plain data, and the hooks — each reaching out only through a `__bridge_*` the host lends.
 */
export const prelude = (names: string[]) => `
for (const name of ${JSON.stringify(names)}) globalThis[name] = name
globalThis.Fragment = '__fragment'
let __handlers = []
globalThis.h = (name, props, ...children) => {
  const out = {}
  for (const [key, value] of Object.entries(props || {})) {
    if (typeof value === 'function') {
      __handlers.push(value)
      out[key] = { washiHandler: __handlers.length - 1 }
    } else out[key] = value
  }
  const kept = children.flat(Infinity).filter((child) => child != null && child !== false && child !== true)
  return { name, props: out, children: kept }
}
globalThis.useState = (key, initial) => {
  const raw = __bridge_state(String(key))
  const value = raw === undefined ? initial : JSON.parse(raw)
  const set = (next) => __bridge_set(String(key), JSON.stringify(typeof next === 'function' ? next(value) : next))
  return [value, set]
}
globalThis.useRows = (query) => {
  const raw = __bridge_rows(JSON.stringify(query))
  return raw === undefined ? [] : JSON.parse(raw)
}
globalThis.useInterval = (ms) => __bridge_interval(Number(ms))
globalThis.act = (action) => __bridge_act(JSON.stringify(action))
globalThis.now = () => Date.now()
globalThis.__render = () => {
  __handlers = []
  return JSON.stringify(view())
}
globalThis.__invoke = (id) => {
  const handler = __handlers[id]
  if (handler) handler()
  return 'null'
}
`
