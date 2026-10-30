import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { PagePackageSet } from '@washi/domain'
import { paperRegistry } from '@washi/paper/registry'
import { extractFiles, parse, validate } from '@washi/wsx'
import { compileTerminal } from '../pages'
import { checkSource } from '../sheets/service'
import { runTerminal } from './terminal-frame'

let dir: string
let set: PagePackageSet

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'washi-terminal-'))
  const folder = join(dir, 'node_modules', 'shout')
  mkdirSync(folder, { recursive: true })
  writeFileSync(join(folder, 'package.json'), JSON.stringify({ name: 'shout', main: 'index.js' }))
  writeFileSync(join(folder, 'index.js'), 'module.exports = (text) => text.toUpperCase() + "!"')
  set = { dir, packages: [{ name: 'shout', version: '1.0.0' }] }
})

afterAll(() => rmSync(dir, { recursive: true, force: true }))

const page = (program: string, files = '') =>
  `<Sheet title="Run">\n  <Terminal title="t"${files}>{${JSON.stringify(program)}}</Terminal>\n</Sheet>\n`

const errors = (source: string) =>
  checkSource(source)
    .diagnostics.filter((each) => each.severity === 'error')
    .map((each) => each.message)

describe('a Terminal compiles from the same vetted list as page code', () => {
  test('Node modules, the libraries and a server package bundle; anything else is refused in words', async () => {
    const ok = await compileTerminal(
      "const { chunk } = require('lodash-es')\nconst shout = require('shout')\nconsole.log(chunk([1, 2], 1), shout('hi'))",
      set,
    )
    expect(ok.ok).toBe(true)
    const chalk = await compileTerminal("require('chalk')")
    expect(chalk).toEqual({
      ok: false,
      error:
        'cannot require "chalk" — a terminal requires Node\'s own fs, path, events, util and the like, date-fns, lodash-es, zod, or a .json file it holds',
    })
    const unlisted = await compileTerminal("import left from 'left-pad'", set)
    expect(unlisted.ok ? '' : unlisted.error).toContain(
      '"left-pad" is not on this server\'s page packages',
    )
    const washi = await compileTerminal("require('washi')")
    expect(washi.ok).toBe(false)
  })

  test('a server package runs inside the frame, and the program is its own main module', async () => {
    const run = await runTerminal(
      "if (require.main === module) console.log(require('shout')('ready'))",
      {},
      1000,
      set,
    )
    expect(run.screen()).toBe('READY!\n')
  })

  test('a page holding a Terminal is checked at save: syntax and what it requires', () => {
    expect(errors(page("const fs = require('fs')\nconsole.log(fs.readdirSync('/'))"))).toEqual([])
    expect(errors(page("require('chalk')"))[0]).toStartWith('terminal: cannot require "chalk"')
    expect(errors(page('console.log(('))[0]).toStartWith('terminal: code:')
  })
})

describe('a Terminal’s files', () => {
  const check = (files: string) =>
    validate(parse(page('1', ` files={${files}}`)), paperRegistry)
      .filter((each) => each.severity === 'error')
      .map((each) => each.message)

  test('map plain paths to uploads, and nothing else', () => {
    expect(check('{ "frames.txt": "file:0199-a", "data/a.csv": "file:0199-b" }')).toEqual([])
    expect(check('{ "../etc/passwd": "file:0199-a" }').join()).toContain(
      'never .. or a leading dot',
    )
    expect(check('{ ".env": "file:0199-a" }').join()).toContain('never .. or a leading dot')
    expect(check('{ "frames.txt": "https://example.com/frames.txt" }').join()).toContain(
      'file:<id>',
    )
  })

  test('are uploads the page wears, so a purge keeps them and a link may serve them', () => {
    const root = parse(page('1', ' files={{ "frames.txt": "file:0199-a" }}'))
    expect(extractFiles(root)).toEqual(['file:0199-a'])
  })
})
