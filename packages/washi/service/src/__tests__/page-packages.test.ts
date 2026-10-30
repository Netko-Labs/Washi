import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { type PagePackageSet, serverPolicySchema } from '@washi/domain'
import { openWorkspace } from '@washi/repository'
import { instructionsFor } from '../agents/instructions'
import { compilePage, compileWidget } from '../pages'
import { pageCodeDiagnostics } from '../pages/check'
import { loadEngine } from '../scripts/engine'
import { lendServerPolicy, PagePackageError, pagePackageSpec } from '../server'
import { checkSource } from '../sheets/service'

const NOT_LISTED =
  "is not on this server's page packages — an admin can add it in Settings → Server"

let dir: string
let set: PagePackageSet

/** A cache as an install leaves it — written by hand, so no test reaches npm. */
function fakePackage(name: string, files: Record<string, string>, manifest: object = {}) {
  const folder = join(dir, 'node_modules', name)
  mkdirSync(folder, { recursive: true })
  const pkg = {
    name,
    version: '1.2.3',
    type: 'module',
    exports: { '.': './index.js' },
    ...manifest,
  }
  writeFileSync(join(folder, 'package.json'), JSON.stringify(pkg))
  for (const [file, text] of Object.entries(files)) writeFileSync(join(folder, file), text)
}

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'washi-page-packages-'))
  fakePackage('slugger', {
    'index.js': `import { tail } from './tail.js'\nexport const slug = (text) => text.toLowerCase().replace(/ /g, '-') + tail`,
    'tail.js': `export const tail = '!'`,
  })
  fakePackage('@acme/greet', { 'index.js': `export const greet = (name) => 'hi ' + name` })
  fakePackage('heavy', { 'index.js': `export const blob = '${'x'.repeat(800 * 1024)}'` })
  set = {
    dir,
    packages: [
      { name: 'slugger', version: '1.2.3' },
      { name: '@acme/greet', version: '1.2.3' },
      { name: 'heavy', version: '1.2.3' },
    ],
  }
})
afterAll(() => rmSync(dir, { recursive: true, force: true }))

const pages = () => null
const PAGE = `import { slug } from 'slugger'
import { greet } from '@acme/greet'
<Sheet title="t"><Text>{greet(slug('Big Plan'))}</Text></Sheet>`

async function draw(js: string): Promise<unknown> {
  const vm = (await loadEngine()).newContext()
  const prelude = `globalThis.h = (name, props, ...children) => ({ name, children: children.flat() })
globalThis.Sheet = 'Sheet'; globalThis.Text = 'Text'; globalThis.__washi = {}`
  const result = vm.evalCode(`${prelude};\n${js}\nJSON.stringify(globalThis.__page.view())`)
  const value = result.error ? vm.dump(result.error) : JSON.parse(vm.dump(result.value))
  ;(result.error ?? result.value).dispose()
  vm.dispose()
  return value
}

describe('a page package as an admin types it (D116)', () => {
  test('a name, a scope, an exact version, a range or a tag', () => {
    expect(pagePackageSpec('nanoid')).toEqual({ name: 'nanoid', spec: 'latest' })
    expect(pagePackageSpec(' nanoid@5.1.6 ')).toEqual({ name: 'nanoid', spec: '5.1.6' })
    expect(pagePackageSpec('@scope/pkg@^1.2')).toEqual({ name: '@scope/pkg', spec: '^1.2' })
    expect(pagePackageSpec('@scope/pkg')).toEqual({ name: '@scope/pkg', spec: 'latest' })
    expect(pagePackageSpec('ms@>=2 <3')).toEqual({ name: 'ms', spec: '>=2 <3' })
  })

  test('anything that is not an npm name or a version is refused in words', () => {
    for (const raw of ['', '../evil', '.hidden', '_private', 'a b', '@scope/', 'name/sub']) {
      expect(() => pagePackageSpec(raw)).toThrow(PagePackageError)
    }
    for (const raw of ['x@git+https://e.com/x', 'x@file:../x', 'x@github:a/b']) {
      expect(() => pagePackageSpec(raw)).toThrow('is not a version')
    }
    expect(() => pagePackageSpec('x@npm:y@1')).toThrow(PagePackageError)
    expect(() => pagePackageSpec('zod@4')).toThrow("is Washi's own")
    expect(() => pagePackageSpec('react')).toThrow("is Washi's own")
  })
})

describe('a page importing the server’s packages (D116)', () => {
  test('bundles from the cache like a built-in library, and runs', async () => {
    const compiled = await compilePage(PAGE, pages, set)
    if (!compiled.ok) throw new Error(compiled.error)
    expect(await draw(compiled.js)).toEqual({
      name: 'Sheet',
      children: [{ name: 'Text', children: ['hi big-plan!'] }],
    })
    expect(pageCodeDiagnostics(PAGE, set)).toEqual([])
  })

  test('a package off the list says where an admin adds it; without a server, as before', async () => {
    const source = `import { nanoid } from 'nanoid'\n<Sheet title="t" />`
    expect(pageCodeDiagnostics(source, set)[0]?.message).toBe(`"nanoid" ${NOT_LISTED}`)
    expect(await compilePage(source, pages, set)).toEqual({
      ok: false,
      error: `"nanoid" ${NOT_LISTED}`,
    })
    expect(pageCodeDiagnostics(source)[0]?.message).toContain(
      'cannot import "nanoid" — a page imports from washi, washi/ui, date-fns',
    )
  })

  test('removed, a page that imported it stops in words, never a crash', async () => {
    const gone = { dir, packages: set.packages.filter(({ name }) => name !== 'slugger') }
    expect(await compilePage(PAGE, pages, gone)).toEqual({
      ok: false,
      error: `"slugger" ${NOT_LISTED}`,
    })
  })

  test('a path that climbs out of the package, or one that blows the cap, is refused', async () => {
    const climb = `import x from 'slugger/../../package.json'\n<Sheet title="t" />`
    expect(pageCodeDiagnostics(climb, set)[0]?.message).toContain('cannot import')
    expect(await compilePage(climb, pages, set)).toMatchObject({ ok: false })
    const heavy = await compilePage(
      `import { blob } from 'heavy'\n<Sheet title="t"><Text>{blob}</Text></Sheet>`,
      pages,
      set,
    )
    expect(heavy).toMatchObject({ ok: false, error: expect.stringContaining('KB — import less') })
  })

  test('a widget bundles them too', async () => {
    const source = `import { slug } from 'slugger'
function Tag() { return <span>{slug('A B')}</span> }
<Sheet title="t"><Widget title="w"><Tag /></Widget></Sheet>`
    expect((await compileWidget(source, 'Tag', pages, set)).ok).toBe(true)
    expect((await compileWidget(source, 'Tag', pages, null)).ok).toBe(false)
  })
})

describe('the server’s packages, as a workspace is lent them (D116)', () => {
  test('a save checks against them, and Washi is told of them', () => {
    const ws = openWorkspace({ id: 'test', path: ':memory:' })
    expect(checkSource(PAGE, ws).ok).toBe(false)
    expect(instructionsFor(ws)).not.toContain('slugger')

    lendServerPolicy(
      ws,
      () => serverPolicySchema.parse({}),
      () => set,
    )
    expect(checkSource(PAGE, ws).ok).toBe(true)
    expect(checkSource(PAGE).ok).toBe(false)
    expect(instructionsFor(ws)).toContain('slugger@1.2.3, @acme/greet@1.2.3')
    ws.close()
  })
})
