import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { PagePackage } from '@washi/domain'
import {
  createPagePackages,
  isEsmManifest,
  type PagePackageDeps,
  pickVersion,
  type ResolvedPackage,
} from '../page-packages'

let dir: string
let listed: PagePackage[]
let installs: string[]
let scripts: Set<string>

/** What `bun add` leaves, written by hand: the installer is tested with no network. */
function lay(name: string, version: string, manifest: object = { type: 'module' }) {
  const folder = join(dir, 'node_modules', name)
  mkdirSync(folder, { recursive: true })
  writeFileSync(join(folder, 'package.json'), JSON.stringify({ name, version, ...manifest }))
  writeFileSync(join(folder, 'index.js'), 'export const x = 1')
}

function installer(overrides: Partial<PagePackageDeps> = {}) {
  return createPagePackages({
    dir,
    listed: () => listed,
    save: async (packages) => {
      listed = packages
    },
    resolve: async (name, spec): Promise<ResolvedPackage> => ({
      version: spec === 'latest' || spec.startsWith('^') ? '2.0.1' : spec,
      hasInstallScript: scripts.has(name),
    }),
    install: async (_dir, name, version) => {
      installs.push(`${name}@${version}`)
      lay(name, version, name === 'cjs-only' ? { main: 'index.js' } : { type: 'module' })
    },
    uninstall: async (_dir, name) => {
      rmSync(join(dir, 'node_modules', name), { recursive: true, force: true })
    },
    ...overrides,
  })
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'washi-installer-'))
  listed = []
  installs = []
  scripts = new Set()
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('the server’s page packages (D116)', () => {
  test('a range resolves once to an exact version; the row goes installing → ready', async () => {
    const packages = installer()
    const row = await packages.add({ name: 'nanoid', spec: '^2' })
    expect(row).toMatchObject({ status: 'installing', version: null })
    expect(packages.ready().packages).toEqual([])

    await packages.idle()
    expect(installs).toEqual(['nanoid@2.0.1'])
    expect(listed).toEqual([{ name: 'nanoid', spec: '^2', version: '2.0.1' }])
    expect(packages.list()[0]).toMatchObject({ status: 'ready', version: '2.0.1', error: null })
    expect(packages.list()[0]?.bytes).toBeGreaterThan(0)
    expect(packages.ready()).toEqual({ dir, packages: [{ name: 'nanoid', version: '2.0.1' }] })
  })

  test('install scripts and a CommonJS-only package fail, in words, and are never ready', async () => {
    scripts.add('esbuild')
    const packages = installer()
    await packages.add({ name: 'esbuild', spec: '0.25.0' })
    await packages.add({ name: 'cjs-only', spec: '1.0.0' })
    await packages.idle()
    expect(installs).toEqual(['cjs-only@1.0.0'])
    expect(packages.list()).toMatchObject([
      {
        name: 'esbuild',
        status: 'failed',
        error: 'esbuild@0.25.0 runs install scripts — page packages never do',
      },
      { name: 'cjs-only', status: 'failed', error: expect.stringContaining('no ES module entry') },
    ])
    expect(packages.ready().packages).toEqual([])
  })

  test('npm saying no is a failed row, not a throw', async () => {
    const packages = installer({
      resolve: async (name) => {
        throw new Error(`${name} is not on npm`)
      },
    })
    await packages.add({ name: 'nope', spec: 'latest' })
    await packages.idle()
    expect(packages.list()[0]).toMatchObject({ status: 'failed', error: 'nope is not on npm' })
  })

  test('remove drops it from the list at once, then from disk', async () => {
    const packages = installer()
    await packages.add({ name: 'nanoid', spec: 'latest' })
    await packages.idle()
    await packages.remove('nanoid')
    expect(listed).toEqual([])
    expect(packages.ready().packages).toEqual([])
    await packages.idle()
    expect(packages.list()).toEqual([])
  })

  test('at boot what is on disk is ready at once; what is missing installs again', async () => {
    lay('kept', '1.0.0')
    listed = [
      { name: 'kept', spec: '1.0.0', version: '1.0.0' },
      { name: 'lost', spec: '^2', version: '2.0.1' },
      { name: 'unfinished', spec: 'latest', version: null },
    ]
    const packages = installer()
    const restoring = packages.restore()
    expect(packages.ready().packages).toEqual([{ name: 'kept', version: '1.0.0' }])
    await restoring
    expect(installs.sort()).toEqual(['lost@2.0.1', 'unfinished@2.0.1'])
    expect(packages.ready().packages.map(({ name }) => name)).toEqual([
      'kept',
      'lost',
      'unfinished',
    ])
  })
})

describe('reading npm', () => {
  const packument = {
    'dist-tags': { latest: '2.1.0', next: '3.0.0-beta.1' },
    versions: { '1.0.0': {}, '1.4.2': {}, '2.0.0': {}, '2.1.0': {}, '3.0.0-beta.1': {} },
  }
  test('a tag, an exact version or the highest a range takes', () => {
    expect(pickVersion(packument, 'latest')).toBe('2.1.0')
    expect(pickVersion(packument, 'next')).toBe('3.0.0-beta.1')
    expect(pickVersion(packument, '1.0.0')).toBe('1.0.0')
    expect(pickVersion(packument, '^1')).toBe('1.4.2')
    expect(pickVersion(packument, '>=2 <3')).toBe('2.1.0')
    expect(pickVersion(packument, '^9')).toBeNull()
  })

  test('an ES module entry is a module type, a module field, an import condition or .mjs', () => {
    expect(isEsmManifest({ type: 'module' })).toBe(true)
    expect(isEsmManifest({ module: 'dist/index.mjs' })).toBe(true)
    expect(isEsmManifest({ exports: { '.': { import: './a.js', require: './a.cjs' } } })).toBe(true)
    expect(isEsmManifest({ main: 'index.mjs' })).toBe(true)
    expect(isEsmManifest({ main: 'index.js' })).toBe(false)
    expect(isEsmManifest({ exports: { '.': { require: './a.cjs' } } })).toBe(false)
  })
})
