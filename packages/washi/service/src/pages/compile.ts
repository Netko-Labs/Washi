import { PAGE_HOOKS, PAGE_IMPORT, paperRegistry } from '@washi/paper/registry'
import { pageModule } from '@washi/wsx'
import { isAllowedImport } from './check'
import type { CompiledPage, PageSource } from './types'
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

const ENTRY = `import view, * as exports from 'washi:self'\nglobalThis.__page = { view, exports }`
const HOOKS = PAGE_HOOKS.map(
  (name) => `export const ${name} = (...args) => globalThis.__washi.${name}(...args)`,
).join('\n')
const UI = Object.keys(paperRegistry.components)
  .map((name) => `export const ${name} = '${name}'`)
  .join('\n')

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

function plugin(module: string, pages: Map<string, string>): Bun.BunPlugin {
  return {
    name: 'washi-page',
    setup(build) {
      build.onResolve({ filter: /^washi:(entry|self)$/ }, ({ path }) => ({ path, namespace: NS }))
      build.onResolve({ filter: /^washi(\/ui)?$/ }, ({ path }) => ({ path, namespace: NS }))
      build.onResolve({ filter: PAGE_IMPORT }, ({ path }) => ({ path, namespace: NS }))
      build.onResolve({ filter: LIBRARY }, ({ path }) => ({
        path: Bun.resolveSync(path, import.meta.dir),
      }))
      build.onResolve({ filter: /.*/, namespace: NS }, ({ path }) => {
        throw new Error(`cannot import "${path}" — ${IMPORT_WORDS}`)
      })
      build.onLoad({ filter: /.*/, namespace: NS }, ({ path }) => {
        if (path === 'washi:entry') return { contents: ENTRY, loader: 'js' }
        if (path === 'washi:self') return { contents: module, loader: 'tsx' }
        if (path === 'washi') return { contents: HOOKS, loader: 'js' }
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

const failure = (error: unknown): CompiledPage => {
  const message = error instanceof Error ? error.message : String(error)
  return { ok: false, error: message.split('\n')[0] ?? message }
}

/**
 * A page bundled for the reader's sandbox (D100): its module, the libraries and pages it imports,
 * `washi`'s hooks as calls into the sandbox's own. Nothing in it reaches the network — every import
 * is resolved here, from the vetted list or a page the reader may read.
 */
export async function compilePage(source: string, read: PageSource): Promise<CompiledPage> {
  let module: string
  let pages: Map<string, string>
  try {
    module = pageModule(source)
    const refused = transpiler.scan(module).imports.find(({ path }) => !isAllowedImport(path))
    if (refused) return failure(`cannot import "${refused.path}" — ${IMPORT_WORDS}`)
    pages = importedPages(module, read)
  } catch (error) {
    return failure(error)
  }
  const key = Bun.hash([source, ...pages.values()].join('\0')).toString(36)
  const known = cache.get(key)
  if (known) return remember(key, known)

  try {
    const built = await Bun.build({
      entrypoints: ['washi:entry'],
      format: 'iife',
      target: 'browser',
      minify: { whitespace: true, syntax: true },
      jsx: { runtime: 'classic', factory: 'h', fragment: 'Fragment' },
      plugins: [plugin(module, pages)],
      throw: false,
    })
    const output = built.outputs[0]
    if (!built.success || !output) return failure(built.logs[0]?.message ?? 'it did not compile')
    const js = await output.text()
    if (js.length > PAGE_JS_MAX_BYTES) {
      return failure(`the page bundles to ${Math.round(js.length / 1024)} KB — import less`)
    }
    return remember(key, { ok: true, js })
  } catch (error) {
    return failure(error)
  }
}
