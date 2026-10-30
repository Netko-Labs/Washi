/**
 * What `require` answers inside a Terminal (D119): Node's modules the frame lends, a `.json` file
 * the Terminal holds, and words for the rest — never a socket, a process or the real disk.
 */
export const TERMINAL_MODULES = `
const same = (a, b) => {
  if (Object.is(a, b)) return true
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length && keys.every((key) => same(a[key], b[key]))
}

const util = {
  format,
  inspect,
  isDeepStrictEqual: same,
  promisify: (run) => (...args) =>
    new Promise((resolve, reject) => run(...args, (error, value) => (error ? reject(error) : resolve(value)))),
  inherits(made, base) {
    made.super_ = base
    Object.setPrototypeOf(made.prototype, base.prototype)
  },
  deprecate: (run) => run,
  TextEncoder,
  TextDecoder,
  types: { isDate: (value) => value instanceof Date, isRegExp: (value) => value instanceof RegExp, isPromise: (value) => value instanceof Promise },
}

class AssertionError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AssertionError'
    this.code = 'ERR_ASSERTION'
  }
}
const check = (condition, message, said) => {
  if (!condition) throw message instanceof Error ? message : new AssertionError(message ?? said)
}
const assert = (value, message) => check(value, message, 'The expression evaluated to a falsy value')
Object.assign(assert, {
  ok: assert,
  equal: (a, b, message) => check(a == b, message, inspect(a) + ' == ' + inspect(b)),
  notEqual: (a, b, message) => check(a != b, message, inspect(a) + ' != ' + inspect(b)),
  strictEqual: (a, b, message) => check(Object.is(a, b), message, 'Expected values to be strictly equal: ' + inspect(a) + ' !== ' + inspect(b)),
  notStrictEqual: (a, b, message) => check(!Object.is(a, b), message, 'Expected values to differ: ' + inspect(a)),
  deepEqual: (a, b, message) => check(same(a, b), message, 'Expected values to be deeply equal'),
  deepStrictEqual: (a, b, message) => check(same(a, b), message, 'Expected values to be strictly deep-equal'),
  notDeepStrictEqual: (a, b, message) => check(!same(a, b), message, 'Expected values not to be deep-equal'),
  throws(run, _expected, message) {
    try {
      run()
    } catch {
      return
    }
    throw new AssertionError(message ?? 'Missing expected exception.')
  },
  fail: (message) => {
    throw new AssertionError(message ?? 'Failed')
  },
  AssertionError,
})
assert.strict = assert

const os = {
  EOL: '\\n',
  platform: () => proc.platform,
  type: () => 'Linux',
  arch: () => proc.arch,
  release: () => '',
  homedir: () => CWD,
  tmpdir: () => '/tmp',
  hostname: () => 'washi',
  cpus: () => [],
  totalmem: () => 0,
  freemem: () => 0,
  uptime: () => proc.uptime(),
  endianness: () => 'LE',
  userInfo: () => ({ username: 'washi', homedir: CWD, shell: null, uid: 1000, gid: 1000 }),
  constants: {},
}

class StringDecoder {
  constructor(encoding = 'utf8') {
    this.decoder = new TextDecoder(String(encoding).replace(/^ucs-?2$/i, 'utf-16le'))
  }
  write(bytes) {
    return this.decoder.decode(bytes, { stream: true })
  }
  end(bytes) {
    return (bytes ? this.write(bytes) : '') + this.decoder.decode()
  }
}

const BUILTINS = {
  fs,
  'fs/promises': fs.promises,
  path,
  'path/posix': path,
  events: EventEmitter,
  util,
  os,
  assert,
  'assert/strict': assert,
  buffer: { Buffer },
  timers,
  'timers/promises': {
    setTimeout: (ms, value) => new Promise((resolve) => timers.setTimeout(() => resolve(value), ms)),
    setImmediate: (value) => new Promise((resolve) => timers.setImmediate(() => resolve(value))),
  },
  process: proc,
  url: {
    URL,
    URLSearchParams,
    fileURLToPath: (address) => decodeURIComponent(new URL(String(address)).pathname),
    pathToFileURL: (where) => new URL('file://' + path.resolve(where)),
  },
  string_decoder: { StringDecoder },
}

const missing = (words) => Object.assign(new Error(words), { code: 'MODULE_NOT_FOUND' })

function builtin(name) {
  const bare = String(name).replace(/^node:/, '')
  if (Object.hasOwn(BUILTINS, bare)) return BUILTINS[bare]
  throw missing(bare + ' is not available in a Washi terminal — it has its files, the screen and timers')
}

function local(spec) {
  const at = path.resolve(spec)
  for (const each of [at, at + '.json']) {
    if (each.endsWith('.json') && sync.existsSync(each)) return JSON.parse(sync.readFileSync(each, 'utf8'))
  }
  throw missing("Cannot find module '" + spec + "' — a terminal runs one program, and may require a .json file it holds")
}

function globalRequire(spec) {
  const name = String(spec)
  if (/^\\.{0,2}\\//.test(name)) return local(name)
  const bare = name.replace(/^node:/, '')
  if (Object.hasOwn(BUILTINS, bare)) return BUILTINS[bare]
  throw missing("Cannot find module '" + name + "' — require a package by its name in quotes, so the server bundles it")
}

globalRequire.resolve = (spec) => (/^\\.{0,2}\\//.test(String(spec)) ? path.resolve(String(spec)) : String(spec))
globalThis.__terminal = { builtin, local }

function install() {
  Object.assign(globalThis, {
    process: proc,
    Buffer,
    global: globalThis,
    require: globalRequire,
    // What Bun's bundle calls for a require it could not read ahead: require(someName).
    __require: globalRequire,
    __dirname: CWD,
    __filename: CWD + 'index.js',
    console: terminalConsole,
    ...timers,
  })
}
`
