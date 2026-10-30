/** How a Terminal prints values (D119): `util.format` and `util.inspect` as Node reads, in short. */
export const TERMINAL_FORMAT = `
const IDENTIFIER = /^[A-Za-z_$][\\w$]*$/
const BREAK_AT = 72
const MAX_ITEMS = 100

const quoted = (text) =>
  "'" + text.replace(/\\\\/g, '\\\\\\\\').replace(/'/g, "\\\\'").replace(/\\n/g, '\\\\n') + "'"

const nameOf = (value) => {
  const made = Object.getPrototypeOf(value)?.constructor?.name
  return made && made !== 'Object' ? made + ' ' : ''
}

const wrap = (open, items, close, level) => {
  if (items.length === 0) return open.trimEnd() + close.trimStart()
  const flat = open + items.join(', ') + close
  if (flat.length <= BREAK_AT && !flat.includes('\\n')) return flat
  const pad = '  '.repeat(level + 1)
  return open.trimEnd() + '\\n' + pad + items.join(',\\n' + pad) + '\\n' + '  '.repeat(level) + close.trimStart()
}

function inspect(value, options, level = 0, seen = new Set()) {
  const depth = typeof options === 'object' && options && 'depth' in options ? options.depth : 2
  if (value === null) return 'null'
  if (typeof value === 'string') return quoted(value)
  if (typeof value === 'number') return Object.is(value, -0) ? '-0' : String(value)
  if (typeof value === 'bigint') return value + 'n'
  if (typeof value !== 'object' && typeof value !== 'function') return String(value)
  if (typeof value === 'function') {
    const isClass = /^class[\\s{]/.test(Function.prototype.toString.call(value))
    return isClass ? '[class ' + (value.name || '(anonymous)') + ']' : '[Function: ' + (value.name || '(anonymous)') + ']'
  }
  if (value instanceof Error) return (value.name || 'Error') + ': ' + value.message
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString()
  if (value instanceof RegExp) return String(value)
  if (value instanceof Promise) return 'Promise { <pending> }'
  if (seen.has(value)) return '[Circular]'
  const inner = (item) => inspect(item, { depth: depth === null ? null : depth - 1 }, level + 1, seen)
  if (depth !== null && depth < 0) return Array.isArray(value) ? '[Array]' : '[' + (nameOf(value).trim() || 'Object') + ']'
  seen.add(value)
  try {
    if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
      const items = Array.from(value.slice(0, MAX_ITEMS), (item) => String(item))
      if (value.length > MAX_ITEMS) items.push('... ' + (value.length - MAX_ITEMS) + ' more items')
      return wrap(nameOf(value).trim() + '(' + value.length + ') [ ', items, ' ]', level)
    }
    if (Array.isArray(value)) {
      const items = value.slice(0, MAX_ITEMS).map(inner)
      if (value.length > MAX_ITEMS) items.push('... ' + (value.length - MAX_ITEMS) + ' more items')
      return wrap('[ ', items, ' ]', level)
    }
    if (value instanceof Map) {
      const items = [...value].slice(0, MAX_ITEMS).map(([key, item]) => inner(key) + ' => ' + inner(item))
      return wrap('Map(' + value.size + ') { ', items, ' }', level)
    }
    if (value instanceof Set) {
      return wrap('Set(' + value.size + ') { ', [...value].slice(0, MAX_ITEMS).map(inner), ' }', level)
    }
    const items = Object.keys(value).map((key) => (IDENTIFIER.test(key) ? key : quoted(key)) + ': ' + inner(value[key]))
    return wrap(nameOf(value) + '{ ', items, ' }', level)
  } finally {
    seen.delete(value)
  }
}

const shown = (value) => (typeof value === 'string' ? value : inspect(value))

function format(...args) {
  if (typeof args[0] !== 'string') return args.map(shown).join(' ')
  const rest = args.slice(1)
  const head = args[0].replace(/%[sdifjoOc%]/g, (token) => {
    if (token === '%%') return '%'
    if (rest.length === 0) return token
    const value = rest.shift()
    if (token === '%s') return typeof value === 'object' && value ? inspect(value, { depth: 1 }) : typeof value === 'bigint' ? value + 'n' : String(value)
    if (token === '%d') return typeof value === 'bigint' ? value + 'n' : String(Number(value))
    if (token === '%i') return typeof value === 'bigint' ? value + 'n' : String(Number.parseInt(value, 10))
    if (token === '%f') return String(Number.parseFloat(value))
    if (token === '%j') {
      try {
        return JSON.stringify(value)
      } catch {
        return '[Circular]'
      }
    }
    if (token === '%c') return ''
    return inspect(value)
  })
  return [head, ...rest.map(shown)].join(' ')
}

const centred = (text, width) => {
  const left = Math.floor((width - text.length) / 2)
  return ' '.repeat(left) + text + ' '.repeat(width - text.length - left)
}

/** console.table: an index column, then each row's keys, or Values for a list of plain values. */
function table(data, columns) {
  if (!data || typeof data !== 'object') return format(data)
  const rows = data instanceof Map ? [...data] : Object.entries(data)
  const keys = []
  let hasValues = false
  for (const [, row] of rows) {
    if (row && typeof row === 'object') {
      for (const key of Object.keys(row)) if (!keys.includes(key)) keys.push(key)
    } else hasValues = true
  }
  const shownKeys = Array.isArray(columns) ? columns.map(String) : keys
  const head = ['(index)', ...shownKeys, ...(hasValues ? ['Values'] : [])]
  const body = rows.map(([index, row]) => [
    String(index),
    ...shownKeys.map((key) => (row && typeof row === 'object' && key in row ? inspect(row[key], { depth: 0 }, 1) : '')),
    ...(hasValues ? [row && typeof row === 'object' ? '' : inspect(row, { depth: 0 }, 1)] : []),
  ])
  const widths = head.map((title, at) => Math.max(title.length, ...body.map((cells) => cells[at].length)) + 2)
  const rule = (left, middle, right) => left + widths.map((width) => '─'.repeat(width)).join(middle) + right
  const line = (cells) => '│' + cells.map((cell, at) => centred(cell, widths[at])).join('│') + '│'
  return [rule('┌', '┬', '┐'), line(head), rule('├', '┼', '┤'), ...body.map(line), rule('└', '┴', '┘')].join('\\n')
}
`
