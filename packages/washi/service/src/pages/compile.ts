import { sep } from 'node:path'
import { PAGE_HOOKS, PAGE_IMPORT, paperRegistry, WIDGET_HOOKS } from '@washi/paper/registry'
import { pageModule } from '@washi/wsx'
import { isAllowedImport } from './check'
import type { BundleTarget, CompiledPage, PageSource } from './types'
import {
  IMPORT_WORDS,
  LIBRARY,
  PAGE_CACHE_SIZE,
  PAGE_IMPORT_DEPTH,
  PAGE_JS_MAX_BYTES,
} from './values'

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
    throw new Error(`cannot import "${path}" — ${IMPORT_WORDS}`)
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

function plugin(module: string, pages: Map<string, string>, target: BundleTarget): Bun.BunPlugin {
  return {
    name: 'washi-page',
    setup(build) {
      build.onResolve({ filter: /^washi:(entry|self)$/ }, ({ path }) => ({ path, namespace: NS }))
      build.onResolve({ filter: /^washi(\/ui)?$/ }, ({ path }) => ({ path, namespace: NS }))
      build.onResolve({ filter: PAGE_IMPORT }, ({ path }) => ({ path, namespace: NS }))
      build.onResolve({ filter: LIBRARY }, ({ path }) => ({ path: insideLibrary(path) }))
      build.onResolve({ filter: REACT }, ({ path, importer }) =>
        target.react && importer === 'washi'
          ? { path: Bun.resolveSync(path, import.meta.dir) }
          : undefined,
      )
      build.onResolve({ filter: /.*/, namespace: NS }, ({ path }) => {
        throw new Error(`cannot import "${path}" — ${IMPORT_WORDS}`)
      })
      build.onLoad({ filter: /.*/, namespace: NS }, ({ path }) => {
        if (path === 'washi:entry') return { contents: target.entry, loader: 'js' }
        if (path === 'washi:self') return { contents: module, loader: 'tsx' }
        if (path === 'washi') return { contents: target.washi, loader: 'js' }
        if (path === 'washi/ui') return { contents: UI, loader: 'js' }
        const source = pages.get(PAGE_IMPORT.exec(path)?.[1] ?? '')
        return { contents: source ? pageModule(source) : '', loader: 'tsx' }
      })
    },
  }
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
 * vetted list or a page the reader may read. Cached by everything that went in.
 */
export async function bundle(
  module: string,
  read: PageSource,
  target: BundleTarget,
  key: string[],
): Promise<CompiledPage> {
  let pages: Map<string, string>
  try {
    const refused = transpiler.scan(module).imports.find(({ path }) => !isAllowedImport(path))
    if (refused) return failure(`cannot import "${refused.path}" — ${IMPORT_WORDS}`)
    pages = importedPages(module, read)
  } catch (error) {
    return failure(error)
  }
  const hash = Bun.hash([...key, ...pages.values()].join('\0')).toString(36)
  const known = cache.get(hash)
  if (known) return remember(hash, known)

  try {
    const built = await Bun.build({
      entrypoints: ['washi:entry'],
      format: 'iife',
      target: 'browser',
      minify: target.minify,
      define: { 'process.env.NODE_ENV': '"production"' },
      jsx: { runtime: 'classic', factory: 'h', fragment: 'Fragment' },
      plugins: [plugin(module, pages, target)],
      throw: false,
    })
    const output = built.outputs[0]
    if (!built.success || !output) return failure(built.logs[0]?.message ?? 'it did not compile')
    const js = await output.text()
    if (js.length > PAGE_JS_MAX_BYTES) {
      return failure(`it bundles to ${Math.round(js.length / 1024)} KB — import less`)
    }
    return remember(hash, { ok: true, js })
  } catch (error) {
    return failure(error)
  }
}

/** A page bundled for the reader's QuickJS sandbox (D100), `washi`'s hooks calls into its own. */
export async function compilePage(source: string, read: PageSource): Promise<CompiledPage> {
  try {
    return await bundle(pageModule(source), read, PAGE_TARGET, ['page', source])
  } catch (error) {
    return failure(error)
  }
}
