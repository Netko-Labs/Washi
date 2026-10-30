/** Node's `EventEmitter` in a Terminal (D119); `process` and its streams are emitters too. */
export const TERMINAL_EVENTS = `
function EventEmitter() {}
const listenersOf = (emitter, name) => {
  emitter._events ??= new Map()
  if (!emitter._events.has(name)) emitter._events.set(name, [])
  return emitter._events.get(name)
}
Object.assign(EventEmitter.prototype, {
  on(name, listener) {
    listenersOf(this, name).push(listener)
    return this
  },
  prependListener(name, listener) {
    listenersOf(this, name).unshift(listener)
    return this
  },
  once(name, listener) {
    const once = (...args) => {
      this.off(name, once)
      listener.apply(this, args)
    }
    once.listener = listener
    return this.on(name, once)
  },
  off(name, listener) {
    const list = listenersOf(this, name)
    const at = list.findIndex((each) => each === listener || each.listener === listener)
    if (at >= 0) list.splice(at, 1)
    return this
  },
  removeAllListeners(name) {
    if (name === undefined) this._events = new Map()
    else listenersOf(this, name).length = 0
    return this
  },
  emit(name, ...args) {
    const list = [...listenersOf(this, name)]
    if (list.length === 0 && name === 'error') throw args[0] instanceof Error ? args[0] : new Error('Unhandled error: ' + args[0])
    for (const listener of list) listener.apply(this, args)
    return list.length > 0
  },
  listeners(name) {
    return listenersOf(this, name).map((each) => each.listener ?? each)
  },
  listenerCount(name) {
    return listenersOf(this, name).length
  },
  eventNames() {
    return [...(this._events?.keys() ?? [])].filter((name) => this._events.get(name).length > 0)
  },
  setMaxListeners() {
    return this
  },
  getMaxListeners: () => 10,
})
EventEmitter.prototype.addListener = EventEmitter.prototype.on
EventEmitter.prototype.removeListener = EventEmitter.prototype.off
EventEmitter.EventEmitter = EventEmitter
EventEmitter.once = (emitter, name) => new Promise((resolve) => emitter.once(name, (...args) => resolve(args)))
`
