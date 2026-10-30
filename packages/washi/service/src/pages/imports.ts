import { readFileSync, realpathSync } from 'node:fs'
import { builtinModules } from 'node:module'
import { join, resolve, sep } from 'node:path'
import type { PagePackageSet } from '@washi/domain'
import { PAGE_IMPORT, PAGE_LIBRARIES } from '@washi/paper/registry'
import { parse } from '@washi/wsx'
import { PACKAGE_NAME } from '../server/constants'
import { BROWSER_CONDITIONS, LIBRARY, MISSING_PAGE_EXPORT, NOT_LISTED_WORDS } from './values'

const escaped = (name: string) => name.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')

/** One of Node's own modules, `node:` or not: a Terminal's frame lends it, or says it can't (D119). */
export const NODE_MODULE = new RegExp(`^(node:)?(${builtinModules.map(escaped).join('|')})$`)
/** A path inside the program's own folder: `./data.json`. */
export const RELATIVE = /^\.{0,2}\//

export const isNodeRequire = (path: string) => NODE_MODULE.test(path) || RELATIVE.test(path)

export const exactPattern = (paths: string[]): RegExp | null =>
  paths.length ? new RegExp(`^(${paths.map(escaped).join('|')})$`) : null

/** One of the server's packages or a subpath of it; as with a library, no segment climbs out. */
export function packagePattern(set: PagePackageSet | null): RegExp | null {
  if (!set || set.packages.length === 0) return null
  const names = set.packages.map(({ name }) => escaped(name)).join('|')
  return new RegExp(`^(${names})(/[\\w-][\\w.-]*)*$`)
}

export function isAllowedImport(path: string, set: PagePackageSet | null): boolean {
  if (path === 'washi' || path === 'washi/ui' || LIBRARY.test(path) || PAGE_IMPORT.test(path)) {
    return true
  }
  return packagePattern(set)?.test(path) ?? false
}

const packageOf = (path: string) =>
  path.startsWith('@') ? path.split('/').slice(0, 2).join('/') : (path.split('/')[0] ?? path)

/**
 * Why an import is refused, in words; on a server, a package it lacks says where to add it.
 * Node's own `fs` or `child_process` is never a package to add, `node:` or not.
 */
export function importRefusal(path: string, set: PagePackageSet | null): string {
  const name = packageOf(path)
  if (set && PACKAGE_NAME.test(name) && !NODE_MODULE.test(path) && !isAllowedImport(name, set)) {
    return `"${name}" ${NOT_LISTED_WORDS}`
  }
  const names = [...PAGE_LIBRARIES, ...(set?.packages.map((each) => each.name) ?? [])]
  return `cannot import "${path}" — a page imports from washi, washi/ui, ${names.join(', ')} or page:<id>`
}

/** The cache as the resolver reports paths in it: through every symlink (macOS's /var too). */
export function realDir(set: PagePackageSet | null): string | null {
  if (!set || set.packages.length === 0) return null
  try {
    return realpathSync(set.dir)
  } catch {
    return null
  }
}

/** Where a server package import lands — only ever inside that package's own installed folder. */
export function insidePackage(path: string, set: PagePackageSet, root: string): string {
  const name = packageOf(path)
  const folder = join(root, 'node_modules', name)
  const resolved = browserEntry(path, name, folder) ?? Bun.resolveSync(path, root)
  if (!resolved.startsWith(folder + sep)) {
    throw new Error(importRefusal(path, set))
  }
  return resolved
}

/** The first condition a sandbox can use, through nested condition maps and fallback arrays. */
function pick(target: unknown): string | null {
  if (typeof target === 'string') return target
  if (Array.isArray(target)) return target.map(pick).find((found) => found !== null) ?? null
  if (!target || typeof target !== 'object') return null
  const conditions = target as Record<string, unknown>
  for (const condition of BROWSER_CONDITIONS) {
    const found = condition in conditions ? pick(conditions[condition]) : null
    if (found) return found
  }
  return null
}

/**
 * A package's entry as a browser bundler reads it — `Bun.resolveSync` reads it as the server,
 * and a Node build (Buffer, node:crypto) does not run in the page's sandbox. Null: let Bun decide.
 */
function browserEntry(path: string, name: string, folder: string): string | null {
  let manifest: { exports?: unknown; browser?: unknown; module?: unknown }
  try {
    manifest = JSON.parse(readFileSync(join(folder, 'package.json'), 'utf8'))
  } catch {
    return null
  }
  const subpath = path === name ? '.' : `./${path.slice(name.length + 1)}`
  const { exports } = manifest
  const isSubpathMap =
    exports !== null &&
    typeof exports === 'object' &&
    !Array.isArray(exports) &&
    Object.keys(exports).some((key) => key.startsWith('.'))
  const target = isSubpathMap
    ? pick((exports as Record<string, unknown>)[subpath])
    : subpath === '.'
      ? (pick(exports) ??
        (typeof manifest.browser === 'string' ? manifest.browser : null) ??
        (typeof manifest.module === 'string' ? manifest.module : null))
      : null
  return target ? resolve(folder, target) : null
}

/** What a bundle's cache key must carry: a version moving rebuilds every page that may import it. */
export const packageKey = (set: PagePackageSet | null) =>
  set?.packages.map(({ name, version }) => `${name}@${version}`).join(',') ?? ''

/** Why a Terminal's program may not require something, in words (D119). */
export function terminalRefusal(path: string, set: PagePackageSet | null): string {
  const name = packageOf(path)
  if (set && PACKAGE_NAME.test(name) && !isAllowedImport(name, set)) {
    return `"${name}" ${NOT_LISTED_WORDS}`
  }
  const names = [...PAGE_LIBRARIES, ...(set?.packages.map((each) => each.name) ?? [])]
  return `cannot require "${path}" — a terminal requires Node's own fs, path, events, util and the like, ${names.join(', ')}, or a .json file it holds`
}

function titleOf(source: string | undefined, id: string): string {
  try {
    const title = source ? parse(source).props.title : null
    return typeof title === 'string' && title ? title : `page:${id}`
  } catch {
    return `page:${id}`
  }
}

/** A bundler's word for a `page:` import the page does not export, said with the page's title. */
export function inWords(message: string, pages: Map<string, string>): string {
  const missing = MISSING_PAGE_EXPORT.exec(message)
  if (!missing) return message
  const [, id = '', name = ''] = missing
  return `${titleOf(pages.get(id), id)} has no export named ${name}`
}
