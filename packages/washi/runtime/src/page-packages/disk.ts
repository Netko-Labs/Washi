import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { INSTALL_ENV_KEYS, INSTALL_TIMEOUT_MS, NPM_REGISTRY } from './constants'
import type { InstalledPackage } from './types'

const folderOf = (dir: string, name: string) => join(dir, 'node_modules', name)

/** An `import` condition anywhere in `exports`, or an entry that can only be ESM. */
function hasImportEntry(exports: unknown): boolean {
  if (typeof exports === 'string') return exports.endsWith('.mjs')
  if (!exports || typeof exports !== 'object') return false
  return Object.entries(exports).some(
    ([key, value]) => key === 'import' || key === 'module' || hasImportEntry(value),
  )
}

export function isEsmManifest(manifest: Record<string, unknown>): boolean {
  return (
    manifest.type === 'module' ||
    typeof manifest.module === 'string' ||
    hasImportEntry(manifest.exports) ||
    (typeof manifest.main === 'string' && manifest.main.endsWith('.mjs'))
  )
}

/** The package's own files, its nested dependencies not counted. */
export function folderBytes(folder: string): number {
  let total = 0
  for (const file of new Bun.Glob('**/*').scanSync({ cwd: folder, onlyFiles: true, dot: true })) {
    if (!file.startsWith('node_modules')) total += Bun.file(join(folder, file)).size
  }
  return total
}

export function installedPackage(dir: string, name: string): InstalledPackage | null {
  const folder = folderOf(dir, name)
  try {
    const manifest = JSON.parse(readFileSync(join(folder, 'package.json'), 'utf8'))
    if (typeof manifest?.version !== 'string') return null
    return { version: manifest.version, isEsm: isEsmManifest(manifest), bytes: folderBytes(folder) }
  } catch {
    return null
  }
}

/** A project of its own, so bun never mistakes the data volume for part of anything else. */
export function ensureProject(dir: string): void {
  mkdirSync(dir, { recursive: true })
  const manifest = join(dir, 'package.json')
  if (!existsSync(manifest)) {
    writeFileSync(manifest, `${JSON.stringify({ name: 'washi-page-packages', private: true })}\n`)
  }
}

async function bun(dir: string, args: string[]): Promise<void> {
  const env = Object.fromEntries(
    INSTALL_ENV_KEYS.flatMap((key) => (process.env[key] ? [[key, process.env[key]]] : [])),
  )
  const child = Bun.spawn([process.execPath, ...args], {
    cwd: dir,
    env,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: INSTALL_TIMEOUT_MS,
  })
  const [code, stderr] = await Promise.all([child.exited, new Response(child.stderr).text()])
  if (code !== 0) {
    const said = stderr.trim().split('\n').filter(Boolean).at(-1)
    throw new Error(said ?? `bun ${args[0]} stopped (${code})`)
  }
}

/**
 * Exact, no lifecycle scripts (bun never runs a dependency's either), hoisted so every package
 * is a real folder under `node_modules` — the only place a page's import may resolve to.
 */
export function bunAdd(dir: string, name: string, version: string): Promise<void> {
  ensureProject(dir)
  return bun(dir, [
    'add',
    '--exact',
    '--ignore-scripts',
    '--linker=hoisted',
    `--registry=${NPM_REGISTRY}`,
    '--no-progress',
    `${name}@${version}`,
  ])
}

export function bunRemove(dir: string, name: string): Promise<void> {
  return bun(dir, ['remove', '--ignore-scripts', '--linker=hoisted', '--no-progress', name])
}
