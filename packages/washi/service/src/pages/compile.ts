import { sep } from 'node:path'
import { CODE_LIMITS, type CodeLimits, type PagePackageSet } from '@washi/domain'
import { PAGE_HOOKS, PAGE_IMPORT, paperRegistry, WIDGET_HOOKS } from '@washi/paper/registry'
import { pageModule } from '@washi/wsx'
import {
  importRefusal,
  insidePackage,
  isAllowedImport,
  isNodeRequire,
  NODE_MODULE,
  packageKey,
  packagePattern,
  RELATIVE,
  realDir,
} from './imports'
import type { BundleTarget, CompiledPage, PageSource } from './types'
import { KB, LIBRARY, MB, PAGE_CACHE_SIZE, PAGE_IMPORT_DEPTH } from './values'

const NS = 'washi'
const transpiler = new Bun.Transpiler({ loader: 'tsx' })
const cache = new Map<string, CompiledPage>()

const REACT = /^react(-dom)?(\/[\w-]+)*$/
const HOOKS = [
  ...PAGE_HOOKS.map(
    (name) => `export const ${name} = (...args) => globalThis.__washi.${name}(...args)`,
  ),
  ...WIDGET_HOOKS.map(
    (name) => `export const ${name} = () => { throw new Error('${name} works inside a widget') }`,
  ),
].join('\n')
const UI = Object.keys(paperRegistry.components)
  .map((name) => `export const ${name} = '${name}'`)
  .join('\n')

/** Where a library import lands — only ever inside that library's own folder. */
function insideLibrary(path: string): string {
  const name = LIBRARY.exec(path)?.[1] ?? ''
  const resolved = Bun.resolveSync(path, import.meta.dir)
  if (!resolved.includes(`${sep}node_modules${sep}${name}${sep}`)) {
    throw new Error(importRefusal(path, null))
  }
  return resolved
}

/** Every page a module imports, transitively, with its source — the cache key and the bundle's input. */
function importedPages(module: string, read: PageSource): Map<string, string> {
  const found = new Map<string, string>()
  const visit = (code: string, depth: number) => {
    if (depth > PAGE_IMPORT_DEPTH) throw new Error('page imports go too deep — is there a loop?')
    for (const { path } of transpiler.scan(code).imports) {
      const id = PAGE_IMPORT.exec(path)?.[1]
      if (!id || found.has(id)) continue
      const source = read(id)
      if (source === null) throw new Error(`page:${id} is not a page you can read`)
      found.set(id, source)
      visit(pageModule(source), depth + 1)
    }
  }
  visit(module, 0)
  return found
}

function plugin(
  module: string,
  pages: Map<string, string>,
  target: BundleTarget,
  packages: PagePackageSet | null,
): Bun.BunPlugin {
  const listed = packagePattern(packages)
  const root = realDir(packages)
  // A server package's own React (a component kit's peer) is the frame's, never a second copy.
  const lendsReact = (importer: string) =>
    importer === 'washi' || Boolean(root && importer.startsWith(root + sep))
  const refusal = target.refusal ?? importRefusal
  return {
    name: 'washi-page',
    setup(build) {
      if (target.node) {
        build.onResolve({ filter: NODE_MODULE }, ({ path }) => ({
          path: `node:${path.replace(/^node:/, '')}`,
          namespace: NS,
        }))
        build.onResolve({ filter: RELATIVE }, ({ path, importer }) =>
          importer === 'washi:self' ? { path: `local:${path}`, namespace: NS } : undefined,
        )
      }
      build.onResolve({ filter: /^washi:(entry|self)$/ }, ({ path }) => ({ path, namespace: NS }))
      build.onResolve({ filter: /^washi(\/ui)?$/ }, ({ path }) => ({ path, namespace: NS }))
      build.onResolve({ filter: PAGE_IMPORT }, ({ path }) => ({ path, namespace: NS }))
      build.onResolve({ filter: LIBRARY }, ({ path }) => ({ path: insideLibrary(path) }))
      if (listed && packages && root) {
        build.onResolve({ filter: listed }, ({ path }) => ({
          path: insidePackage(path, packages, root),
        }))
      }
      build.onResolve({ filter: REACT }, ({ path, importer }) =>
        target.react && lendsReact(importer)
          ? { path: Bun.resolveSync(path, import.meta.dir) }
          : undefined,
      )
      build.onResolve({ filter: /.*/, namespace: NS }, ({ path }) => {
        throw new Error(refusal(path, packages))
      })
      build.onLoad({ filter: /.*/, namespace: NS }, ({ path }) => {
        if (path === 'washi:entry') return { contents: target.entry, loader: 'js' }
        if (path === 'washi:self') return { contents: module, loader: target.selfLoader ?? 'tsx' }
        const shim = /^(node|local):(.+)$/.exec(path)
        if (shim) {
          const lend = shim[1] === 'node' ? 'builtin' : 'local'
          const contents = `module.exports = globalThis.__terminal.${lend}(${JSON.stringify(shim[2])})`
          return { contents, loader: 'js' }
        }
        if (path === 'washi') return { contents: target.washi, loader: 'js' }
        if (path === 'washi/ui') return { contents: UI, loader: 'js' }
        const source = pages.get(PAGE_IMPORT.exec(path)?.[1] ?? '')
        return { contents: source ? pageModule(source) : '', loader: 'tsx' }
      })
    },
  }
}

/** The cap is checked on every answer, cached or not: an admin may have lowered it since. */
function capped(compiled: CompiledPage, maxBytes: number): CompiledPage {
  if (!compiled.ok || compiled.js.length <= maxBytes) return compiled
  return failure(`it bundles to ${Math.round(compiled.js.length / KB)} KB — import less`)
}

function remember(key: string, compiled: CompiledPage): CompiledPage {
  cache.delete(key)
  cache.set(key, compiled)
  if (cache.size > PAGE_CACHE_SIZE) cache.delete(cache.keys().next().value ?? '')
  return compiled
}

export const failure = (error: unknown): CompiledPage => {
  const message = error instanceof Error ? error.message : String(error)
  return { ok: false, error: message.split('\n')[0] ?? message }
}

/** The page as its sandbox runs it: `view` and its exports on `globalThis.__page`. */
const PAGE_TARGET: BundleTarget = {
  entry: `import view, * as exports from 'washi:self'\nglobalThis.__page = { view, exports }`,
  washi: HOOKS,
  react: false,
  minify: { whitespace: true, syntax: true },
}

/**
 * A page's module bundled for where it runs: the libraries and pages it imports, `washi` as that
 * place lends it. Nothing in it reaches the network — every import is resolved here, from the
 * vetted list, the server's installed page packages or a page the reader may read. Cached by
 * everything that went in; `maxBytes` is the server's cap (D118).
 */
export async function bundle(
  module: string,
  read: PageSource,
  target: BundleTarget,
  key: string[],
  packages: PagePackageSet | null,
  maxBytes: number,
): Promise<CompiledPage> {
  let pages: Map<string, string>
  try {
    const refused = transpiler
      .scan(module)
      .imports.find(
        ({ path }) => !isAllowedImport(path, packages) && !(target.node && isNodeRequire(path)),
      )
    if (refused) return failure((target.refusal ?? importRefusal)(refused.path, packages))
    pages = importedPages(module, read)
  } catch (error) {
    return failure(error)
  }
  const hash = Bun.hash([...key, packageKey(packages), ...pages.values()].join('\0')).toString(36)
  const known = cache.get(hash)
  if (known) return capped(remember(hash, known), maxBytes)

  try {
    const built = await Bun.build({
      entrypoints: ['washi:entry'],
      format: 'iife',
      target: 'browser',
      minify: target.minify,
      define: { 'process.env.NODE_ENV': '"production"', ...target.define },
      jsx: { runtime: 'classic', factory: 'h', fragment: 'Fragment' },
      plugins: [plugin(module, pages, target, packages)],
      throw: false,
    })
    const output = built.outputs[0]
    if (!built.success || !output) return failure(built.logs[0]?.message ?? 'it did not compile')
    return capped(remember(hash, { ok: true, js: await output.text() }), maxBytes)
  } catch (error) {
    return failure(error)
  }
}

/**
 * A page bundled for the reader's QuickJS sandbox (D100), `washi`'s hooks calls into its own; the
 * sandbox's budget rides along, so the reader's browser squeezes it as the server says (D118).
 */
export async function compilePage(
  source: string,
  read: PageSource,
  packages: PagePackageSet | null = null,
  limits: CodeLimits = CODE_LIMITS,
): Promise<CompiledPage> {
  try {
    const compiled = await bundle(
      pageModule(source),
      read,
      PAGE_TARGET,
      ['page', source],
      packages,
      limits.pageBundleKb * KB,
    )
    if (!compiled.ok) return compiled
    const sandbox = { deadlineMs: limits.pageDrawMs, memoryBytes: limits.pageMemoryMb * MB }
    return { ...compiled, sandbox }
  } catch (error) {
    return failure(error)
  }
}
