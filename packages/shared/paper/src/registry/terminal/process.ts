/**
 * A Terminal's `process`, `console` and timers (D119). Timers are counted, so a run that has
 * nothing left to wait for ends as Node's would; a Stop, an exit or an uncaught error ends it at
 * once and every callback after is dropped.
 */
export const TERMINAL_PROCESS = `
const ERR = 'color:#ff9aa2'
const EXIT = Symbol('exit')
const native = {
  setTimeout: globalThis.setTimeout.bind(globalThis),
  clearTimeout: globalThis.clearTimeout.bind(globalThis),
  setInterval: globalThis.setInterval.bind(globalThis),
  clearInterval: globalThis.clearInterval.bind(globalThis),
}
const handles = new Map()
let nextHandle = 1
let alive = false
let ended = false
let draining = false

const say = (type, body) => parent.postMessage({ washi: true, type, ...body }, '*')

function finish(code) {
  if (ended) return
  ended = true
  say('exit', { code })
}

function halt(code) {
  if (!alive) return
  alive = false
  for (const handle of handles.values()) (handle.repeat ? native.clearInterval : native.clearTimeout)(handle.native)
  handles.clear()
  if (code !== null) finish(code)
}

function crash(error) {
  if (error === EXIT || !alive) return
  const said = error instanceof Error ? (error.name || 'Error') + ': ' + error.message : inspect(error)
  writeScreen('Uncaught ' + said + '\\n', ERR)
  halt(1)
}

function guard(run) {
  try {
    run()
  } catch (error) {
    crash(error)
  }
}

const isHeld = () => [...handles.values()].some((handle) => handle.ref)

function settle() {
  if (!alive || ended || draining || isHeld()) return
  draining = true
  native.setTimeout(() => {
    draining = false
    if (!alive || ended || isHeld()) return
    guard(() => proc.emit('exit', proc.exitCode ?? 0))
    finish(proc.exitCode ?? 0)
  }, 0)
}

class Timeout {
  constructor(id) {
    this.id = id
  }
  ref() {
    const handle = handles.get(this.id)
    if (handle) handle.ref = true
    return this
  }
  unref() {
    const handle = handles.get(this.id)
    if (handle) handle.ref = false
    settle()
    return this
  }
  hasRef() {
    return handles.get(this.id)?.ref ?? false
  }
  refresh() {
    const handle = handles.get(this.id)
    if (handle && !handle.repeat) {
      native.clearTimeout(handle.native)
      handle.native = native.setTimeout(handle.fire, handle.ms)
    }
    return this
  }
  close() {
    clearHandle(this)
    return this
  }
  [Symbol.toPrimitive]() {
    return this.id
  }
}

function schedule(callback, ms, args, repeat) {
  if (typeof callback !== 'function') throw new TypeError('The "callback" argument must be of type function')
  if (!alive) return new Timeout(0)
  const id = nextHandle++
  const delay = Math.max(1, Number(ms) || 0)
  const fire = () => {
    if (!alive) return
    if (!repeat) handles.delete(id)
    guard(() => callback(...args))
    settle()
  }
  const timer = (repeat ? native.setInterval : native.setTimeout)(fire, delay)
  handles.set(id, { native: timer, repeat, ref: true, fire, ms: delay })
  return new Timeout(id)
}

function clearHandle(handle) {
  const id = handle && typeof handle === 'object' ? handle.id : Number(handle)
  const found = handles.get(id)
  if (!found) return
  ;(found.repeat ? native.clearInterval : native.clearTimeout)(found.native)
  handles.delete(id)
  settle()
}

const timers = {
  setTimeout: (callback, ms, ...args) => schedule(callback, ms, args, false),
  setInterval: (callback, ms, ...args) => schedule(callback, ms, args, true),
  setImmediate: (callback, ...args) => schedule(callback, 0, args, false),
  clearTimeout: clearHandle,
  clearInterval: clearHandle,
  clearImmediate: clearHandle,
}
const later = (callback) => timers.setImmediate(callback)

let depth = 0
const counts = new Map()
const clocks = new Map()
const print = (text, tint) => {
  if (!alive) return
  const pad = '  '.repeat(depth)
  writeScreen((pad ? text.split('\\n').map((line) => pad + line).join('\\n') : text) + '\\n', tint)
}
const out = (...args) => print(format(...args))
const err = (...args) => print(format(...args), ERR)
const clock = (isEnd) => (label = 'default') => {
  const at = clocks.get(String(label))
  if (at === undefined) return print("Warning: No such label '" + label + "'", ERR)
  print(label + ': ' + (performance.now() - at).toFixed(3) + 'ms')
  if (isEnd) clocks.delete(String(label))
}
const group = (...args) => {
  if (args.length > 0) out(...args)
  depth += 1
}

const terminalConsole = {
  log: out,
  info: out,
  debug: out,
  warn: err,
  error: err,
  trace: (...args) => print('Trace: ' + format(...args), ERR),
  dir: (value, options) => print(inspect(value, options)),
  table: (data, columns) => print(table(data, columns)),
  clear: () => alive && clearScreen(),
  group,
  groupCollapsed: group,
  groupEnd: () => (depth = Math.max(0, depth - 1)),
  time: (label = 'default') => clocks.set(String(label), performance.now()),
  timeLog: clock(false),
  timeEnd: clock(true),
  count(label = 'default') {
    const seen = (counts.get(label) ?? 0) + 1
    counts.set(label, seen)
    print(label + ': ' + seen)
  },
  countReset: (label = 'default') => counts.delete(label),
  assert: (condition, ...args) => condition || print('Assertion failed' + (args.length ? ': ' + format(...args) : ''), ERR),
}

const emitter = (fields) => Object.assign(Object.create(EventEmitter.prototype), fields)
const stream = (fd, tint) =>
  emitter({
    fd,
    isTTY: true,
    writable: true,
    columns: 80,
    rows: 24,
    write(chunk, encoding, done) {
      const text = typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString(typeof encoding === 'string' ? encoding : 'utf8')
      if (alive) writeScreen(text, tint)
      const callback = typeof encoding === 'function' ? encoding : done
      if (callback) later(callback)
      return true
    },
    end(chunk) {
      if (chunk) this.write(chunk)
    },
    cursorTo(x) {
      if (x === 0 && alive) writeScreen('\\r')
      return true
    },
    clearLine() {
      if (alive) writeScreen('\\x1b[2K')
      return true
    },
    moveCursor: () => true,
    clearScreenDown: () => true,
    getColorDepth: () => 8,
    hasColors: () => true,
    getWindowSize: () => [80, 24],
  })

const hrtime = (previous) => {
  const ms = performance.now()
  let seconds = Math.floor(ms / 1000)
  let nanos = Math.round((ms % 1000) * 1e6)
  if (previous) {
    seconds -= previous[0]
    nanos -= previous[1]
    if (nanos < 0) {
      seconds -= 1
      nanos += 1e9
    }
  }
  return [seconds, nanos]
}
hrtime.bigint = () => BigInt(Math.round(performance.now() * 1e6))

const proc = emitter({
  title: 'node',
  argv: ['node', 'index.js'],
  argv0: 'node',
  execArgv: [],
  execPath: 'node',
  env: {},
  platform: 'linux',
  arch: 'x64',
  version: 'v22.0.0',
  versions: { node: '22.0.0' },
  release: { name: 'node' },
  pid: 1,
  ppid: 0,
  exitCode: undefined,
  cwd: () => CWD,
  chdir() {
    throw new Error('a Washi terminal stays in ' + CWD)
  },
  exit(code) {
    const final = code ?? proc.exitCode ?? 0
    guard(() => proc.emit('exit', final))
    halt(final)
    throw EXIT
  },
  abort: () => proc.exit(134),
  hrtime,
  nextTick: (callback, ...args) => queueMicrotask(() => alive && guard(() => callback(...args))),
  uptime: () => performance.now() / 1000,
  memoryUsage: () => ({ rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 }),
  cpuUsage: () => ({ user: 0, system: 0 }),
  emitWarning: (warning) => print('Warning: ' + (warning?.message ?? warning), ERR),
  stdout: stream(1, ''),
  stderr: stream(2, ERR),
  stdin: emitter({ fd: 0, isTTY: false, resume() { return this }, pause() { return this }, setEncoding() { return this }, setRawMode() { return this } }),
})
`
