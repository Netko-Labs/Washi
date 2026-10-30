import { realpathSync } from 'node:fs'
import { join, sep } from 'node:path'
import type { PagePackageSet } from '@washi/domain'
import { PAGE_IMPORT, PAGE_LIBRARIES } from '@washi/paper/registry'
import { PACKAGE_NAME } from '../server/constants'
import { LIBRARY, NOT_LISTED_WORDS } from './values'

const escaped = (name: string) => name.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')

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

/** Why an import is refused, in words; on a server, a package it lacks says where to add it. */
export function importRefusal(path: string, set: PagePackageSet | null): string {
  const name = packageOf(path)
  if (set && PACKAGE_NAME.test(name) && !isAllowedImport(name, set)) {
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
  const resolved = Bun.resolveSync(path, root)
  if (!resolved.startsWith(join(root, 'node_modules', name) + sep)) {
    throw new Error(importRefusal(path, set))
  }
  return resolved
}

/** What a bundle's cache key must carry: a version moving rebuilds every page that may import it. */
export const packageKey = (set: PagePackageSet | null) =>
  set?.packages.map(({ name, version }) => `${name}@${version}`).join(',') ?? ''
