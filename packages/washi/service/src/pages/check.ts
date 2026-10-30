import type { PagePackageSet } from '@washi/domain'
import { PAGE_IMPORT } from '@washi/paper/registry'
import { type Diagnostic, hoistedHookCalls, pageModule } from '@washi/wsx'
import { importRefusal, isAllowedImport } from './imports'
import { PAGE_CODE_MAX_CHARS } from './values'

const transpiler = new Bun.Transpiler({ loader: 'tsx' })

const problem = (message: string): Diagnostic => ({ severity: 'error', path: 'Sheet', message })

/**
 * A page's code checked at save: it compiles, and imports only what a page may (D100) — on a
 * server, its page packages too (D116) — and never itself (`self`, the page's own id).
 */
export function pageCodeDiagnostics(
  source: string,
  packages: PagePackageSet | null = null,
  self: string | null = null,
): Diagnostic[] {
  if (source.length > PAGE_CODE_MAX_CHARS) {
    return [problem(`a page that runs code is at most ${PAGE_CODE_MAX_CHARS} characters`)]
  }
  try {
    const module = pageModule(source)
    const paths = transpiler.scan(module).imports.map((each) => each.path)
    const refused = paths.filter((path) => !isAllowedImport(path, packages))
    const itself = paths
      .filter((path) => self !== null && PAGE_IMPORT.exec(path)?.[1] === self)
      .map((path) =>
        problem(
          `this page imports itself (${path}) — a page uses its own code without importing it`,
        ),
      )
    transpiler.transformSync(module)
    const hooks = hoistedHookCalls(source).map((hook) =>
      problem(
        `an export calls ${hook}() as the page loads, not as it draws — export a function that calls it (export function useTotals() { … })`,
      ),
    )
    return [...refused.map((path) => problem(importRefusal(path, packages))), ...itself, ...hooks]
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return [problem(`code: ${message.split('\n')[0] ?? message}`)]
  }
}
