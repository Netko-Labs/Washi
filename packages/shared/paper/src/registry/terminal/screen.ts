/**
 * A Terminal's screen (D119): lines of styled runs, ANSI colours read off what is written, painted
 * once per animation frame however often a program writes — a 30 fps clear-and-print stays smooth.
 * The font shrinks until the widest line fits; a program that clears draws frames, so it may grow.
 */
export const TERMINAL_SCREEN = `
const FONT = 'ui-monospace, "SF Mono", Menlo, Monaco, "DejaVu Sans Mono", "Cascadia Mono", Consolas, "Liberation Mono", "Apple Braille", "Segoe UI Symbol", "Noto Sans Symbols 2", monospace'
const SCROLLBACK = 2000
const LINE_HEIGHT = 1.2
const PAD = 10
const PALETTE = ['#1d1f21', '#e06c75', '#98c379', '#e5c07b', '#61afef', '#c678dd', '#56b6c2', '#dcdfe4', '#5c6370', '#ff7b86', '#b5e890', '#ffd68a', '#82c4ff', '#e19ef5', '#7fd8e3', '#ffffff']
const ESCAPE = /\\x1b\\[([0-9;?]*)([A-Za-z])|\\x1bc/g

const screen = { lines: [[]], sgr: {}, css: '', returned: false, cleared: false, dirty: false, size: 0 }
let pre = null
let measuring = null

const color = (codes, at) => {
  if (codes[at + 1] === 5) {
    const n = codes[at + 2] ?? 0
    if (n < 16) return [PALETTE[n], at + 2]
    if (n >= 232) {
      const gray = 8 + (n - 232) * 10
      return ['rgb(' + gray + ',' + gray + ',' + gray + ')', at + 2]
    }
    const cube = n - 16
    const level = (v) => (v === 0 ? 0 : 55 + v * 40)
    return ['rgb(' + level(Math.floor(cube / 36)) + ',' + level(Math.floor(cube / 6) % 6) + ',' + level(cube % 6) + ')', at + 2]
  }
  if (codes[at + 1] === 2) {
    return ['rgb(' + (codes[at + 2] ?? 0) + ',' + (codes[at + 3] ?? 0) + ',' + (codes[at + 4] ?? 0) + ')', at + 4]
  }
  return [null, at]
}

const styleOf = (sgr) => {
  let fg = sgr.fg
  let bg = sgr.bg
  if (sgr.inverse) [fg, bg] = [bg ?? '#0d0f12', fg ?? '#dcdfe4']
  return [
    fg ? 'color:' + fg : '',
    bg ? 'background:' + bg : '',
    sgr.bold ? 'font-weight:700' : '',
    sgr.dim ? 'opacity:.6' : '',
    sgr.italic ? 'font-style:italic' : '',
    sgr.underline ? 'text-decoration:underline' : '',
  ].filter(Boolean).join(';')
}

const select = (params) => {
  const codes = params === '' ? [0] : params.split(';').map((code) => Number(code) || 0)
  const sgr = { ...screen.sgr }
  for (let at = 0; at < codes.length; at += 1) {
    const code = codes[at]
    if (code === 0) for (const key of Object.keys(sgr)) delete sgr[key]
    else if (code === 1) sgr.bold = true
    else if (code === 2) sgr.dim = true
    else if (code === 3) sgr.italic = true
    else if (code === 4) sgr.underline = true
    else if (code === 7) sgr.inverse = true
    else if (code === 22) sgr.bold = sgr.dim = false
    else if (code === 23) sgr.italic = false
    else if (code === 24) sgr.underline = false
    else if (code === 27) sgr.inverse = false
    else if (code >= 30 && code <= 37) sgr.fg = PALETTE[code - 30]
    else if (code >= 90 && code <= 97) sgr.fg = PALETTE[code - 82]
    else if (code === 39) delete sgr.fg
    else if (code >= 40 && code <= 47) sgr.bg = PALETTE[code - 40]
    else if (code >= 100 && code <= 107) sgr.bg = PALETTE[code - 92]
    else if (code === 49) delete sgr.bg
    else if (code === 38 || code === 48) {
      const [picked, next] = color(codes, at)
      if (picked) sgr[code === 38 ? 'fg' : 'bg'] = picked
      at = next
    }
  }
  screen.sgr = sgr
  screen.css = styleOf(sgr)
}

const current = () => screen.lines[screen.lines.length - 1]

const append = (text, tint) => {
  const line = current()
  if (screen.returned) {
    line.length = 0
    screen.returned = false
  }
  const css = [screen.css, tint].filter(Boolean).join(';')
  const last = line[line.length - 1]
  if (last && last[1] === css) last[0] += text
  else line.push([text, css])
}

const newline = () => {
  screen.returned = false
  screen.lines.push([])
  if (screen.lines.length > SCROLLBACK) screen.lines.splice(0, screen.lines.length - SCROLLBACK)
}

const put = (text, tint) => {
  text.split(/\\r\\n|\\n/).forEach((part, at) => {
    if (at > 0) newline()
    part.split('\\r').forEach((piece, step) => {
      if (step > 0) screen.returned = true
      if (piece) append(piece, tint)
    })
  })
}

const control = (params, final) => {
  if (final === 'm') select(params)
  else if (final === 'c' || (final === 'J' && /[23]/.test(params))) clearScreen()
  else if ((final === 'H' || final === 'f') && (params === '' || params === '1;1')) clearScreen()
  else if (final === 'K') current().length = 0
}

const mark = () => {
  if (screen.dirty) return
  screen.dirty = true
  requestAnimationFrame(paint)
}

function writeScreen(text, tint) {
  let at = 0
  for (const found of text.matchAll(ESCAPE)) {
    put(text.slice(at, found.index), tint)
    control(found[1] ?? '', found[2] ?? 'c')
    at = found.index + found[0].length
  }
  put(text.slice(at), tint)
  mark()
}

function clearScreen() {
  screen.lines = [[]]
  screen.returned = false
  screen.cleared = true
  mark()
}

function resetScreen(hint) {
  screen.lines = hint ? [[[hint, 'color:#5c6370']]] : [[]]
  screen.sgr = {}
  screen.css = ''
  screen.returned = false
  screen.cleared = false
  mark()
}

const textOf = (line) => line.map((run) => run[0]).join('')

const widthOf = (text) => {
  if (!text) return 0
  measuring ??= document.createElement('canvas').getContext('2d')
  if (!measuring) return text.length * 0.6
  measuring.font = '100px ' + FONT
  return measuring.measureText(text).width / 100
}

const fit = () => {
  const { lines } = screen
  const rows = lines.length - (current().length === 0 ? 1 : 0)
  let widest = ''
  for (const line of lines.slice(-200)) {
    const text = textOf(line)
    if (text.length > widest.length) widest = text
  }
  const em = widthOf(widest)
  const isFrames = screen.cleared && rows > 0 && rows <= 200
  let size = em > 0 ? (pre.clientWidth - PAD * 2) / em : 14
  if (isFrames) size = Math.min(size, (pre.clientHeight - PAD * 2) / (rows * LINE_HEIGHT))
  size = Math.max(6, Math.min(isFrames ? 64 : 14, Math.floor(size * 10) / 10))
  if (size !== screen.size) {
    screen.size = size
    pre.style.fontSize = size + 'px'
  }
}

const span = (text, css) => {
  const run = document.createElement('span')
  run.setAttribute('style', css)
  run.textContent = text
  return run
}

function paint() {
  screen.dirty = false
  if (!pre) return
  const { lines } = screen
  const isAtEnd = pre.scrollTop + pre.clientHeight >= pre.scrollHeight - 4
  if (lines.every((line) => line.every((run) => !run[1]))) {
    pre.textContent = lines.map(textOf).join('\\n')
  } else {
    pre.replaceChildren(
      ...lines.flatMap((line, at) => [
        ...(at > 0 ? ['\\n'] : []),
        ...line.map(([text, css]) => (css ? span(text, css) : text)),
      ]),
    )
  }
  fit()
  if (isAtEnd) pre.scrollTop = pre.scrollHeight
}

function mountScreen() {
  pre = document.createElement('pre')
  pre.className = 'screen'
  pre.style.fontFamily = FONT
  pre.style.lineHeight = String(LINE_HEIGHT)
  pre.style.padding = PAD + 'px'
  document.getElementById('root').replaceChildren(pre)
  addEventListener('resize', mark)
  mark()
}
`
