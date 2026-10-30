/**
 * What `washi` is inside a widget's frame (D113): the page code's hooks over real React, each read
 * asked of the page through `postMessage` and answered as the reader. A write is a press's: the
 * frame refuses one without the person's gesture, and the page checks again before it acts.
 */
export const WIDGET_FRAME = `
import {
  Component,
  createElement,
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { createRoot } from 'react-dom/client'

globalThis.h = createElement
globalThis.Fragment = Fragment

const MIN_INTERVAL_MS = 1000
const send = (message) => parent.postMessage({ washi: true, ...message }, '*')
const pending = new Map()
let asked = 0
const ask = (type, body) =>
  new Promise((resolve) => {
    asked += 1
    pending.set(asked, resolve)
    send({ type, id: asked, ...body })
  })

let live = { state: {}, page: null, props: {}, data: 0, pages: 0 }
const listeners = new Set()
const update = (next) => {
  live = { ...live, ...next }
  for (const listener of listeners) listener()
}
const subscribe = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const useLive = () => useSyncExternalStore(subscribe, () => live)

addEventListener('message', (event) => {
  if (event.source !== parent || !event.data || !event.data.washi) return
  const message = event.data
  if (message.type === 'answer') {
    pending.get(message.id)?.(message.value)
    pending.delete(message.id)
  }
  if (message.type === 'tokens') document.documentElement.setAttribute('style', message.css)
  if (message.type === 'state') update({ state: message.values })
  if (message.type === 'props') update({ props: message.props })
  if (message.type === 'page') update({ page: message.page })
  if (message.type === 'changed') update({ data: live.data + 1 })
  if (message.type === 'moved') update({ pages: live.pages + 1 })
})

const write = (what, message) => {
  if (!navigator.userActivation?.isActive) {
    throw new Error(what + ' runs from a press inside the widget, never as it draws')
  }
  send(message)
}

const answers = new Map()
const useAnswer = (type, body, fallback, moves) => {
  const key = type + ':' + JSON.stringify(body)
  const moved = useLive()
  const tick = moves ? moved[moves] : 0
  const [, rerender] = useReducer((n) => n + 1, 0)
  useEffect(() => {
    let alive = true
    ask(type, body).then((value) => {
      answers.set(key, value)
      if (alive) rerender()
    })
    return () => {
      alive = false
    }
  }, [key, tick])
  const value = answers.get(key)
  return value === undefined ? fallback : value
}

export const useRows = (query) => useAnswer('rows', { query }, [], 'data')
export const useRow = (table, id) =>
  useRows({ table, where: [{ column: 'id', op: 'eq', value: id }], limit: 1 })[0] ?? null
export const useTable = (name) => useAnswer('table', { name: String(name) }, null, 'data')
export const act = (action) => write('act', { type: 'act', action })
export const useInsert = (table) => (data) => act({ verb: 'table.insert', table, data })
export const useUpdate = (table) => (row, set) => act({ verb: 'table.update', table, row, set })
export const useDelete = (table) => (row) => act({ verb: 'table.delete', table, row })
export const usePageState = (key, initial) => {
  const name = String(key)
  const { state } = useLive()
  const value = name in state ? state[name] : initial
  useEffect(() => {
    if (initial !== undefined) send({ type: 'seed', key: name, value: initial })
  }, [name])
  const set = (next) =>
    write('a page state change', {
      type: 'set',
      key: name,
      value: typeof next === 'function' ? next(value) : next,
    })
  return [value, set]
}
export const useStored = (key, initial) => {
  const name = String(key)
  const known = useAnswer('stored', { key: name }, initial, null)
  const [mine, setMine] = useState(null)
  const value = mine ? mine.value : known
  const set = (next) => {
    const stored = typeof next === 'function' ? next(value) : next
    write('a stored change', { type: 'store', key: name, value: stored })
    setMine({ value: stored })
  }
  return [value, set]
}
export const useInterval = (ms) => {
  const [, tick] = useReducer((n) => n + 1, 0)
  useEffect(() => {
    const timer = setInterval(tick, Math.max(MIN_INTERVAL_MS, Number(ms) || 0))
    return () => clearInterval(timer)
  }, [ms])
}
export const useNow = (ms = 1000) => {
  useInterval(ms)
  return Date.now()
}
export const usePage = () => useLive().page
export const usePages = (of) => useAnswer('pages', { of: of == null ? '' : String(of) }, [], 'pages')
export const useMembers = () => useAnswer('members', {}, [], null)
export const useMe = () => useAnswer('me', {}, null, null)
export const useNavigate = () => (id) => write('navigate', { type: 'navigate', id: String(id) })
export { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState }

class Boundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return createElement('p', { className: 'washi-stopped' }, 'This widget stopped: ' + (error.message || error))
  }
}

const Drawn = ({ component }) => createElement(component, useLive().props)

export function mount(component) {
  createRoot(document.getElementById('root')).render(
    createElement(Boundary, null, createElement(Drawn, { component })),
  )
  const measure = () => send({ type: 'height', value: Math.ceil(document.body.getBoundingClientRect().height) })
  new ResizeObserver(measure).observe(document.body)
}
`
