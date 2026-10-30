import { describe, expect, test } from 'bun:test'
import { runTerminal } from './terminal-frame'

/** Reyansh-Khobragade/bad-apple-nodejs's index.js, byte for byte. */
const BAD_APPLE = `let t = require("fs").readFileSync("./frames.txt", { encoding: "utf-8" });
let e = t.split(/^\\n$/gm);
let o = Date.now(),
    l = 0;
const c = (t) => {
    let a = t.split(/\\d$/gm),
        p = ++l * (1 / 30) * 1000,
        d = Date.now() - o;
    console.log(a[2]),
        (s = Date.now()),
        setTimeout(() => {
            console.clear();
            e.length > 0 ? c(e.shift()) : console.log("ENDED");
        }, p - d);
};
c(e.shift());
`

const ART = ['⣿⣿⣿⣿', '⠿⠿⠿⠿', '⠛⠛⠛⠛']

/** frames.txt's own shape: SRT-like cues over CRLF lines, a blank line between them. */
const FRAMES = ART.map(
  (art, at) => `${at + 1}\r\n00:00:00,0${at}0 --> 00:00:00,0${at}3\r\n${art}\r\n${art}\r\n`,
).join('\r\n')

describe('a Terminal runs a Node program', () => {
  test('Bad Apple, unchanged, draws each frame alone and in order, then ENDED', async () => {
    const run = await runTerminal(BAD_APPLE, { 'frames.txt': FRAMES }, 2000)
    const frames = run.painted.filter((text) => ART.some((art) => text.includes(art)))
    expect(frames.map((text) => ART.findIndex((art) => text.includes(art)))).toEqual([0, 1, 2])
    for (const text of frames) {
      expect(ART.filter((art) => text.includes(art))).toHaveLength(1)
      expect(text).not.toContain('\r')
    }
    expect(run.screen().trim()).toBe('ENDED')
    expect(run.exit()).toBe(0)
  })

  test('fs reads its files as text with an encoding, as bytes without, and keeps what it writes', async () => {
    const run = await runTerminal(
      `const fs = require('node:fs')
const path = require('path')
console.log(fs.readFileSync('notes/a.txt', 'utf8'))
const bytes = fs.readFileSync(path.join(__dirname, 'notes', 'a.txt'))
console.log(bytes instanceof Uint8Array, bytes.length, bytes.toString('hex'))
fs.writeFileSync('/out.json', JSON.stringify({ ok: true }))
console.log(require('./out.json').ok, fs.readdirSync('/'), fs.existsSync('nope.txt'))
try { fs.readFileSync('nope.txt') } catch (error) { console.log(error.code, error.message) }`,
      { 'notes/a.txt': 'héllo' },
    )
    expect(run.screen().split('\n')).toEqual([
      'héllo',
      'true 6 68c3a96c6c6f',
      "true [ 'notes', 'out.json' ] false",
      "ENOENT ENOENT: no such file or directory, open 'nope.txt'",
      '',
    ])
  })

  test('console.clear empties the screen; what follows starts at the top', async () => {
    const run = await runTerminal(`console.log('one')
console.log('two', { a: 1 }, [1, 'x'])
console.clear()
console.log('%s is %d', 'three', 3)
process.stdout.write('no newline')`)
    expect(run.screen()).toBe('three is 3\nno newline')
    expect(run.painted.join('\n')).not.toContain('one')
  })

  test('timers run in order and the run ends once none is left; process.exit stops at once', async () => {
    const run = await runTerminal(`setTimeout(() => console.log('late'), 30)
const every = setInterval(() => { console.log('tick'); clearInterval(every) }, 5)
setImmediate(() => console.log('soon'))
process.nextTick(() => console.log('next'))
console.log('now')`)
    expect(run.screen()).toBe('now\nnext\nsoon\ntick\nlate\n')
    expect(run.exit()).toBe(0)
    const exited = await runTerminal(`setTimeout(() => console.log('never'), 50)
process.on('exit', (code) => console.log('bye', code))
process.exit(3)
console.log('not this')`)
    expect(exited.screen()).toBe('bye 3\n')
    expect(exited.exit()).toBe(3)
  })

  test('Node modules a terminal cannot lend say so in words; an uncaught error ends the run', async () => {
    const run =
      await runTerminal(`try { require('child_process') } catch (error) { console.log(error.code, error.message) }
const name = ['n', 'e', 't'].join('')
try { require(name) } catch (error) { console.log(error.message) }
throw new TypeError('boom')`)
    expect(run.screen().split('\n')).toEqual([
      'MODULE_NOT_FOUND child_process is not available in a Washi terminal — it has its files, the screen and timers',
      "Cannot find module 'net' — require a package by its name in quotes, so the server bundles it",
      'Uncaught TypeError: boom',
      '',
    ])
    expect(run.exit()).toBe(1)
  })

  test('Buffer, events and util behave as Node’s do, in short', async () => {
    const run = await runTerminal(`const { EventEmitter } = require('events')
const util = require('util')
const bus = new EventEmitter()
bus.once('hi', (who) => console.log('hi', who))
bus.emit('hi', 'there'); bus.emit('hi', 'again')
console.log(Buffer.from('aGk=', 'base64').toString(), util.format('%o', { n: 1n }))
console.table([{ a: 1 }, { a: 2 }])`)
    expect(run.screen()).toContain('hi there\nhi { n: 1n }\n┌')
    expect(run.screen()).not.toContain('again')
  })

  test('the page libraries load through require, and through import', async () => {
    for (const [program, printed] of [
      ["const { z } = require('zod')\nconsole.log(z.string().parse('ok'))", 'ok\n'],
      ["console.log(JSON.stringify(require('lodash-es').chunk([1, 2, 3], 2)))", '[[1,2],[3]]\n'],
      [
        "const { format } = require('date-fns')\nconsole.log(format(new Date(0), 'yyyy'))",
        '1970\n',
      ],
    ] as const) {
      expect((await runTerminal(program)).screen()).toBe(printed)
    }
    const imported = await runTerminal(
      "import _, { chunk } from 'lodash-es'\nconsole.log(_.chunk === chunk)",
    )
    expect(imported.screen()).toBe('true\n')
  })
})
