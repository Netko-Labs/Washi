/**
 * Node's own modules as a Terminal lends them (D119): `Buffer`, posix `path`, and `fs`
 * over the Terminal's files — preloaded before the program starts, so a sync read just works.
 * What the program writes stays in memory for that run.
 */
export const TERMINAL_NODE = `
const CWD = '/'
const encoder = new TextEncoder()

const latin1 = (bytes) => {
  let out = ''
  for (let at = 0; at < bytes.length; at += 8192) out += String.fromCharCode(...bytes.subarray(at, at + 8192))
  return out
}

class Buffer extends Uint8Array {
  static from(value, encoding) {
    if (typeof value === 'string') return Buffer.fromText(value, encoding)
    if (value instanceof ArrayBuffer) return new Buffer(value.slice(0))
    if (ArrayBuffer.isView(value)) return new Buffer(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength))
    if (Array.isArray(value)) return new Buffer(value)
    if (value && value.type === 'Buffer' && Array.isArray(value.data)) return new Buffer(value.data)
    throw new TypeError('Buffer.from takes a string, an array or bytes')
  }
  static fromText(text, encoding = 'utf8') {
    const kind = String(encoding).toLowerCase()
    if (kind === 'hex') return new Buffer((text.match(/../g) ?? []).map((pair) => Number.parseInt(pair, 16)))
    if (kind === 'base64' || kind === 'base64url') {
      const plain = atob(text.replace(/-/g, '+').replace(/_/g, '/'))
      return new Buffer(Array.from(plain, (char) => char.charCodeAt(0)))
    }
    if (kind === 'latin1' || kind === 'binary' || kind === 'ascii') {
      return new Buffer(Array.from(text, (char) => char.charCodeAt(0) & 0xff))
    }
    return Buffer.from(encoder.encode(text))
  }
  static alloc(size, fill = 0) {
    return new Buffer(size).fill(typeof fill === 'number' ? fill : 0)
  }
  static allocUnsafe(size) {
    return new Buffer(size)
  }
  static isBuffer(value) {
    return value instanceof Buffer
  }
  static byteLength(value, encoding) {
    return typeof value === 'string' ? Buffer.fromText(value, encoding).length : value.byteLength
  }
  static concat(list, total) {
    const size = total ?? list.reduce((sum, part) => sum + part.length, 0)
    const out = Buffer.alloc(size)
    let at = 0
    for (const part of list) {
      out.set(part.subarray(0, Math.max(0, size - at)), at)
      at += part.length
    }
    return out
  }
  toString(encoding = 'utf8', start = 0, end = this.length) {
    const bytes = this.subarray(start, end)
    const kind = String(encoding).toLowerCase()
    if (kind === 'hex') return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
    if (kind === 'base64') return btoa(latin1(bytes))
    if (kind === 'latin1' || kind === 'binary') return latin1(bytes)
    if (kind === 'ascii') return latin1(bytes.map((byte) => byte & 0x7f))
    if (kind === 'utf16le' || kind === 'ucs2') return new TextDecoder('utf-16le').decode(bytes)
    return new TextDecoder().decode(bytes)
  }
  toJSON() {
    return { type: 'Buffer', data: Array.from(this) }
  }
  equals(other) {
    return this.length === other.length && this.every((byte, at) => byte === other[at])
  }
  slice(start, end) {
    return this.subarray(start, end)
  }
}

const parts = (text, isAbsolute) => {
  const out = []
  for (const part of text.split('/')) {
    if (!part || part === '.') continue
    if (part !== '..') out.push(part)
    else if (out.length > 0 && out[out.length - 1] !== '..') out.pop()
    else if (!isAbsolute) out.push('..')
  }
  return out
}

const path = {
  sep: '/',
  delimiter: ':',
  normalize(text) {
    const isAbsolute = text.startsWith('/')
    let out = parts(text, isAbsolute).join('/')
    if (!out && !isAbsolute) out = '.'
    if (out && text.endsWith('/')) out += '/'
    return (isAbsolute ? '/' : '') + out
  },
  join: (...pieces) => path.normalize(pieces.filter((piece) => piece !== '').join('/') || '.'),
  resolve(...pieces) {
    let at = ''
    for (let step = pieces.length - 1; step >= -1 && !at.startsWith('/'); step -= 1) {
      const piece = step >= 0 ? String(pieces[step]) : CWD
      if (piece) at = at ? piece + '/' + at : piece
    }
    return '/' + parts(at, true).join('/')
  },
  isAbsolute: (text) => text.startsWith('/'),
  dirname(text) {
    const trimmed = text.length > 1 ? text.replace(/\\/+$/, '') : text
    const at = trimmed.lastIndexOf('/')
    return at < 0 ? '.' : at === 0 ? '/' : trimmed.slice(0, at)
  },
  basename(text, ext) {
    const base = text.replace(/\\/+$/, '').split('/').pop() ?? ''
    return ext && base.endsWith(ext) && base !== ext ? base.slice(0, -ext.length) : base
  },
  extname(text) {
    const base = path.basename(text)
    const at = base.lastIndexOf('.')
    return at <= 0 ? '' : base.slice(at)
  },
  relative(from, to) {
    const a = parts(path.resolve(from), true)
    const b = parts(path.resolve(to), true)
    let same = 0
    while (same < a.length && same < b.length && a[same] === b[same]) same += 1
    return [...a.slice(same).map(() => '..'), ...b.slice(same)].join('/')
  },
  parse(text) {
    const base = path.basename(text)
    const ext = path.extname(text)
    const dir = text.includes('/') ? path.dirname(text) : ''
    return { root: text.startsWith('/') ? '/' : '', dir, base, ext, name: ext ? base.slice(0, -ext.length) : base }
  },
  format: ({ dir, root = '', base, name = '', ext = '' }) => (dir ? dir + '/' : root) + (base ?? name + ext),
}
path.posix = path

const disk = new Map()
const folders = new Set(['/'])
const started = new Date()

const failure = (code, words, syscall, where) =>
  Object.assign(new Error(code + ': ' + words + ', ' + syscall + " '" + where + "'"), { code, syscall, path: String(where) })
const located = (where) => path.resolve(String(where))
const encodingOf = (options) => (typeof options === 'string' ? options : (options?.encoding ?? null))

const holdFolders = (at) => {
  for (let dir = path.dirname(at); !folders.has(dir); dir = path.dirname(dir)) folders.add(dir)
}

function keepFile(where, bytes) {
  const at = located(where)
  holdFolders(at)
  disk.set(at, Buffer.from(bytes))
}

const stats = (at) => {
  const isFile = disk.has(at)
  const when = { mtime: started, ctime: started, atime: started, birthtime: started }
  return { size: isFile ? disk.get(at).length : 0, mode: isFile ? 0o100644 : 0o40755, mtimeMs: started.getTime(), ...when, isFile: () => isFile, isDirectory: () => !isFile, isSymbolicLink: () => false }
}

const sync = {
  readFileSync(where, options) {
    const at = located(where)
    const bytes = disk.get(at)
    if (!bytes) throw folders.has(at) ? failure('EISDIR', 'illegal operation on a directory', 'read', where) : failure('ENOENT', 'no such file or directory', 'open', where)
    const encoding = encodingOf(options)
    return encoding ? bytes.toString(encoding) : Buffer.from(bytes)
  },
  writeFileSync(where, data, options) {
    const at = located(where)
    if (!folders.has(path.dirname(at))) throw failure('ENOENT', 'no such file or directory', 'open', where)
    disk.set(at, typeof data === 'string' ? Buffer.fromText(data, encodingOf(options) ?? 'utf8') : Buffer.from(data))
  },
  appendFileSync(where, data, options) {
    const at = located(where)
    const added = typeof data === 'string' ? Buffer.fromText(data, encodingOf(options) ?? 'utf8') : Buffer.from(data)
    sync.writeFileSync(where, disk.has(at) ? Buffer.concat([disk.get(at), added]) : added)
  },
  existsSync: (where) => disk.has(located(where)) || folders.has(located(where)),
  accessSync(where) {
    if (!sync.existsSync(where)) throw failure('ENOENT', 'no such file or directory', 'access', where)
  },
  statSync(where, options) {
    const at = located(where)
    if (disk.has(at) || folders.has(at)) return stats(at)
    if (options?.throwIfNoEntry === false) return undefined
    throw failure('ENOENT', 'no such file or directory', 'stat', where)
  },
  readdirSync(where, options) {
    const at = located(where)
    if (!folders.has(at)) throw failure('ENOENT', 'no such file or directory', 'scandir', where)
    const names = [...new Set([...disk.keys(), ...folders].filter((each) => each !== at && path.dirname(each) === at).map((each) => path.basename(each)))].sort()
    if (!options?.withFileTypes) return names
    return names.map((name) => ({ name, ...stats(path.join(at, name)) }))
  },
  mkdirSync(where, options) {
    const at = located(where)
    if (sync.existsSync(at) && !options?.recursive) throw failure('EEXIST', 'file already exists', 'mkdir', where)
    if (!options?.recursive && !folders.has(path.dirname(at))) throw failure('ENOENT', 'no such file or directory', 'mkdir', where)
    holdFolders(at + '/x')
  },
  unlinkSync(where) {
    if (!disk.delete(located(where))) throw failure('ENOENT', 'no such file or directory', 'unlink', where)
  },
  rmSync(where, options) {
    const at = located(where)
    const found = disk.delete(at) || folders.delete(at)
    for (const each of [...disk.keys()]) if (options?.recursive && each.startsWith(at + '/')) disk.delete(each)
    if (!found && !options?.force) throw failure('ENOENT', 'no such file or directory', 'rm', where)
  },
  renameSync(from, to) {
    sync.writeFileSync(to, sync.readFileSync(from))
    disk.delete(located(from))
  },
  copyFileSync: (from, to) => sync.writeFileSync(to, sync.readFileSync(from)),
}
sync.lstatSync = sync.statSync

const fs = { ...sync, constants: { F_OK: 0, R_OK: 4, W_OK: 2, X_OK: 1 }, promises: {} }
for (const name of Object.keys(sync).filter((key) => key !== 'existsSync')) {
  const run = sync[name]
  const plain = name.slice(0, -4)
  fs[plain] = (...args) => {
    const done = typeof args[args.length - 1] === 'function' ? args.pop() : null
    let result
    let error = null
    try {
      result = run(...args)
    } catch (thrown) {
      error = thrown
    }
    if (done) later(() => done(error, result))
  }
  fs.promises[plain] = async (...args) => run(...args)
}
fs.exists = (where, done) => later(() => done(sync.existsSync(where)))
`
